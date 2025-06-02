# Multi-User Adjustment System

## Overview

The forecast adjustment system has been enhanced to support multi-user collaboration. Multiple users can now log in, view all adjustments made by any user, and manage their own adjustments while maintaining a shared forecast state.

## Key Features

### 1. **Shared Visibility**
- All authenticated users can view the complete history of adjustments
- Each adjustment shows who created it (name and email)
- Users can see the cumulative effect of all active adjustments on the forecast

### 2. **User-Specific Permissions**
- Users can only edit or delete their own adjustments
- Other users' adjustments appear as "View only"
- Clear visual indicators show which adjustments you can modify

### 3. **Adjustment Management**
- **Create**: Any user can create new adjustments with percentage or absolute values
- **Toggle Active/Inactive**: Users can deactivate their adjustments without deleting them
- **Delete**: Permanently remove adjustments you created
- **Filter & Search**: Find adjustments by user, reason, or notes

### 4. **Real-Time Collaboration**
- Changes are immediately visible to all users
- Adjustment history automatically refreshes after modifications
- Status indicators show active vs inactive adjustments

## Technical Implementation

### Database Schema

```sql
CREATE TABLE forecast.adjustments (
  id UUID PRIMARY KEY,
  forecast_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  time_periods TEXT[] NOT NULL,
  adjustment_type VARCHAR(20) CHECK (type IN ('percentage', 'absolute')),
  adjustment_value DECIMAL(10,2) NOT NULL,
  reason VARCHAR(50) NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Impact calculations
  before_total DECIMAL(15,2),
  after_total DECIMAL(15,2),
  absolute_change DECIMAL(15,2),
  percentage_change DECIMAL(10,2)
);
```

### API Endpoints

#### GET /api/adjustments
- Fetches all adjustments for a forecast
- Requires authentication (JWT token)
- Returns adjustments from all users

#### POST /api/adjustments
- Creates a new adjustment
- Automatically associates with the authenticated user
- Calculates impact on forecast

#### PATCH /api/adjustments
- Updates adjustment properties (e.g., active status)
- Only the creator can modify
- Returns 403 Forbidden for unauthorized attempts

#### DELETE /api/adjustments
- Permanently removes an adjustment
- Only the creator can delete
- Returns 403 Forbidden for unauthorized attempts

### Authentication

The system uses AWS Cognito JWT tokens for authentication:
- Token is extracted from the Authorization header
- User information (sub, email, name) is decoded from the token
- Each adjustment is permanently associated with the creating user's ID

## Usage Guide

### Creating an Adjustment

1. Navigate to the Demand Planning dashboard
2. Select filters to view forecast data
3. Click "Create Adjustment" in the Adjustment Panel
4. Fill in:
   - Time periods to adjust
   - Adjustment type (percentage or absolute)
   - Value (positive or negative)
   - Reason category
   - Optional notes
5. Preview the impact
6. Save the adjustment

### Managing Adjustments

1. Go to the "History" tab to view all adjustments
2. Your adjustments will have action buttons:
   - **Deactivate/Activate**: Toggle without deleting
   - **Delete**: Permanently remove
3. Use filters to find specific adjustments:
   - Search by user name or notes
   - Filter by reason category
   - Sort by date, value, or user

### Viewing Multi-User Adjustments

- The adjustment history table shows:
  - User name and email for each adjustment
  - Creation date and time
  - Adjustment details and impact
  - Current status (Active/Inactive)
- Summary shows total adjustments and which user you're logged in as

## Migration Instructions

### 1. Run Database Migration

```bash
cd src/frontend/nextjs-app
npm run migrate:adjustments
```

This creates the `forecast.adjustments` table with all necessary fields and indexes.

### 2. Update Environment Variables

Ensure your `.env.local` has:
```
DATABASE_URL=your-neon-database-url
DATABASE_URL_UNPOOLED=your-neon-database-url-unpooled
```

### 3. Deploy API Routes

The new API routes at `/api/adjustments` handle all adjustment operations.

### 4. Test the System

Run the test script to verify functionality:
```bash
npm run test:adjustments
```

## Security Considerations

1. **Authentication Required**: All API endpoints require valid JWT tokens
2. **User Isolation**: Users can only modify their own adjustments
3. **Audit Trail**: All adjustments maintain creator information and timestamps
4. **No Cross-User Data Leakage**: Users see all adjustments but can only act on their own

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Adjustment Approval Workflow**: Require approval for large adjustments
3. **Bulk Operations**: Select and modify multiple adjustments at once
4. **Export Functionality**: Download adjustment history as CSV/Excel
5. **Adjustment Templates**: Save and reuse common adjustment patterns
6. **Role-Based Permissions**: Admin users who can edit any adjustment

## Troubleshooting

### "Adjustment history failed to load" Error

1. Check that the database migration has been run
2. Verify DATABASE_URL is correctly set
3. Ensure the user is authenticated (has valid JWT token)
4. Check browser console for specific error messages

### "You can only edit your own adjustments" Error

This is expected behavior. Users cannot modify adjustments created by others.

### Adjustments Not Showing

1. Verify the API is returning data (check Network tab)
2. Ensure the forecast_id parameter is correct
3. Check that adjustments exist in the database

## Summary

The multi-user adjustment system enables collaborative forecast management while maintaining data integrity and user accountability. Each user can contribute adjustments while seeing the complete picture of all modifications made to the forecast.
