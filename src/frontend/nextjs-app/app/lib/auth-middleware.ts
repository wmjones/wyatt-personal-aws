import { NextRequest, NextResponse } from 'next/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { config } from './config';

// Create the JWT verifier for Cognito
const verifier = CognitoJwtVerifier.create({
  userPoolId: config.auth.aws.userPoolId,
  tokenUse: 'id',
  clientId: config.auth.aws.clientId,
});

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    sub: string;
    email: string;
    username: string;
  };
}

/**
 * Middleware to authenticate API requests using Cognito JWT tokens
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authorization header missing or invalid' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify the token
      const payload = await verifier.verify(token);

      // Add user information to the request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        sub: payload.sub as string,
        email: payload.email as string,
        username: payload['cognito:username'] as string,
      };

      // Call the handler with authenticated request
      return await handler(authenticatedReq);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Get user information from the request without requiring authentication
 * Returns null if no valid token is present
 */
export async function getOptionalUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verifier.verify(token);

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      username: payload['cognito:username'] as string,
    };
  } catch {
    return null;
  }
}
