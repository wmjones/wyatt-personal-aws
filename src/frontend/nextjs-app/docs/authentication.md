# Authentication Implementation Guide

This document describes the AWS Cognito authentication implementation in the Next.js application.

## Overview

The application uses AWS Cognito for user authentication with the following features:
- User registration with email verification
- Login/logout functionality
- Password reset
- Protected routes
- JWT token management
- Session persistence

## Architecture

### Key Components

1. **Authentication Service** (`app/services/auth.ts`)
   - Handles all Cognito operations
   - Token management
   - User session handling

2. **Authentication Context** (`app/context/AuthContext.tsx`)
   - Global auth state management
   - Provides useAuth hook
   - Handles authentication flow

3. **Protected Routes Middleware** (`middleware.ts`)
   - Route protection
   - Automatic redirects
   - Token validation

4. **Auth UI Components**
   - Login page (`app/login/page.tsx`)
   - Sign up page (`app/signup/page.tsx`)
   - Email confirmation (`app/confirm-signup/page.tsx`)
   - Password reset (`app/forgot-password/page.tsx`)

## Usage

### Using the useAuth Hook

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  // Check authentication status
  if (isAuthenticated) {
    console.log('User email:', user.email);
  }
}
```

### Protecting Routes

Routes are automatically protected by the middleware. Add routes to the `protectedRoutes` array in `middleware.ts`:

```typescript
const protectedRoutes = ['/dashboard', '/visualizations', '/settings'];
```

### Making Authenticated API Calls

Use the API service for authenticated requests:

```typescript
import { apiService } from '@/services/api';

// The service automatically includes the JWT token
const visualizations = await apiService.getVisualizations();
```

## Authentication Flow

### Sign Up Flow
1. User fills sign up form
2. Account created in Cognito
3. Verification email sent
4. User enters confirmation code
5. Account verified and ready to use

### Sign In Flow
1. User enters credentials
2. Cognito validates credentials
3. JWT tokens received
4. User redirected to dashboard
5. Tokens stored in secure cookies

### Token Refresh
- Tokens are automatically refreshed when expired
- Failed refresh redirects to login
- Seamless user experience

## Environment Variables

Required Cognito configuration in `.env.local`:

```bash
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your-client-id
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Cookies**: Tokens stored in httpOnly cookies
3. **CORS Configuration**: Properly configured in API Gateway
4. **Input Validation**: All inputs sanitized
5. **Password Requirements**: Minimum 8 characters enforced

## Error Handling

The authentication system handles common errors:
- Invalid credentials
- Network failures
- Expired tokens
- Invalid verification codes

All errors display user-friendly messages.

## Testing

To test authentication:

1. Create a test user via sign up
2. Verify email with confirmation code
3. Sign in with credentials
4. Access protected routes
5. Test sign out functionality

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Check user pool ID configuration
   - Verify region settings

2. **CORS errors**
   - Verify API Gateway CORS settings
   - Check allowed origins include your domain

3. **Token refresh failing**
   - Check token expiration settings
   - Verify client ID configuration

4. **Confirmation code not received**
   - Check spam folder
   - Verify SES configuration in AWS

## Next Steps

- Implement social login providers
- Add MFA support
- Implement user profile management
- Add password complexity rules
- Implement account recovery flows
