import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/postgres';
import { AdjustmentHistoryEntry, AdjustmentType, AdjustmentReason } from '@/app/types/demand-planning';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  sub: string;
  email?: string;
  name?: string;
  'cognito:username'?: string;
}

/**
 * Extract and verify JWT token from Authorization header
 */
function getAuthUser(request: NextRequest): DecodedToken | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    // For now, we'll decode without verification since we're behind API Gateway
    // In production, you'd want to verify against Cognito's public keys
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * GET /api/adjustments
 * Fetch all adjustments for a forecast (visible to all authenticated users)
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get forecast_id from query params
    const searchParams = request.nextUrl.searchParams;
    const forecastId = searchParams.get('forecast_id') || 'forecast-001';

    // Fetch all adjustments for the forecast
    const result = await query<{
      id: string;
      forecast_id: string;
      user_id: string;
      user_email: string;
      user_name: string;
      time_periods: string[];
      type: string;
      value: string;
      reason: string;
      notes: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      before_total: string | null;
      after_total: string | null;
      absolute_change: string | null;
      percentage_change: string | null;
    }>(
      `SELECT
        id,
        forecast_id,
        user_id,
        user_email,
        user_name,
        time_periods,
        adjustment_type AS type,
        adjustment_value AS value,
        reason,
        notes,
        is_active,
        created_at,
        updated_at,
        before_total,
        after_total,
        absolute_change,
        percentage_change
      FROM forecast.adjustments
      WHERE forecast_id = $1
      ORDER BY created_at DESC`,
      [forecastId]
    );

    // Transform to match frontend interface
    const adjustments: AdjustmentHistoryEntry[] = result.rows.map(row => ({
      id: row.id,
      timePeriods: row.time_periods,
      type: row.type as AdjustmentType,
      value: parseFloat(row.value),
      reason: row.reason as AdjustmentReason,
      notes: row.notes || undefined,
      createdBy: row.user_name || row.user_email,
      createdAt: row.created_at,
      appliedToForecasts: [row.forecast_id],
      impact: {
        beforeTotal: parseFloat(row.before_total || '0'),
        afterTotal: parseFloat(row.after_total || '0'),
        absoluteChange: parseFloat(row.absolute_change || '0'),
        percentageChange: parseFloat(row.percentage_change || '0')
      },
      // Additional fields for multi-user support
      userId: row.user_id,
      userEmail: row.user_email,
      isActive: row.is_active,
      updatedAt: row.updated_at
    }));

    return NextResponse.json(adjustments);
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/adjustments
 * Create a new adjustment (any authenticated user can create)
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      forecastId = 'forecast-001',
      timePeriods,
      type,
      value,
      reason,
      notes,
      impact
    } = body;

    // Validate required fields
    if (!timePeriods || !type || value === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new adjustment
    const result = await query<{
      id: string;
      forecast_id: string;
      user_id: string;
      user_email: string;
      user_name: string;
      time_periods: string[];
      adjustment_type: string;
      adjustment_value: string;
      reason: string;
      notes: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      before_total: string | null;
      after_total: string | null;
      absolute_change: string | null;
      percentage_change: string | null;
    }>(
      `INSERT INTO forecast.adjustments (
        forecast_id,
        user_id,
        user_email,
        user_name,
        time_periods,
        adjustment_type,
        adjustment_value,
        reason,
        notes,
        before_total,
        after_total,
        absolute_change,
        percentage_change
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        forecastId,
        user.sub,
        user.email || user['cognito:username'] || user.sub,
        user.name || user['cognito:username'] || user.email || 'Unknown User',
        timePeriods,
        type,
        value,
        reason,
        notes || null,
        impact?.beforeTotal || 0,
        impact?.afterTotal || 0,
        impact?.absoluteChange || 0,
        impact?.percentageChange || 0
      ]
    );

    const newAdjustment = result.rows[0];

    // Transform to match frontend interface
    const adjustmentEntry: AdjustmentHistoryEntry = {
      id: newAdjustment.id,
      timePeriods: newAdjustment.time_periods,
      type: newAdjustment.adjustment_type as AdjustmentType,
      value: parseFloat(newAdjustment.adjustment_value),
      reason: newAdjustment.reason as AdjustmentReason,
      notes: newAdjustment.notes || undefined,
      createdBy: newAdjustment.user_name || newAdjustment.user_email,
      createdAt: newAdjustment.created_at,
      appliedToForecasts: [newAdjustment.forecast_id],
      impact: {
        beforeTotal: parseFloat(newAdjustment.before_total || '0'),
        afterTotal: parseFloat(newAdjustment.after_total || '0'),
        absoluteChange: parseFloat(newAdjustment.absolute_change || '0'),
        percentageChange: parseFloat(newAdjustment.percentage_change || '0')
      },
      userId: newAdjustment.user_id,
      userEmail: newAdjustment.user_email,
      isActive: newAdjustment.is_active,
      updatedAt: newAdjustment.updated_at
    };

    return NextResponse.json(adjustmentEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to create adjustment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/adjustments/[id]
 * Update an adjustment (only the creator can update)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Adjustment ID required' },
        { status: 400 }
      );
    }

    // Check if user owns the adjustment
    const checkResult = await query<{ user_id: string }>(
      'SELECT user_id FROM forecast.adjustments WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    const adjustment = checkResult.rows[0];

    if (adjustment.user_id !== user.sub) {
      return NextResponse.json(
        { error: 'You can only edit your own adjustments' },
        { status: 403 }
      );
    }

    // Update the adjustment
    const updateResult = await query<{
      id: string;
      forecast_id: string;
      user_id: string;
      user_email: string;
      user_name: string;
      time_periods: string[];
      adjustment_type: string;
      adjustment_value: string;
      reason: string;
      notes: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      before_total: string | null;
      after_total: string | null;
      absolute_change: string | null;
      percentage_change: string | null;
    }>(
      'UPDATE forecast.adjustments SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );

    return NextResponse.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to update adjustment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/adjustments/[id]
 * Delete an adjustment (only the creator can delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Adjustment ID required' },
        { status: 400 }
      );
    }

    // Check if user owns the adjustment
    const checkResult = await query<{ user_id: string }>(
      'SELECT user_id FROM forecast.adjustments WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    const adjustment = checkResult.rows[0];

    if (adjustment.user_id !== user.sub) {
      return NextResponse.json(
        { error: 'You can only delete your own adjustments' },
        { status: 403 }
      );
    }

    // Delete the adjustment
    await query('DELETE FROM forecast.adjustments WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to delete adjustment' },
      { status: 500 }
    );
  }
}
