'use client';

import { ReactNode } from 'react';

// This is a simple wrapper component that ensures the auth hook works
// Your useAuth hook already handles the Firebase auth state internally
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}