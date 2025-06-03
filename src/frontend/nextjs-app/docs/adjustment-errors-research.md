# Adjustment Save/Load Errors Research

## Overview
This document outlines potential errors and issues related to saving and loading adjustments in the demand planning dashboard.

## Common Error Scenarios

### 1. Database Connection Errors

**Symptoms:**
- 500 Internal Server Error when saving/loading adjustments
- "Failed to save adjustment" or "Failed to fetch adjustments" messages

**Potential Causes:**
- Database connection string not configured properly
- Database server unreachable
- Connection pool exhausted

**Debug Steps:**
1. Check environment variables for DATABASE_URL
2. Verify Neon database is accessible
3. Check connection pool settings in `/app/lib/postgres.ts`

### 2. Table Not Found Errors

**Symptoms:**
- PostgreSQL error: "relation does not exist"
- 500 errors on first access

**Current Solution:**
- Auto-creation logic added to API routes
- `ensureForecastAdjustmentsTable()` checks and creates table

**Potential Issues:**
- User permissions insufficient to create tables
- Schema conflicts with existing tables

### 3. Data Validation Errors

**Symptoms:**
- 400 Bad Request errors
- "Invalid filter context structure" messages

**Common Issues:**
- Missing required fields in filterContext
- adjustmentValue outside -100 to 100 range
- Missing dateRange in filterContext

**Validation Requirements:**
```typescript
filterContext: {
  states: string[],        // Required array
  dmaIds: string[],       // Required array
  dcIds: string[],        // Required array
  inventoryItemId: string | null,
  dateRange: {            // Required object
    startDate: string,
    endDate: string
  }
}
```

### 4. Authentication/Authorization Errors

**Symptoms:**
- 401 Unauthorized errors
- 403 Forbidden when trying to edit/delete

**Potential Causes:**
- JWT token expired
- User trying to modify another user's adjustment
- Missing Authorization header

**Debug Steps:**
1. Check if `getIdToken()` returns valid token
2. Verify token is included in request headers
3. Check user_id matches adjustment owner

### 5. Data Type Mismatches

**Symptoms:**
- JSON parsing errors
- Decimal values not saving correctly

**Common Issues:**
- adjustmentValue sent as string instead of number
- filter_context JSONB column receiving invalid JSON
- Timestamp format issues

### 6. Optimistic Update Issues

**Symptoms:**
- UI shows adjustment saved but it's not in database
- Duplicate adjustments appearing temporarily

**Current Implementation:**
```typescript
// Optimistically update the local state
setAdjustmentHistory(prev => [result.adjustment, ...prev]);

// Refresh from server to ensure consistency
fetchAdjustmentHistory();
```

**Potential Issues:**
- Race conditions between optimistic update and server refresh
- Error handling not reverting optimistic updates

### 7. Multi-user Concurrency Issues

**Symptoms:**
- Adjustments disappearing when multiple users active
- Stale data showing for other users

**Current Solution:**
- `showAllUsers` flag to toggle between own/all adjustments
- Real-time refresh after mutations

**Potential Improvements:**
- WebSocket for real-time updates
- Polling mechanism for auto-refresh
- Conflict resolution for simultaneous edits

## Debug Tools

### AdjustmentDebugPanel
Added a debug panel component that:
- Tests save functionality with known good payload
- Tests load functionality
- Checks database table existence
- Logs all requests/responses for analysis

### API Error Logging
Enhanced error logging in API routes:
```typescript
console.error('Error saving adjustment:', error);
```

### Browser DevTools
Check Network tab for:
- Request/response payloads
- Status codes
- Response timing

## Recommended Monitoring

1. **Server-side Logging**
   - Log all database queries
   - Log validation failures with details
   - Track response times

2. **Client-side Logging**
   - Track failed requests
   - Log user actions leading to errors
   - Monitor performance metrics

3. **Database Monitoring**
   - Query performance
   - Connection pool usage
   - Table growth and indexes

## Testing Checklist

- [ ] Test with empty database (first user experience)
- [ ] Test with invalid filter selections
- [ ] Test with extreme adjustment values
- [ ] Test concurrent users making adjustments
- [ ] Test with slow network conditions
- [ ] Test token expiration scenarios
- [ ] Test database connection failures
- [ ] Test with large number of existing adjustments

## Next Steps

1. Implement comprehensive error tracking
2. Add retry logic for transient failures
3. Improve error messages for users
4. Add performance monitoring
5. Consider implementing WebSocket for real-time updates
