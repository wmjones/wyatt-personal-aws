import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/postgres';

export async function POST(request: NextRequest) {
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

    if (!filterContext) {
      return NextResponse.json(
        { error: 'Filter context is required' },
        { status: 400 }
      );
    }

    // Insert adjustment into database
    const result = await query<{
      id: number;
      adjustment_value: number;
      filter_context: Record<string, unknown>;
      inventory_item_name: string | null;
      created_at: string;
    }>(`
      INSERT INTO forecast_adjustments (
        adjustment_value,
        filter_context,
        inventory_item_name,
        created_at
      ) VALUES ($1, $2, $3, NOW())
      RETURNING id, adjustment_value, filter_context, inventory_item_name, created_at
    `, [adjustmentValue, JSON.stringify(filterContext), inventoryItemName || null]);

    const savedAdjustment = result.rows[0];

    return NextResponse.json({
      success: true,
      adjustment: {
        id: savedAdjustment.id,
        adjustmentValue: savedAdjustment.adjustment_value,
        filterContext: savedAdjustment.filter_context,
        inventoryItemName: savedAdjustment.inventory_item_name,
        timestamp: savedAdjustment.created_at
      }
    });

  } catch (error) {
    console.error('Error saving adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to save adjustment' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch recent adjustments, ordered by most recent first
    const result = await query<{
      id: number;
      adjustment_value: number;
      filter_context: Record<string, unknown>;
      inventory_item_name: string | null;
      created_at: string;
    }>(`
      SELECT id, adjustment_value, filter_context, inventory_item_name, created_at
      FROM forecast_adjustments
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const adjustments = result.rows.map((row) => ({
      id: row.id,
      adjustmentValue: row.adjustment_value,
      filterContext: row.filter_context,
      inventoryItemName: row.inventory_item_name,
      timestamp: row.created_at
    }));

    return NextResponse.json({ adjustments });

  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
}
