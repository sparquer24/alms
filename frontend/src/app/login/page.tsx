"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/thunks/authThunks';
import { selectAuthLoading, selectAuthError } from '../../store/slices/authSlice';
import type { AppDispatch } from '../../store/store';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(login({ username, password })).unwrap();
      router.push('/');
    } catch (err) {
      // Error is handled by the thunk and stored in Redux state
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8" 
         style={{ backgroundImage: 'url("/backgroundIMGALMS.jpeg")' }}>
      <div className="max-w-md w-full space-y-6 bg-white/95 p-10 rounded-lg shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Image
              src="/icon-alms.svg"
              alt="ALMS Logo"
              width={120}
              height={120}
              className="drop-shadow-md"
              priority
            />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-black">
            Arms License Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-700">
            Sign in to access your dashboard
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-400 rounded-md p-4 mb-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:z-10 sm:text-sm bg-white/90"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:z-10 sm:text-sm bg-white/90"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 font-medium">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link href="/reset-password" className="font-medium text-[#D4AF37] hover:text-[#C4A02F] transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              <span className="font-semibold">Sign in</span>
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs border-t border-gray-200 pt-4">
          <p className="text-gray-600 font-medium">For testing, use one of these usernames with password '1234':</p>
          <p className="mt-1 bg-gray-50 py-2 px-3 rounded-md text-gray-700 font-mono inline-block">dcp_user, acp_user, sho_user, zs_user, applicant_user</p>
        </div>
      </div>
    </div>
  );
}
