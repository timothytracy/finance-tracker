/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const publicPaths = ['/login', '/register', '/about'] // Define public paths

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Allow access to public paths
    if (status === 'unauthenticated' && !publicPaths.includes(pathname)) {
      router.push('/login') // Redirect to login if not authenticated
    }
  }, [status, router, pathname])

  if (publicPaths.includes(pathname)) {
    // Allow rendering of public pages
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return <>{children}</>
  }

  return null
}