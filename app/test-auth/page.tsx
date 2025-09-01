'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth/auth-modal';
import { FirestoreTest } from '@/components/test/firestore-test';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Auth Test</CardTitle>
            <CardDescription>
              Test your Firebase authentication setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800">✅ Signed In</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Name:</strong> {user.displayName || 'Not set'}</p>
                    <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                    <p><strong>UID:</strong> {user.uid}</p>
                  </div>
                </div>
                <Button onClick={signOut} variant="outline" className="w-full">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800">Not signed in</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Click the button below to test authentication
                  </p>
                </div>
                <Button 
                  onClick={() => setShowAuthModal(true)} 
                  className="w-full"
                >
                  Open Auth Modal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <AuthModal 
          open={showAuthModal} 
          onOpenChange={setShowAuthModal} 
        />

        {user && <FirestoreTest />}
      </div>
    </div>
  );
}