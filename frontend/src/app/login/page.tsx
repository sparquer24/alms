'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../../components/Footer';
import { getRoleBasedRedirectPath } from '../../config/roleRedirections';

const ImageFixed = Image as any;
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '../../store/thunks/authThunks';
import {
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectAuthInitialized,
  selectCurrentUser,
  setError,
} from '../../store/slices/authSlice';
import type { AppDispatch } from '../../store/store';
import { LoginSkeleton } from '../../components/Skeleton';
import { normalizeRole } from '../../utils/roleUtils';


interface LoginFormData {
  username: string;
  password: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_role: 'Your account has an invalid role. Please contact system administrator.',
  unhandled_role: 'Your role is not properly configured. Please contact system administrator.',
  no_role: 'No role assigned to your account. Please contact system administrator.',
  default: 'Authentication error. Please try logging in again.',
};

const LOGO_IMAGE = '/icon-alms.svg';

const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  const updateField = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value.trim() }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ username: '', password: '' });
  }, []);

  const isFormValid = useMemo(() => {
    return formData.username.trim().length > 0 && formData.password.trim().length > 0;
  }, [formData]);

  return { formData, updateField, resetForm, isFormValid };
};

const useUrlErrorHandler = (dispatch: AppDispatch) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams?.get('error');
    if (urlError) {
      const errorMessage = ERROR_MESSAGES[urlError] || ERROR_MESSAGES.default;
      dispatch(setError(errorMessage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className='bg-red-50 border border-red-400 rounded-md p-4 mb-4 shadow-sm' role='alert'>
    <div className='flex items-center'>
      <div className='flex-shrink-0'>
        <svg className='h-5 w-5 text-red-500' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
          <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <div className='ml-3'>
        <p className='text-sm font-medium text-red-700'>{message}</p>
      </div>
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <svg
    className='animate-spin -ml-1 mr-3 h-5 w-5 text-[#0F2D52]'
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    aria-hidden='true'
  >
    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
    <path
      className='opacity-75'
      fill='currentColor'
      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    />
  </svg>
);

const FormInput: React.FC<{
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  icon?: React.ReactNode;
}> = ({
  id,
  type,
  placeholder,
  value,
  onChange,
  disabled = false,
  autoComplete,
  required = false,
  className = '',
  showToggle = false,
  showPassword = false,
  onTogglePassword,
  icon,
}) => (
  <div className="relative">
    <label htmlFor={id} className="sr-only">
      {placeholder}
    </label>

    {icon && (
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-300 pointer-events-none">
        {icon}
      </span>
    )}

    <input
      id={id}
      name={id}
      type={type}
      autoComplete={autoComplete}
      required={required}
      className={`appearance-none relative block w-full py-3 ${
        icon ? "pl-11" : "pl-4"
      } ${
        showToggle ? "pr-11" : "pr-4"
      } border border-white/25 rounded-lg placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60 focus:border-[#D4AF37] sm:text-sm bg-white/10 backdrop-blur-sm transition-colors duration-200 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />

    {showToggle && (
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-300 hover:text-white focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          // Eye Slash
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 7 9 7a17.28 17.28 0 01-3.29 3.83M6.1 6.1A17.34 17.34 0 003 12s4 7 9 7a8.9 8.9 0 003.9-.9"
            />
          </svg>
        ) : (
          // Eye
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7S3.73 16.06 2.46 12z"
            />
          </svg>
        )}
      </button>
    )}
  </div>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
  </svg>
);

export const dynamic = 'force-dynamic';

function LoginContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  const isAuthLoading = useSelector(selectAuthLoading);
  const isLoading = isAuthLoading || isNavigating;
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authInitialized = useSelector(selectAuthInitialized);
  const currentUser = useSelector(selectCurrentUser);
  const [showPassword, setShowPassword] = useState(false);

  // If the user is already authenticated, redirect them away from login page
  // This effect only runs once on mount to avoid duplicate redirects
  useEffect(() => {
    if (!authInitialized || !isAuthenticated) return;
    if (!currentUser) return;

    // Get role from current user and redirect
    const userRole = currentUser?.role ? normalizeRole(currentUser.role) : null;
    if (userRole) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      router.replace(redirectPath);
    }
  }, [authInitialized, isAuthenticated, currentUser, router]);

  const { formData, updateField, resetForm, isFormValid } = useLoginForm();
  useUrlErrorHandler(dispatch);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid) {
        dispatch(setError('Please enter both username and password'));
        return;
      }

      try {
        const result = await dispatch(login({
          username: formData.username.trim().toUpperCase(),
          password: formData.password,
        })).unwrap();

        if (result && result.user) {
          const extractRole = (u: any): string | undefined => {
            if (!u) return undefined;
            const roleObj = u.role ?? u;
            const candidate =
              roleObj?.code ||
              roleObj?.key ||
              roleObj?.name ||
              u?.roleCode ||
              u?.role_id ||
              u?.roleId ||
              (typeof roleObj === 'string' ? roleObj : null) ||
              (Array.isArray(u?.roles) ? u.roles[0] : null);
            return candidate ? String(candidate).trim().toUpperCase() : undefined;
          };
          const normalizedRole = extractRole(result.user);
          if (!normalizedRole) {
            dispatch(setError('No role assigned to your account.'));
            return;
          }
          // Always use the same role -> path mapping as the rest of the app
          // (dashboard's access guard, the "already authenticated" redirect
          // above, and the Sidebar). Previously this used the user's first
          // configured *menu item* instead, which came from the backend in
          // whatever order it happened to list items — so a role meant to
          // land on the dashboard could land on Inbox instead if that
          // happened to be first in the menu list.
          const redirectPath = getRoleBasedRedirectPath(normalizedRole);
          try {
            sessionStorage.setItem('loginRedirectApplied', 'true');
          } catch (e) {}
          // For admin/superAdmin routes, use a full navigation so the Next.js middleware
          // can verify the JWT in the edge runtime.
          if (redirectPath.startsWith('/admin') || redirectPath.startsWith('/superAdmin')) {
            setIsNavigating(true);
            window.location.assign(redirectPath);
          } else {
            setIsNavigating(true);
            router.push(redirectPath);
          }
        }
      } catch {
        resetForm();
      }
    },
    [dispatch, formData, isFormValid, resetForm, router]
  );

  const usernameInput = useMemo(
    () => (
      <FormInput
        id='username'
        type='text'
        placeholder='Username or Email'
        value={formData.username}
        onChange={value => updateField('username', value)}
        disabled={isLoading}
        autoComplete='username'
        required
        className='uppercase'
        icon={<UserIcon />}
      />
    ),
    [formData.username, isLoading, updateField]
  );

  const passwordInput = useMemo(
  () => (
    <FormInput
      id="password"
      type={showPassword ? "text" : "password"}
      placeholder="Password"
      value={formData.password}
      onChange={(value) => updateField("password", value)}
      disabled={isLoading}
      autoComplete="current-password"
      required
      showToggle
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((prev) => !prev)}
      icon={<LockIcon />}
    />
  ),
  [formData.password, isLoading, updateField, showPassword]
);

  return (
    <div
      className='min-h-screen flex flex-col relative overflow-hidden'
      role='main'
    >
      <div
        className='absolute inset-0 bg-gradient-to-b from-[#0F2D52]/70 via-[#0F2D52]/50 to-[#0F2D52]/80'
        aria-hidden='true'
      />
      <div className='relative flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className={`relative max-w-md w-full bg-white/10 p-8 sm:p-10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/25 transition-all duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
          <div className='absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B]' />
          <div
            className='pointer-events-none absolute inset-0 rounded-2xl'
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 60%)',
            }}
          />

          <div className='relative flex flex-col items-center'>
            <div className='mb-5 h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg ring-1 ring-white/30 ring-offset-2 ring-offset-transparent'>
              <ImageFixed
                src={LOGO_IMAGE}
                alt='ALMS Logo'
                width={52}
                height={52}
                className='h-auto'
                priority
              />
            </div>
            <h1 className='text-center text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-sm'>
              Arms License Management System
            </h1>
            <p className='mt-2 text-center text-sm text-gray-200'>
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className='relative mt-6'>
              <ErrorMessage message={error} />
            </div>
          )}

          <form className='relative mt-8 space-y-4' onSubmit={handleSubmit} noValidate>
            {usernameInput}
            {passwordInput}

            <div className='pt-2'>
              <button
                type='submit'
                disabled={isLoading || !isFormValid}
                className='group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-[#0F2D52] bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200'
                aria-describedby={!isFormValid ? 'form-validation' : undefined}
              >
                {isLoading && <LoadingSpinner />}
                <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              </button>
              {!isFormValid && (
                <div id='form-validation' className='sr-only'>
                  Please fill in all required fields
                </div>
              )}
            </div>
          </form>

          <div className='relative mt-6 text-center'>
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer variant='dark' className='relative z-10' />
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
