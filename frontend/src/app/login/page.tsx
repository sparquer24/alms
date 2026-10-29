'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import IndianFlag from '../../components/IndianFlag';
import { getRoleBasedRedirectPath } from '../../config/roleRedirections';
import { AuthApi } from '../../config/APIClient';

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
  captchaCode: string;
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
    captchaCode: '',
  });

  const updateField = useCallback((field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value.trim() }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ username: '', password: '', captchaCode: '' });
  }, []);

  const isFormValid = useMemo(() => {
    return (
      formData.username.trim().length > 0 &&
      formData.password.trim().length > 0 &&
      formData.captchaCode.trim().length > 0
    );
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
  <div className='bg-red-50/95 border border-red-400 rounded-lg p-2.5 mb-2.5 shadow-sm' role='alert'>
    <div className='flex items-center'>
      <div className='flex-shrink-0'>
        <svg className='h-4 w-4 text-red-500' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
          <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <div className='ml-2.5'>
        <p className='text-xs font-medium text-red-700 leading-snug'>{message}</p>
      </div>
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className='relative w-3.5 h-3.5 mr-2 shrink-0 inline-block'>
    <div className='w-3.5 h-3.5 rounded-full border-2 border-white/20 animate-spin border-t-[#FF9933] border-r-white border-b-[#138808] border-l-[#D4AF37]' />
  </div>
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
  <div className='relative'>
    {icon && (
      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50'>
        {icon}
      </div>
    )}
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      autoComplete={autoComplete}
      required={required}
      className={`block w-full py-2.5 ${
        icon ? 'pl-9' : 'pl-3'
      } ${showToggle ? 'pr-9' : 'pr-3'} bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
    {showToggle && onTogglePassword && (
      <button
        type='button'
        onClick={onTogglePassword}
        disabled={disabled}
        className='absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition-colors focus:outline-none disabled:opacity-50'
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
            />
          </svg>
        ) : (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
            />
          </svg>
        )}
      </button>
    )}
  </div>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const RefreshIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const dynamic = 'force-dynamic';

function LoginContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const isAuthLoading = useSelector(selectAuthLoading);
  const isLoading = isAuthLoading || isNavigating;
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authInitialized = useSelector(selectAuthInitialized);
  const currentUser = useSelector(selectCurrentUser);
  const [showPassword, setShowPassword] = useState(false);

  // CAPTCHA state
  const [captchaData, setCaptchaData] = useState<{ captchaId: string; svg: string } | null>(null);
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);

  const { formData, updateField, resetForm, isFormValid } = useLoginForm();
  useUrlErrorHandler(dispatch);

  const loadCaptcha = useCallback(async () => {
    try {
      setIsCaptchaLoading(true);
      const res = await AuthApi.getCaptcha();
      if (res && res.success && res.data) {
        setCaptchaData(res.data);
        updateField('captchaCode', '');
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
    } finally {
      setIsCaptchaLoading(false);
    }
  }, [updateField]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  // If the user is already authenticated, redirect them away from login page
  useEffect(() => {
    if (!authInitialized || !isAuthenticated) return;
    if (!currentUser) return;

    const userRole = currentUser?.role ? normalizeRole(currentUser.role) : null;
    if (userRole) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      router.replace(redirectPath);
    }
  }, [authInitialized, isAuthenticated, currentUser, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid) {
        dispatch(setError('Please enter username, password, and CAPTCHA security code'));
        return;
      }

      try {
        const result = await dispatch(login({
          username: formData.username.trim().toUpperCase(),
          password: formData.password,
          captchaId: captchaData?.captchaId,
          captchaCode: formData.captchaCode.trim(),
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
          const redirectPath = getRoleBasedRedirectPath(normalizedRole);
          try {
            sessionStorage.setItem('loginRedirectApplied', 'true');
          } catch {}
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
        loadCaptcha();
      }
    },
    [dispatch, formData, isFormValid, resetForm, router, captchaData, loadCaptcha]
  );

  const usernameInput = useMemo(
    () => (
      <FormInput
        id='username'
        type='text'
        placeholder='Enter Username'
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

  const captchaInput = useMemo(
    () => (
      <FormInput
        id="captcha"
        type="text"
        placeholder="Enter case-sensitive code"
        value={formData.captchaCode}
        onChange={(value) => updateField("captchaCode", value)}
        disabled={isLoading}
        autoComplete="off"
        required
        className="font-mono tracking-wider"
        icon={<ShieldCheckIcon />}
      />
    ),
    [formData.captchaCode, isLoading, updateField]
  );

  return (
    <div
      className='min-h-screen flex flex-col relative overflow-hidden'
      role='main'
    >
      {/* Background Gradient Layer over PersistentHeroVideo */}
      <div
        className='absolute inset-0 bg-gradient-to-b from-[#071527]/85 via-[#0B1F3A]/75 to-[#071527]/90'
        aria-hidden='true'
      />

      {/* Indian National Tricolor Apex Ribbon */}
      <div className='relative z-20 h-[3px] w-full flex shadow-[0_1px_4px_rgba(0,0,0,0.4)]'>
        <div className='w-1/3 bg-[#FF9933]' />
        <div className='w-1/3 bg-[#FFFFFF]' />
        <div className='w-1/3 bg-[#138808]' />
      </div>

      {/* Main Login Card Container: Compact & Centered */}
      <div className='relative z-10 flex-grow flex items-center justify-center py-6 px-4 sm:px-6'>
        <div className={`relative max-w-[390px] w-full bg-white/10 p-5 sm:p-6 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl border border-white/20 transition-all duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
          {/* Official Indian National Tricolor Ribbon across card top */}
          <div className='absolute top-0 inset-x-0 h-1 flex shadow-sm'>
            <div className='w-1/3 bg-[#FF9933]' />
            <div className='w-1/3 bg-[#FFFFFF]' />
            <div className='w-1/3 bg-[#138808]' />
          </div>

          <div
            className='pointer-events-none absolute inset-0 rounded-xl'
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 60%)',
            }}
          />

          <div className='relative flex flex-col items-center text-center'>
            {/* Government of Telangana Badge with Tiranga Flag */}
            <div className='inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full border border-white/25 mb-2 shadow-sm'>
              <IndianFlag width={15} height={10} />
              <span className='text-[9px] font-bold text-[#FFD700] tracking-wider uppercase'>
                Government of Telangana
              </span>
            </div>

            {/* Crest with Gold Accent Ring */}
            <div className='mb-2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg ring-1.5 ring-[#D4AF37]/50 ring-offset-1 ring-offset-transparent border border-white/30'>
              <ImageFixed
                src={LOGO_IMAGE}
                alt='Telangana ALMS Crest'
                width={34}
                height={34}
                className='h-auto'
                priority
              />
            </div>

            <h1 className='text-base sm:text-lg font-black text-white leading-tight drop-shadow-sm'>
              Arms License Management System
            </h1>
            <p className='mt-0.5 text-[11px] text-gray-200 font-medium'>
              Home (Police) Department • Officer Sign In
            </p>

            {/* Indian National Tricolor Accent Hairline */}
            <div className='my-2 h-[2px] w-16 mx-auto rounded-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-[0_0_6px_rgba(255,153,51,0.5)]' />
          </div>

          {error && (
            <div className='relative mt-2'>
              <ErrorMessage message={error} />
            </div>
          )}

          <form className='relative mt-3.5 space-y-2.5' onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="username" className="block text-[11px] font-semibold text-gray-200 mb-1 uppercase tracking-wide">
                Officer Username
              </label>
              {usernameInput}
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-semibold text-gray-200 mb-1 uppercase tracking-wide">
                Password
              </label>
              {passwordInput}
            </div>

            <div>
              <label htmlFor="captcha" className="block text-[11px] font-semibold text-gray-200 mb-1 uppercase tracking-wide">
                Security Code (CAPTCHA)
              </label>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="flex-1 bg-slate-100 rounded-lg p-0.5 flex items-center justify-center border border-white/30 shadow-inner select-none overflow-hidden h-[38px]"
                  title="Security verification code"
                >
                  {captchaData?.svg ? (
                    <img
                      src={`data:image/svg+xml;utf8,${encodeURIComponent(captchaData.svg)}`}
                      alt="Security CAPTCHA"
                      className="h-full w-auto select-none pointer-events-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                      <span>Loading...</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={loadCaptcha}
                  disabled={isCaptchaLoading || isLoading}
                  title="Click to get a new CAPTCHA code"
                  aria-label="Refresh CAPTCHA"
                  className="h-[38px] w-[38px] shrink-0 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshIcon className={isCaptchaLoading ? 'animate-spin text-[#FFD700]' : 'text-gray-200'} />
                </button>
              </div>
              {captchaInput}
            </div>

            <div className='pt-1'>
              <button
                type='submit'
                disabled={isLoading || !isFormValid}
                className='group relative w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs sm:text-sm font-extrabold text-[#0B1F3A] bg-gradient-to-r from-[#D4AF37] via-[#C4A02F] to-[#B8860B] hover:from-[#E5BE48] hover:to-[#A0750A] shadow-lg hover:shadow-xl transition-all duration-200 border border-[#FFE58F]/50 disabled:opacity-50 disabled:cursor-not-allowed'
                aria-describedby={!isFormValid ? 'form-validation' : undefined}
              >
                {isLoading && <LoadingSpinner />}
                <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              </button>
              {!isFormValid && (
                <div id='form-validation' className='sr-only'>
                  Please fill in all required fields
                </div>
              )}
            </div>
          </form>

          {/* Simple Back Link & Access Notice */}
          <div className='relative mt-3.5 pt-2.5 border-t border-white/15 flex flex-col items-center gap-1 text-center'>
            <Link
              href="/"
              className="text-[11px] text-gray-300 hover:text-white transition-colors"
            >
              &larr; Back to Portal Home
            </Link>
            <p className='text-[9.5px] text-gray-400'>
              Authorized Police &amp; Magisterial Personnel Access Only
            </p>
          </div>
        </div>
      </div>

      {/* Official Telangana State Police Footer with Indian Flag */}
      <footer className='relative z-20 w-full bg-[#071324]/95 backdrop-blur-md border-t border-white/10 py-2.5 text-[11px] text-gray-300'>
        <div className='max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left'>
          <div className='flex items-center gap-1.5 justify-center sm:justify-start'>
            <IndianFlag width={16} height={11} />
            <span>&copy; {new Date().getFullYear()} <strong className='text-white'>Government of Telangana</strong> • Home (Police) Department</span>
          </div>
          <div className='flex items-center gap-2.5 text-[10.5px] text-gray-400 justify-center sm:justify-end'>
            <span>The Arms Act, 1959</span>
            <span>•</span>
            <span>The Arms Rules, 2016</span>
            <span>•</span>
            <span className='font-mono text-[#D4AF37]'>State Secure Portal</span>
          </div>
        </div>
      </footer>
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
