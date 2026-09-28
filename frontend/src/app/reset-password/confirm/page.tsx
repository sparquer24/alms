'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Type assertions for Next.js components to fix React 18 compatibility
const ImageFixed = Image as any;
const LinkFixed = Link as any;

export const dynamic = 'force-dynamic';

function ResetPasswordConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('This reset link is missing its token. Please use the link from your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
      const response = await fetch(`${apiBase}/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setSuccess('Your password has been reset. Redirecting to login…');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.message || 'This reset link is invalid or has expired. Please request a new one.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className='min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8'
      style={{ backgroundImage: 'url("/backgroundIMGALMS.jpeg")' }}
    >
      <div className='max-w-md w-full space-y-6 bg-white/95 p-10 rounded-lg shadow-xl backdrop-blur-sm'>
        <div className='flex flex-col items-center'>
          <div className='mb-6'>
            <ImageFixed
              src='/icon-alms.svg'
              alt='ALMS Logo'
              width={120}
              height={120}
              className='drop-shadow-md'
              priority
            />
          </div>
          <h2 className='mt-2 text-center text-3xl font-extrabold text-black'>Set New Password</h2>
          <p className='mt-2 text-center text-sm text-gray-700'>
            Choose a new password for your account
          </p>
        </div>

        {!token && (
          <div className='bg-yellow-50 border border-yellow-400 rounded-md p-4 mb-4 shadow-sm'>
            <p className='text-sm font-medium text-yellow-800'>
              No reset token found. Open this page using the link from your password reset email.
            </p>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-400 rounded-md p-4 mb-4 shadow-sm'>
            <p className='text-sm font-medium text-red-700'>{error}</p>
          </div>
        )}

        {success && (
          <div className='bg-green-50 border border-green-400 rounded-md p-4 mb-4 shadow-sm'>
            <p className='text-sm font-medium text-green-700'>{success}</p>
          </div>
        )}

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-4'>
            <div>
              <label htmlFor='new-password' className='sr-only'>
                New password
              </label>
              <input
                id='new-password'
                name='newPassword'
                type='password'
                autoComplete='new-password'
                required
                minLength={8}
                className='appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:z-10 sm:text-sm bg-white/90'
                placeholder='New password (min. 8 characters)'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isLoading || !token}
              />
            </div>
            <div>
              <label htmlFor='confirm-password' className='sr-only'>
                Confirm new password
              </label>
              <input
                id='confirm-password'
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                required
                minLength={8}
                className='appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:z-10 sm:text-sm bg-white/90'
                placeholder='Confirm new password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading || !token}
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading || !token}
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200'
            >
              {isLoading ? (
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
              ) : null}
              <span className='font-semibold'>Set New Password</span>
            </button>
          </div>
          <div className='text-center mt-4 space-y-2'>
            <p>
              <LinkFixed
                href='/reset-password'
                className='font-medium text-[#D4AF37] hover:text-[#C4A02F] transition-colors'
              >
                Request a new reset link
              </LinkFixed>
            </p>
            <p>
              <LinkFixed
                href='/login'
                className='font-medium text-gray-600 hover:text-gray-800 transition-colors'
              >
                Back to Login
              </LinkFixed>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}
