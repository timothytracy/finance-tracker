/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MenuIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

export default function Header() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          Finance Tracker
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-gray-700 hover:text-blue-600">
            Transactions
          </Link>
          <Link href="/categories" className="text-gray-700 hover:text-blue-600">
            Categories
          </Link>
          <Link href="/reports" className="text-gray-700 hover:text-blue-600">
            Reports
          </Link>
          <Button
            variant="outline"
            className="ml-4"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Logout
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 hover:text-blue-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="absolute top-16 left-0 w-full bg-white shadow-md md:hidden">
            <ul className="flex flex-col space-y-4 p-4">
              <li>
                <Link
                  href="/dashboard"
                  className="block text-gray-700 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/transactions"
                  className="block text-gray-700 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Transactions
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="block text-gray-700 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/reports"
                  className="block text-gray-700 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Reports
                </Link>
              </li>
              <li>
                <button
                  className="block text-gray-700 hover:text-blue-600 text-left"
                  onClick={() => {
                    setMenuOpen(false)
                    signOut({ callbackUrl: '/login' })
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}