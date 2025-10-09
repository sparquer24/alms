"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/thunks/authThunks';
import { 
  selectAuthLoading, 
  selectAuthError, 
  setError, 
  selectIsAuthenticated, 
  selectCurrentUser 
} from '../../store/slices/authSlice';
import { getRoleBasedRedirectPath } from '../../config/roleRedirections';
import type { AppDispatch } from '../../store/store';
import { LoginSkeleton } from '../../components/Skeleton';


// Types
interface LoginFormData {
  username: string;
  password: string;
}

interface ErrorMapping {
  [key: string]: string;
}

// Constants
const ERROR_MESSAGES: ErrorMapping = {
  invalid_role: 'Your account has an invalid role. Please contact system administrator.',
  unhandled_role: 'Your role is not properly configured. Please contact system administrator.',
  no_role: 'No role assigned to your account. Please contact system administrator.',
  default: 'Authentication error. Please try logging in again.'
} as const;

// const BACKGROUND_IMAGE = '/backgroundIMGALMS.jpeg';
const LOGO_IMAGE = '/icon-alms.svg';

// Custom hooks
const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });

  const updateField = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ username: '', password: '' });
  }, []);

  const isFormValid = useMemo(() => {
    return formData.username.trim().length > 0 && formData.password.trim().length > 0;
  }, [formData]);

  return {
    formData,
    updateField,
    resetForm,
    isFormValid
  };
};

const useUrlErrorHandler = (dispatch: AppDispatch) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlError = searchParams?.get('error');
    
    if (urlError) {
      const errorMessage = ERROR_MESSAGES[urlError] || ERROR_MESSAGES.default;
      dispatch(setError(errorMessage));
    }
  }, [searchParams, dispatch]);
};

// Components
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-400 rounded-md p-4 mb-4 shadow-sm" role="alert">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg 
          className="h-5 w-5 text-red-500" 
          viewBox="0 0 20 20" 
          fill="currentColor"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-red-700">{message}</p>
      </div>
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <svg 
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
}> = ({ 
  id, 
  type, 
  placeholder, 
  value, 
  onChange, 
  disabled = false, 
  autoComplete,
  required = false,
  className = ''
}) => (
  <div>
    <label htmlFor={id} className="sr-only">
      {placeholder}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      autoComplete={autoComplete}
      required={required}
      className={`appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:z-10 sm:text-sm bg-white/90 transition-colors duration-200 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // Prevent hydration mismatch warnings caused by browser extensions injecting attributes client-side
      suppressHydrationWarning
      disabled={disabled}
      aria-describedby={disabled ? `${id}-disabled` : undefined}
    />
    {disabled && (
      <div id={`${id}-disabled`} className="sr-only">
        This field is disabled while processing your request
      </div>
    )}
  </div>
);

// Main component
export default function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Redux selectors
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // Custom hooks
  const { formData, updateField, resetForm, isFormValid } = useLoginForm();
  useUrlErrorHandler(dispatch);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setIsRedirecting(true);
      const redirectPath = getRoleBasedRedirectPath(currentUser?.role);
      if (redirectPath && typeof redirectPath === 'string') {
        // If redirecting to an admin area, perform a full navigation so the
        // server middleware sees the newly-set cookies. For non-admin routes,
        // client-side navigation is fine.
        if (redirectPath.startsWith('/admin')) {
          // small delay to ensure cookies set by the thunk are flushed
          setTimeout(() => { window.location.assign(redirectPath); }, 50);
        } else {
          router.push(redirectPath);
        }
      } else {
        console.warn('No redirect path determined for user:', currentUser);
        // Fallback to root
        router.push('/');
      }
    }
  }, [isAuthenticated, currentUser, router]);

  // Form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      dispatch(setError('Please enter both username and password'));
      return;
    }

    try {
      const loginPayload = { 
        username: formData.username.trim(), 
        password: formData.password 
      };
      console.log('Login payload:', loginPayload);
      const result = await dispatch(login(loginPayload)).unwrap();
      console.log('Login API response:', result);
      if (result && result.user) {
        console.log('User object:', result.user);
        // Normalize role to uppercase string for consistent redirects
        const extractRole = (u: any): string | undefined => {
          if (!u) return undefined;
          const roleObj = u.role ?? u;
          const candidate = roleObj?.code || roleObj?.key || roleObj?.name || u?.roleCode || u?.role_id || u?.roleId || (typeof roleObj === 'string' ? roleObj : null) || (Array.isArray(u?.roles) ? u.roles[0] : null);
          return candidate ? String(candidate).trim().toUpperCase() : undefined;
        };
        const normalizedRole = extractRole(result.user);
        console.log('Normalized role:', normalizedRole);
        if (!normalizedRole) {
          console.warn('Login returned no role; redirect may loop.');
          dispatch(setError('No role assigned to your account.'));
          setIsRedirecting(false);
        } else {
          const redirectPath = getRoleBasedRedirectPath(normalizedRole);
          console.log('Redirect path:', redirectPath);
          if (!redirectPath || typeof redirectPath !== 'string') {
            console.warn('Invalid redirectPath, falling back to root:', redirectPath);
          }
          dispatch(setError(''));
          setIsRedirecting(true);
          const finalPath = redirectPath || '/';
          if (finalPath.startsWith('/admin')) {
            // Full navigation to let middleware read cookies reliably. Use a slightly
            // longer delay to ensure cookies-next has written cookies to document.cookie.
            setTimeout(() => { window.location.assign(finalPath); }, 200);
          } else {
            router.push(finalPath);
          }
        }
      } else {
        console.warn('No user found in login result:', result);
        dispatch(setError('No user found after login.'));
      }
    } catch (err) {
      // Error is handled by the thunk and stored in Redux state
      console.error('Login error:', err);
      resetForm();
    }
  }, [dispatch, formData, isFormValid, resetForm]);

  // Memoized form inputs to prevent unnecessary re-renders
  const usernameInput = useMemo(() => (
    <FormInput
      id="username"
      type="text"
      placeholder="Username or Email"
      value={formData.username}
      onChange={(value) => updateField('username', value)}
      disabled={isLoading}
      autoComplete="username"
      required
      className="rounded-t-md"
    />
  ), [formData.username, isLoading, updateField]);

  const passwordInput = useMemo(() => (
    <FormInput
      id="password"
      type="password"
      placeholder="Password"
      value={formData.password}
      onChange={(value) => updateField('password', value)}
      disabled={isLoading}
      autoComplete="current-password"
      required
      className="rounded-b-md"
    />
  ), [formData.password, isLoading, updateField]);

  // Show LoginSkeleton while loading or redirecting
  if (isLoading || isRedirecting) {
    return <LoginSkeleton />;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[url('/backgroundIMGALMS.jpeg')]" 
      role="main"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="relative max-w-md w-full space-y-6 bg-white/90 p-10 rounded-lg shadow-xl backdrop-blur-sm border border-white/40">
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Image
              src={LOGO_IMAGE}
              alt="ALMS Logo"
              width={120}
              height={120}
              // Ensure aspect ratio is preserved if CSS changes one dimension
              className="drop-shadow-md h-auto"
              priority
            />
          </div>
          <h1 className="mt-2 text-center text-3xl font-extrabold text-black">
            Arms License Management System
          </h1>
          <p className="mt-2 text-center text-sm text-gray-700">
            Sign in to access your dashboard
          </p>
        </div>
        
        {/* Error Message */}
        {error && <ErrorMessage message={error} />}
        
        {/* Login Form */}
        <form 
          className="mt-8 space-y-6" 
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="rounded-md shadow-sm -space-y-px">
            {usernameInput}
            {passwordInput}
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {/* Placeholder for forgot password link */}
            </div>
            <div className="text-sm">
              <Link 
                href="/reset-password" 
                className="font-medium text-[#D4AF37] hover:text-[#C4A02F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 rounded"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200"
              aria-describedby={!isFormValid ? "form-validation" : undefined}
            >
              {isLoading && <LoadingSpinner />}
              <span className="font-semibold">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </span>
            </button>
            {!isFormValid && (
              <div id="form-validation" className="sr-only">
                Please fill in all required fields
              </div>
            )}
          </div>
        </form>
      </div>
      

    </div>
  );
}
