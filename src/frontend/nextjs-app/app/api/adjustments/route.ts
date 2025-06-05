import { NextResponse } from 'next/server';
import { query } from '@/app/lib/postgres';
import { withAuth, AuthenticatedRequest } from '@/app/lib/auth-middleware';

// Helper to ensure table exists
async function ensureForecastAdjustmentsTable() {
  try {
    // Check if table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'forecast_adjustments'
      ) as exists
    `);

    if (!tableCheck.rows[0]?.exists) {
      console.log('Creating forecast_adjustments table...');

      // Create the table
      await query(`
        CREATE TABLE IF NOT EXISTS forecast_adjustments (
          id SERIAL PRIMARY KEY,
          adjustment_value DECIMAL(5,2) NOT NULL,
          filter_context JSONB NOT NULL,
          inventory_item_name VARCHAR(255),
          user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          user_email VARCHAR(255),
          user_name VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          adjustment_start_date DATE,
          adjustment_end_date DATE
        )
      `);

      // Create indexes
      await query(`
        CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_created_at ON forecast_adjustments(created_at DESC)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_inventory_item ON forecast_adjustments(inventory_item_name)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_filter_context ON forecast_adjustments USING GIN(filter_context)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_user_id ON forecast_adjustments(user_id)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_is_active ON forecast_adjustments(is_active)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_user_email ON forecast_adjustments(user_email)
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_forecast_adjustments_date_range
        ON forecast_adjustments(adjustment_start_date, adjustment_end_date)
        WHERE adjustment_start_date IS NOT NULL
      `);

      // Create update trigger
      await query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      await query(`
        DROP TRIGGER IF EXISTS update_forecast_adjustments_updated_at ON forecast_adjustments
      `);

      await query(`
        CREATE TRIGGER update_forecast_adjustments_updated_at
        BEFORE UPDATE ON forecast_adjustments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `);

      console.log('Forecast adjustments table created successfully');
    }
  } catch (error) {
    console.error('Failed to ensure forecast adjustments table:', error);
    throw error;
  }
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Ensure table exists
    await ensureForecastAdjustmentsTable();

    const body = await request.json();
    const { adjustmentValue, filterContext, inventoryItemName } = body;

    // Validate required fields
    if (typeof adjustmentValue !== 'number') {
      return NextResponse.json(
        { error: 'Adjustment value is required and must be a number' },
        { status: 400 }
      );
    }

    // Validate adjustment range (-100% to +100%)
    if (adjustmentValue < -100 || adjustmentValue > 100) {
      return NextResponse.json(
        { error: 'Adjustment value must be between -100% and 100%' },
        { status: 400 }
      );
    }

    if (!filterContext) {
      return NextResponse.json(
        { error: 'Filter context is required' },
        { status: 400 }
      );
    }

    // Validate filter context structure
    if (!filterContext.dateRange ||
        !Array.isArray(filterContext.states) ||
        !Array.isArray(filterContext.dmaIds) ||
        !Array.isArray(filterContext.dcIds)) {
      return NextResponse.json(
        { error: 'Invalid filter context structure' },
        { status: 400 }
      );
    }

    // Extract adjustment time window if present
    const adjustmentStartDate = filterContext.adjustmentDateRange?.startDate || null;
    const adjustmentEndDate = filterContext.adjustmentDateRange?.endDate || null;

    // Insert adjustment into database with multi-user support
    const result = await query<{
      id: number;
      adjustment_value: number;
      filter_context: Record<string, unknown>;
      inventory_item_name: string | null;
      user_id: string;
      user_email: string;
      user_name: string;
      is_active: boolean;
      created_at: string;
      adjustment_start_date: string | null;
      adjustment_end_date: string | null;
    }>(`
      INSERT INTO forecast_adjustments (
        adjustment_value,
        filter_context,
        inventory_item_name,
        user_id,
        user_email,
        user_name,
        created_at,
        adjustment_start_date,
        adjustment_end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
      RETURNING id, adjustment_value, filter_context, inventory_item_name, user_id, user_email, user_name, is_active, created_at, adjustment_start_date, adjustment_end_date
    `, [
      adjustmentValue,
      JSON.stringify(filterContext),
      inventoryItemName || null,
      request.user?.sub,
      request.user?.email,
      request.user?.username || request.user?.email?.split('@')[0] || 'Unknown',
      adjustmentStartDate,
      adjustmentEndDate
    ]);

    const savedAdjustment = result.rows[0];

    return NextResponse.json({
      success: true,
      adjustment: {
        id: savedAdjustment.id,
        adjustmentValue: savedAdjustment.adjustment_value,
        filterContext: savedAdjustment.filter_context,
        inventoryItemName: savedAdjustment.inventory_item_name,
        userId: savedAdjustment.user_id,
        userEmail: savedAdjustment.user_email,
        userName: savedAdjustment.user_name,
        isActive: savedAdjustment.is_active,
        timestamp: savedAdjustment.created_at,
        adjustmentStartDate: savedAdjustment.adjustment_start_date,
        adjustmentEndDate: savedAdjustment.adjustment_end_date
      }
    });

  } catch (error) {
    console.error('Error saving adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to save adjustment' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Ensure table exists
    await ensureForecastAdjustmentsTable();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const inventoryItemName = searchParams.get('inventoryItemName');

    // Build query based on parameters
    let queryStr = `
      SELECT id, adjustment_value, filter_context, inventory_item_name,
             user_id, user_email, user_name, is_active, created_at, updated_at,
             adjustment_start_date, adjustment_end_date
      FROM forecast_adjustments
      WHERE is_active = true
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    // Filter by user if not showing all
    if (!showAll) {
      queryStr += ` AND user_id = $${paramIndex}`;
      params.push(request.user?.sub);
      paramIndex++;
    }

    // Filter by inventory item if provided
    if (inventoryItemName) {
      queryStr += ` AND inventory_item_name = $${paramIndex}`;
      params.push(inventoryItemName);
      paramIndex++;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query<{
      id: number;
      adjustment_value: number;
      filter_context: Record<string, unknown>;
      inventory_item_name: string | null;
      user_id: string;
      user_email: string;
      user_name: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      adjustment_start_date: string | null;
      adjustment_end_date: string | null;
    }>(queryStr, params);

    const adjustments = result.rows.map((row) => ({
      id: row.id,
      adjustmentValue: row.adjustment_value,
      filterContext: row.filter_context,
      inventoryItemName: row.inventory_item_name,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      isActive: row.is_active,
      timestamp: row.created_at,
      updatedAt: row.updated_at,
      adjustmentStartDate: row.adjustment_start_date,
      adjustmentEndDate: row.adjustment_end_date,
      isOwn: row.user_id === request.user?.sub
    }));

    return NextResponse.json({
      adjustments,
      currentUserId: request.user?.sub
    });

  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Ensure table exists
    await ensureForecastAdjustmentsTable();

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Adjustment ID is required' },
        { status: 400 }
      );
    }

    // First check if the adjustment belongs to the user
    const checkResult = await query<{ user_id: string }>(`
      SELECT user_id FROM forecast_adjustments WHERE id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== request.user?.sub) {
      return NextResponse.json(
        { error: 'You can only edit your own adjustments' },
        { status: 403 }
      );
    }

    // Update the adjustment
    const updateResult = await query<{
      id: number;
      is_active: boolean;
      updated_at: string;
    }>(`
      UPDATE forecast_adjustments
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING id, is_active, updated_at
    `, [isActive, id, request.user?.sub]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update adjustment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      adjustment: {
        id: updateResult.rows[0].id,
        isActive: updateResult.rows[0].is_active,
        updatedAt: updateResult.rows[0].updated_at
      }
    });

  } catch (error) {
    console.error('Error updating adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to update adjustment' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Ensure table exists
    await ensureForecastAdjustmentsTable();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Adjustment ID is required' },
        { status: 400 }
      );
    }

    // First check if the adjustment belongs to the user
    const checkResult = await query<{ user_id: string }>(`
      SELECT user_id FROM forecast_adjustments WHERE id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== request.user?.sub) {
      return NextResponse.json(
        { error: 'You can only delete your own adjustments' },
        { status: 403 }
      );
    }

    // Delete the adjustment
    await query(`
      DELETE FROM forecast_adjustments
      WHERE id = $1 AND user_id = $2
    `, [id, request.user?.sub]);

    return NextResponse.json({
      success: true,
      message: 'Adjustment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to delete adjustment' },
      { status: 500 }
    );
  }
});
