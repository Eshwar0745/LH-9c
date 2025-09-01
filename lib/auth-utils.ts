import { auth } from '@/lib/firebase';
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role?: string;
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return null;
    }

    // In a real implementation, you would verify the token server-side
    // For now, we'll use the client auth state
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    return {
      uid: currentUser.uid,
      email: currentUser.email || '',
      emailVerified: currentUser.emailVerified,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await verifyAuthToken(request);
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return handler(request, user);
  };
}

export function requireRole(roles: string[]) {
  return function(handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>) {
    return async (request: NextRequest) => {
      const user = await verifyAuthToken(request);
      if (!user) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Unauthorized', 
            message: 'Authentication required' 
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!user.role || !roles.includes(user.role)) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Forbidden', 
            message: 'Insufficient permissions' 
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return handler(request, user);
    };
  };
}