'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../../components/Footer';
import { getRoleBasedRedirectPath } from '../../config/roleRedirections';
import { navigateToDefaultMenu } from '../../utils/navigationUtils';

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
    className='animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900'
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
}) => (
  <div className="relative">
    <label htmlFor={id} className="sr-only">
      {placeholder}
    </label>

    <input
      id={id}
      name={id}
      type={type}
      autoComplete={autoComplete}
      required={required}
      className={`appearance-none relative block w-full px-4 py-3 ${
        showToggle ? "pr-12" : ""
      } border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] sm:text-sm bg-white/90 transition-colors duration-200 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />

    {showToggle && (
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
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
          // Use navigateToDefaultMenu for dynamic role-based routing
          // based on the user's role configuration menu items.
          // Fall back to getRoleBasedRedirectPath if navigateToDefaultMenu fails.
          const navigated = navigateToDefaultMenu(normalizedRole, router);
          if (!navigated) {
            const redirectPath = getRoleBasedRedirectPath(normalizedRole);
            // For admin/superAdmin routes, use a full navigation so the Next.js middleware
            // can verify the JWT in the edge runtime.
            if (redirectPath.startsWith('/admin') || redirectPath.startsWith('/superAdmin')) {
              setIsNavigating(true);
              window.location.assign(redirectPath);
            } else {
              setIsNavigating(true);
              router.push(redirectPath);
            }
          } else {
            setIsNavigating(true);
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
        className='rounded-t-md uppercase'
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
      className="rounded-b-md"
      showToggle
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword((prev) => !prev)}
    />
  ),
  [formData.password, isLoading, updateField, showPassword]
);

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative overflow-hidden bg-[url('/backgroundIMGALMS.jpeg')]"
      role='main'
    >
      <div
        className='absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]'
        aria-hidden='true'
      />
      <div className='relative flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className={`max-w-md w-full space-y-6 bg-white/90 p-10 rounded-lg shadow-xl backdrop-blur-sm border border-white/40 transition-all duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
          <div className='flex flex-col items-center'>
            <div className='mb-6'>
              <ImageFixed
                src={LOGO_IMAGE}
                alt='ALMS Logo'
                width={120}
                height={120}
                className='drop-shadow-md h-auto'
                priority
              />
            </div>
            <h1 className='mt-2 text-center text-3xl font-extrabold text-black'>
              Arms License Management System
            </h1>
            <p className='mt-2 text-center text-sm text-gray-700'>
              Sign in to access your dashboard
            </p>
            <Link
              href="/"
              className="mt-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          {error && <ErrorMessage message={error} />}

          <form className='mt-8 space-y-6' onSubmit={handleSubmit} noValidate>
            <div className='rounded-md shadow-sm -space-y-px'>
              {usernameInput}
              {passwordInput}
            </div>

            <div>
              <button
                type='submit'
                disabled={isLoading || !isFormValid}
                className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200'
                aria-describedby={!isFormValid ? 'form-validation' : undefined}
              >
                {isLoading && <LoadingSpinner />}
                <span className='font-semibold'>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              </button>
              {!isFormValid && (
                <div id='form-validation' className='sr-only'>
                  Please fill in all required fields
                </div>
              )}
            </div>
          </form>
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
