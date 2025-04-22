// app/register/page.tsx
"use client";
import { registerUser } from '@/app/actions/auth';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold">Create an Account</h1>
        
        <form action={async (formData) => {
          const result = await registerUser(formData);
          if (result.error) {
            console.error(result.error);
          }
        }} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium ">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium ">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium ">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Register
          </button>
        </form>
        
        <p className="text-sm text-center">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}