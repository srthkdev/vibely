'use client';

import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-screen py-8">
      <UserProfile />
    </div>
  );
} 