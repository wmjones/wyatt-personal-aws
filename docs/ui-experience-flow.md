# UI Experience Flow

## Current User Flow Analysis

### Authentication Flow
1. **Landing Page** (/) - Static homepage with Sign In/Sign Up buttons
2. **Sign Up** (/signup) - Email and password registration
3. **Email Confirmation** (/confirm-signup) - Verify email with confirmation code
4. **Login** (/login) - Email and password authentication
5. **Password Recovery** (/forgot-password) - Reset password flow

### Post-Authentication Navigation
1. **Dashboard** (/dashboard) - Simple welcome page with user info
   - Shows email and username
   - Links to create visualizations and account settings
   - No clear pathway to demand planning features

2. **Demand Planning** (/demand-planning) - Main forecast workspace
   - Complex interface with multiple filters
   - No introduction or guidance
   - Users must figure out how to select filters and view data

### Current Pain Points
- No onboarding or welcome flow for new users
- Dashboard doesn't guide users to key features
- Demand planning interface is complex without tutorials
- No tooltips or help system
- No user preferences for hiding/showing help

## Proposed First-Time User Onboarding

### 1. Welcome Flow

#### Welcome Modal (First Login)
- **Trigger**: First successful login after account creation
- **Design**:
  - Full-screen modal with semi-transparent backdrop
  - Progress indicator (Step 1 of 4)
  - Company branding and welcome message
  - "Get Started" and "Skip Tour" buttons
  - Checkbox for "Don't show this again"

#### Implementation Steps:
1. Create `WelcomeModal` component in `/app/components/onboarding/`
2. Add `has_seen_welcome` field to user preferences in database
3. Check preference on dashboard load
4. Store preference when user completes or skips

### 2. Interactive Product Tour

#### Tour Library Integration
- **Library**: Shepherd.js (lightweight, accessible, customizable)
- **Alternative**: Driver.js (simpler but equally effective)

#### Tour Steps:

##### Step 1: Dashboard Overview
- **Target**: Main dashboard area
- **Content**: "Welcome to your forecast dashboard! This is your home base for demand planning and analytics."
- **Action**: Next button

##### Step 2: Navigation Introduction
- **Target**: Header navigation
- **Content**: "Access key features from the navigation menu. Let's explore the Demand Planning workspace."
- **Action**: Auto-navigate to /demand-planning

##### Step 3: Demand Planning Workspace
- **Target**: Entire demand planning page
- **Content**: "This is where you'll create and manage forecasts. Let's walk through the key features."
- **Action**: Next button

##### Step 4: Filter Panel
- **Target**: Filter sidebar
- **Content**: "Start by selecting your filters. Choose states, DMAs, DCs, and inventory items to view specific forecasts."
- **Action**: Highlight filter dropdowns

##### Step 5: Making Your First Adjustment
- **Target**: Adjustment panel
- **Content**: "Try making a 2.5% adjustment. Click the + button to increase the forecast by 2.5%."
- **Action**: Wait for user to click +

##### Step 6: Saving Adjustments
- **Target**: Save button
- **Content**: "Great! Now save your adjustment to see it reflected in the chart."
- **Action**: Wait for save action

##### Step 7: Viewing History
- **Target**: Adjustment history panel
- **Content**: "Your saved adjustments appear here. You can track all changes over time."
- **Action**: Next button

##### Step 8: Deleting Adjustments
- **Target**: History entry
- **Content**: "To remove an adjustment, simply click the delete icon next to any entry."
- **Action**: Show delete icon on hover

##### Step 9: Tour Complete
- **Target**: Center screen
- **Content**: "You're all set! Remember, you can access help anytime from the menu."
- **Action**: Complete tour button

### 3. Implementation Details

#### Database Schema Updates
```sql
-- Add to user preferences table
ALTER TABLE user_preferences ADD COLUMN has_seen_welcome BOOLEAN DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN has_completed_tour BOOLEAN DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN tour_progress JSON DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN onboarding_completed_at TIMESTAMP;
```

#### Component Structure
```
/app/components/onboarding/
├── WelcomeModal.tsx
├── ProductTour.tsx
├── TourStep.tsx
├── hooks/
│   ├── useOnboarding.ts
│   └── useTourProgress.ts
└── styles/
    └── onboarding.css
```

#### Key Features
1. **Progress Tracking**: Save tour progress to allow resuming
2. **Skip Options**: Allow skipping at any point
3. **Contextual Help**: Show relevant tips based on user actions
4. **Responsive Design**: Adapt tour for mobile/tablet views
5. **Accessibility**: Full keyboard navigation and screen reader support

### 4. Enhanced Dashboard Experience

#### Dashboard Redesign
- Add "Quick Actions" section with guided links:
  - "View Forecasts" → /demand-planning
  - "Recent Adjustments" → /demand-planning?tab=history
  - "Performance Metrics" → /demand-planning?tab=settings

#### Tooltips System
- Add tooltips to all major UI elements
- Include "?" help icons that trigger contextual help
- Store tooltip preferences (show/hide) per user

### 5. Help Center Integration

#### In-App Help
- Floating help button in bottom-right corner
- Quick access to:
  - Restart tour
  - View video tutorials
  - Access documentation
  - Contact support

#### Contextual Documentation
- Add help links in each major section
- Include "Learn More" buttons for complex features
- Link to specific documentation sections

### 6. User Preferences

#### Preference Management
- Add preferences page under user settings
- Options to control:
  - Show/hide welcome screen
  - Enable/disable tooltips
  - Tour completion status
  - Preferred help format (text/video)

### 7. Analytics and Tracking

#### Onboarding Metrics
- Track completion rates for each tour step
- Monitor where users drop off
- Measure time to first successful adjustment
- Track help center usage

### 8. Future Enhancements

#### Advanced Features
1. **Role-Based Tours**: Different tours for different user roles
2. **Interactive Sandbox**: Practice area for new users
3. **Achievement System**: Gamify learning with badges
4. **Video Tutorials**: Embedded video guides
5. **AI Assistant**: Chatbot for instant help

## Implementation Priority

### Phase 1 (MVP)
1. Welcome modal with skip option
2. Basic product tour with Shepherd.js
3. Database updates for preferences
4. Simple progress tracking

### Phase 2
1. Enhanced dashboard with quick actions
2. Tooltip system
3. Help center integration
4. Tour resume functionality

### Phase 3
1. Analytics integration
2. Video tutorials
3. Advanced preference management
4. AI-powered help system

## Success Metrics
- 80% of new users complete the welcome flow
- 60% complete the full product tour
- 50% reduction in support tickets for basic navigation
- 90% user satisfaction with onboarding experience
