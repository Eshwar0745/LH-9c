'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback>
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.displayName || 'No name'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Email verified:</span>{' '}
            {user.emailVerified ? 'Yes' : 'No'}
          </p>
          <p className="text-sm">
            <span className="font-medium">Account created:</span>{' '}
            {user.metadata.creationTime}
          </p>
          <p className="text-sm">
            <span className="font-medium">Last sign in:</span>{' '}
            {user.metadata.lastSignInTime}
          </p>
        </div>

        <Button onClick={handleLogout} variant="outline" className="w-full">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};