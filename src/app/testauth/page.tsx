// app/test-auth/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function TestSessionPage() {
  const session = await getServerSession(authOptions);
  
  return (
    <div>
      <h1>Server Session Test</h1>
      <pre>
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}