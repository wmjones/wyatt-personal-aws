import { NextResponse } from 'next/server';
import { db } from '@/app/db/drizzle';
import { forecastAdjustments } from '@/app/db/schema';
import { withAuth, AuthenticatedRequest } from '@/app/lib/auth-middleware';
import { eq, and, desc } from 'drizzle-orm';

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
    if (!Array.isArray(filterContext.states) ||
        !Array.isArray(filterContext.dmaIds) ||
        !Array.isArray(filterContext.dcIds)) {
      return NextResponse.json(
        { error: 'Invalid filter context structure' },
        { status: 400 }
      );
    }

    // Apply default date range if none provided
    const processedFilterContext = {
      ...filterContext,
      dateRange: {
        startDate: filterContext.dateRange?.startDate || '2025-01-01',
        endDate: filterContext.dateRange?.endDate || '2025-03-31'
      }
    };

    // Validate main date range
    const mainStartDate = new Date(processedFilterContext.dateRange.startDate);
    const mainEndDate = new Date(processedFilterContext.dateRange.endDate);

    if (isNaN(mainStartDate.getTime()) || isNaN(mainEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date range format. Please use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (mainStartDate >= mainEndDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Since we now always use the main date range for adjustments,
    // we'll use the main filter's date range as the adjustment date range

    // Validate required filter dimensions
    if (!processedFilterContext.inventoryItemId) {
      return NextResponse.json(
        { error: 'Product selection is required for adjustments' },
        { status: 400 }
      );
    }

    // Insert adjustment into database with multi-user support
    const [savedAdjustment] = await db
      .insert(forecastAdjustments)
      .values({
        adjustmentValue: adjustmentValue.toString(),
        filterContext: processedFilterContext,
        inventoryItemName: inventoryItemName || null,
        userId: request.user?.sub || '',
        userEmail: request.user?.email,
        userName: request.user?.username || request.user?.email?.split('@')[0] || 'Unknown',
        isActive: true,
        // Always use the main filter's date range as the adjustment date range
        adjustmentStartDate: processedFilterContext.dateRange.startDate,
        adjustmentEndDate: processedFilterContext.dateRange.endDate,
      })
      .returning();

    return NextResponse.json({
      success: true,
      adjustment: {
        id: savedAdjustment.id,
        adjustmentValue: parseFloat(savedAdjustment.adjustmentValue),
        filterContext: savedAdjustment.filterContext,
        inventoryItemName: savedAdjustment.inventoryItemName,
        userId: savedAdjustment.userId,
        userEmail: savedAdjustment.userEmail,
        userName: savedAdjustment.userName,
        isActive: savedAdjustment.isActive,
        timestamp: savedAdjustment.createdAt,
        adjustmentStartDate: savedAdjustment.adjustmentStartDate,
        adjustmentEndDate: savedAdjustment.adjustmentEndDate
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
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const inventoryItemName = searchParams.get('inventoryItemName');

    // Build query
    let query = db
      .select()
      .from(forecastAdjustments)
      .where(eq(forecastAdjustments.isActive, true))
      .$dynamic();

    // Filter by user if not showing all
    if (!showAll && request.user?.sub) {
      query = query.where(
        and(
          eq(forecastAdjustments.isActive, true),
          eq(forecastAdjustments.userId, request.user.sub)
        )
      );
    }

    // Filter by inventory item if provided
    if (inventoryItemName) {
      query = query.where(
        and(
          eq(forecastAdjustments.isActive, true),
          eq(forecastAdjustments.inventoryItemName, inventoryItemName)
        )
      );
    }

    // Apply ordering and limit
    const results = await query
      .orderBy(desc(forecastAdjustments.createdAt))
      .limit(limit);

    const adjustments = results.map((row) => ({
      id: row.id,
      adjustmentValue: parseFloat(row.adjustmentValue),
      filterContext: row.filterContext,
      inventoryItemName: row.inventoryItemName,
      userId: row.userId,
      userEmail: row.userEmail,
      userName: row.userName,
      isActive: row.isActive,
      timestamp: row.createdAt,
      updatedAt: row.updatedAt,
      adjustmentStartDate: row.adjustmentStartDate,
      adjustmentEndDate: row.adjustmentEndDate,
      isOwn: row.userId === request.user?.sub
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
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Adjustment ID is required' },
        { status: 400 }
      );
    }

    // First check if the adjustment belongs to the user
    const [existingAdjustment] = await db
      .select({ userId: forecastAdjustments.userId })
      .from(forecastAdjustments)
      .where(eq(forecastAdjustments.id, id))
      .limit(1);

    if (!existingAdjustment) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    if (existingAdjustment.userId !== request.user?.sub) {
      return NextResponse.json(
        { error: 'You can only edit your own adjustments' },
        { status: 403 }
      );
    }

    // Update the adjustment
    const [updatedAdjustment] = await db
      .update(forecastAdjustments)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(forecastAdjustments.id, id),
          eq(forecastAdjustments.userId, request.user.sub)
        )
      )
      .returning({
        id: forecastAdjustments.id,
        isActive: forecastAdjustments.isActive,
        updatedAt: forecastAdjustments.updatedAt,
      });

    if (!updatedAdjustment) {
      return NextResponse.json(
        { error: 'Failed to update adjustment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      adjustment: updatedAdjustment
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Adjustment ID is required' },
        { status: 400 }
      );
    }

    // First check if the adjustment belongs to the user
    const [existingAdjustment] = await db
      .select({ userId: forecastAdjustments.userId })
      .from(forecastAdjustments)
      .where(eq(forecastAdjustments.id, parseInt(id)))
      .limit(1);

    if (!existingAdjustment) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    if (existingAdjustment.userId !== request.user?.sub) {
      return NextResponse.json(
        { error: 'You can only delete your own adjustments' },
        { status: 403 }
      );
    }

    // Delete the adjustment
    await db
      .delete(forecastAdjustments)
      .where(
        and(
          eq(forecastAdjustments.id, parseInt(id)),
          eq(forecastAdjustments.userId, request.user.sub)
        )
      );

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
