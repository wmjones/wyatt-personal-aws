import { NextResponse } from 'next/server';
import { query } from '@/app/lib/postgres';
import { withAuth, AuthenticatedRequest } from '@/app/lib/auth-middleware';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
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

    // Insert adjustment into database
    const result = await query<{
      id: number;
      adjustment_value: number;
      filter_context: Record<string, unknown>;
      inventory_item_name: string | null;
      user_id: string;
      created_at: string;
    }>(`
      INSERT INTO forecast_adjustments (
        adjustment_value,
        filter_context,
        inventory_item_name,
        user_id,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, adjustment_value, filter_context, inventory_item_name, user_id, created_at
    `, [adjustmentValue, JSON.stringify(filterContext), inventoryItemName || null, request.user?.sub]);

    const savedAdjustment = result.rows[0];

    return NextResponse.json({
      success: true,
      adjustment: {
        id: savedAdjustment.id,
        adjustmentValue: savedAdjustment.adjustment_value,
        filterContext: savedAdjustment.filter_context,
        inventoryItemName: savedAdjustment.inventory_item_name,
        userId: savedAdjustment.user_id,
        timestamp: savedAdjustment.created_at
      }
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to save adjustment' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Fetch recent adjustments for the authenticated user
    const result = await query<{
      id: number;
      adjustment_value: number;
      filter_context: Record<string, unknown>;
      inventory_item_name: string | null;
      user_id: string;
      created_at: string;
    }>(`
      SELECT id, adjustment_value, filter_context, inventory_item_name, user_id, created_at
      FROM forecast_adjustments
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [request.user?.sub]);

    const adjustments = result.rows.map((row) => ({
      id: row.id,
      adjustmentValue: row.adjustment_value,
      filterContext: row.filter_context,
      inventoryItemName: row.inventory_item_name,
      userId: row.user_id,
      timestamp: row.created_at
    }));

    return NextResponse.json({ adjustments });

  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
});