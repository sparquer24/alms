'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/thunks/authThunks';
import { getUserFromCookie } from '../../utils/authCookies';
import { PageLayoutSkeleton } from '../../components/Skeleton';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const dispatch = useDispatch();

  const router = useRouter();
  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        // Call shared logout thunk to clear state/cookies
        await dispatch(logoutUser() as any);
        // small delay to ensure cleanup
        await new Promise(res => setTimeout(res, 250));
      }
    } finally {
      router.push('/login');
    }
  }, [dispatch, router, token]);

  const [cookieUser, setCookieUser] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    try {
      const u = getUserFromCookie();
      setCookieUser(u);
      if (process.env.NODE_ENV === 'development') {
        console.debug('[SettingsPage] cookieUser loaded:', u);
      }
    } catch (e) {
      setCookieUser(null);
    }
  }, []);

  if (process.env.NODE_ENV === 'development') {
    console.debug('[SettingsPage] authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
  }

  const { user } = useAuth();
  const currentUser = useMemo(() => user ?? cookieUser, [user, cookieUser]);
  const roleData = useMemo(() => currentUser?.role ?? {}, [currentUser]);
  const location = useMemo(() => currentUser?.location ?? currentUser?.state ?? {}, [currentUser]);

  console.log({ currentUser, roleData, location });

  // Pretty helpers
  const toTitleCase = (txt: string) =>
    (txt || '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

  const parseArrayLike = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val as string[];
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Fallback: comma-separated
        return val
          .split(',')
          .map(v => v.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  // Normalize permissions array from currentUser (handles various shapes)
  const userPermissions = useMemo(() => parseArrayLike(currentUser?.permissions), [currentUser?.permissions]);

  // ================= Profile =================
  const showFullName = Boolean(currentUser?.name);
  const showUsername = Boolean(currentUser?.username);
  const showEmail = Boolean(currentUser?.email);
  const showUserId = Boolean(currentUser?.id);
  const showCreated = Boolean(currentUser?.createdAt);
  const showLastLogin = Boolean(currentUser?.lastLogin);
  const showStateId = Boolean(currentUser?.stateId);
  const showState = Boolean(currentUser?.state) || Boolean(currentUser?.location?.state?.name);

  // ================= Role =================
  // roleData is the role code string (e.g. "ADMIN") from the auth store
  const showRoleCode = Boolean(roleData) && typeof roleData === 'string';
  const showRoleDesignation = Boolean(currentUser?.designation);
  const showUserPermissions = userPermissions.length > 0;
  const showAvailableActions = Array.isArray(currentUser?.availableActions) && currentUser.availableActions.length > 0;

  const hasRoleData =
    showRoleCode ||
    showRoleDesignation ||
    showUserPermissions ||
    showAvailableActions;

  // Show skeleton while auth is loading
  if (authLoading) return <PageLayoutSkeleton />;
  if (!authLoading && !isAuthenticated) return null;

  return (
    <div className='flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]'>
      <Sidebar />
      <Header />

      <main className='flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto ml-0 md:ml-72 mt-[64px] md:mt-[102px]'>
        <div className='bg-white rounded-lg shadow p-4 sm:p-6 max-w-6xl mx-auto'>
          <h1 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800'>User Information</h1>

          {!currentUser && (
            <div className='mb-4 sm:mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
              <p className='text-yellow-700 text-sm'>No user found in cookies or auth state.</p>
            </div>
          )}

          {currentUser && (
            <div className='flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6'>
              {/* Profile Section - First on mobile */}
              <section className='bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200'>
                <h2 className='text-lg font-semibold mb-3 sm:mb-4 text-gray-700'>Profile</h2>
                <div className='flex items-center justify-center mb-4 sm:mb-6'>
                  <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md'>
                    {(currentUser?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className='space-y-3 sm:space-y-4'>
                  {showFullName && (
                    <div>
                      <label className='block text-sm font-medium text-gray-600 mb-1'>Full Name</label>
                      <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{currentUser?.name}</p>
                    </div>
                  )}
                  {showUsername && (
                    <div>
                      <label className='block text-sm font-medium text-gray-600 mb-1'>Username</label>
                      <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{currentUser?.username}</p>
                    </div>
                  )}
                  {showEmail && (
                    <div>
                      <label className='block text-sm font-medium text-gray-600 mb-1'>Email</label>
                      <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{currentUser?.email}</p>
                    </div>
                  )}
                  {(showUserId || showCreated || showLastLogin || showStateId || showState) && (
                    <div className='grid grid-cols-2 gap-2 sm:gap-3'>
                      {showUserId && (
                        <div>
                          <label className='block text-sm font-medium text-gray-600 mb-1'>User ID</label>
                          <p className='p-2 bg-white rounded border border-gray-200 text-gray-800 text-xs sm:text-sm'>{currentUser?.id}</p>
                        </div>
                      )}
                      {showCreated && (
                        <div>
                          <label className='block text-sm font-medium text-gray-600 mb-1'>Created</label>
                          <p className='p-2 bg-white rounded border border-gray-200 text-gray-800 text-xs sm:text-sm'>
                            {new Date(currentUser.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {showLastLogin && (
                        <div>
                          <label className='block text-sm font-medium text-gray-600 mb-1'>Last Login</label>
                          <p className='p-2 bg-white rounded border border-gray-200 text-gray-800 text-xs sm:text-sm'>
                            {new Date(currentUser.lastLogin).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {showStateId && (
                        <div>
                          <label className='block text-sm font-medium text-gray-600 mb-1'>State ID</label>
                          <p className='p-2 bg-white rounded border border-gray-200 text-gray-800 text-xs sm:text-sm'>{currentUser?.stateId}</p>
                        </div>
                      )}
                      {showState && (
                        <div>
                          <label className='block text-sm font-medium text-gray-600 mb-1'>State</label>
                          <p className='p-2 bg-white rounded border border-gray-200 text-gray-800 text-xs sm:text-sm'>
                            {currentUser?.state?.name || currentUser?.state || currentUser?.location?.state?.name || '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Role Section - Second on mobile */}
              {hasRoleData && (
                <section className='bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200'>
                  <h2 className='text-lg font-semibold mb-3 sm:mb-4 text-gray-700'>Role</h2>
                  <div className='space-y-3 sm:space-y-4'>
                    {showRoleCode && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-1'>Role</label>
                        <p className='p-2 bg-white rounded border border-gray-200 text-gray-800 font-medium'>
                          {roleData}
                        </p>
                      </div>
                    )}
                    {showRoleDesignation && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-1'>Designation</label>
                        <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>
                          {currentUser?.designation}
                        </p>
                      </div>
                    )}
                    {showUserPermissions && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-2'>Permissions</label>
                        <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                          {userPermissions.map(perm => (
                            <span
                              key={perm}
                              className='inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'
                              title={perm}
                            >
                              {toTitleCase(perm)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {showAvailableActions && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-2'>Available Actions</label>
                        <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                          {currentUser.availableActions.map((action: any) => (
                            <span
                              key={`${action.action}:${action.resource}`}
                              className='inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200'
                              title={`${action.action}:${action.resource}`}
                            >
                              {`${action.action}:${action.resource}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Location Section - Third on mobile */}
              <section className='bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200'>
                <h2 className='text-lg font-semibold mb-3 sm:mb-4 text-gray-700'>Location</h2>
                <div className='space-y-3 sm:space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>State</label>
                    <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{location?.state?.name || '—'}</p>
                  </div>
                  {
                    location?.district?.name && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-1'>District</label>
                        <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{location.district.name}</p>
                      </div>
                    )
                  }

                  {
                    location?.rangeOffice?.name && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-1'>Range Office</label>
                        <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{location?.rangeOffice?.name}</p>
                      </div>
                    )
                  }

                  {
                    location?.zone?.name && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-1'>Zone</label>
                        <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{location?.zone?.name}</p>
                      </div>
                    )
                  }

                  {
                    location?.division?.name && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-1'>Division</label>
                        <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{location?.division?.name}</p>
                      </div>
                    )
                  }
                  {
                    location?.policeStation?.name && (
                      <div>
                        <label className='block text-sm font-medium text-gray-600 mb-1'>Police Station</label>
                        <p className='p-2 bg-white rounded border border-gray-200 text-gray-800'>{location.policeStation.name}</p>
                      </div>
                    )
                  }
                </div>
              </section>
            </div>
          )}

          {/* Logout Button */}
          <div className='mt-6 sm:mt-8'>
            <button
              onClick={handleLogout}
              className='w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium'
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
