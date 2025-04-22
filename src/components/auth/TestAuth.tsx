'use client';

import { useSession } from "next-auth/react";

export default function TestAuth() {
  const { data: session, status } = useSession();
  
  return (
    <div>
      <p>Status: {status}</p>
      <p>User ID: {session?.user?.id || 'Not logged in'}</p>
    </div>
  );
}