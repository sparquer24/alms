'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import { useAuthSync } from '../../hooks/useAuthSync';
import { getUserFromCookie } from '../../utils/authCookies';
import { PageLayoutSkeleton } from '../../components/Skeleton';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthSync();
  const router = useRouter();

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

  const role = useMemo(() => cookieUser?.role ?? {}, [cookieUser]);
  const location = useMemo(() => cookieUser?.location ?? {}, [cookieUser]);

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

  // Normalize menu items into simple strings (handle arrays of objects or strings)
  const menuItems = useMemo(() => {
    const raw = parseArrayLike(role?.menu_items);
    return raw
      .map((it: any) => {
        if (it === null || it === undefined) return '';
        if (typeof it === 'string') return it;
        if (typeof it === 'number') return String(it);
        if (typeof it === 'object') return it.name || it.label || it.key || JSON.stringify(it);
        return String(it);
      })
      .filter(Boolean);
  }, [role]);
  const permissions = useMemo(() => parseArrayLike(role?.permissions), [role]);

  const handleSearch = () => {};
  const handleDateFilter = () => {};
  const handleReset = () => {};

  // Show skeleton while auth is loading
  if (authLoading) return <PageLayoutSkeleton />;
  if (!authLoading && !isAuthenticated) return null;

  return (
    <div className='flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]'>
      <Sidebar />
      <Header onSearch={handleSearch} onDateFilter={handleDateFilter} onReset={handleReset} />

      <main className='flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px]'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h1 className='text-2xl font-bold mb-6'>User Information</h1>

          {!cookieUser && (
            <div className='mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
              <p className='text-yellow-700'>No user found in cookies.</p>
            </div>
          )}

          {cookieUser && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='col-span-1'>
                <div className='bg-gray-50 p-6 rounded-lg border border-gray-200'>
                  <h2 className='text-lg font-semibold mb-4'>Profile</h2>
                  <div className='flex items-center justify-center mb-6'>
                    <div className='w-24 h-24 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-2xl font-bold'>
                      {(cookieUser?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Username
                      </label>
                      <p className='p-2 bg-gray-100 rounded'>{cookieUser?.username}</p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                      <p className='p-2 bg-gray-100 rounded'>{cookieUser?.email || '—'}</p>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          User ID
                        </label>
                        <p className='p-2 bg-gray-100 rounded'>{cookieUser?.id}</p>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Created
                        </label>
                        <p className='p-2 bg-gray-100 rounded'>
                          {cookieUser?.createdAt
                            ? new Date(cookieUser.createdAt).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='col-span-1'>
                <div className='bg-gray-50 p-6 rounded-lg border border-gray-200'>
                  <h2 className='text-lg font-semibold mb-4'>Role</h2>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                      <p className='p-2 bg-gray-100 rounded'>
                        {role?.name} ({role?.code})
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Dashboard Title
                      </label>
                      <p className='p-2 bg-gray-100 rounded'>{role?.dashboard_title}</p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Can Access Settings
                      </label>
                      <p className='p-2 bg-gray-100 rounded'>
                        {role?.can_access_settings ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Menu Items
                      </label>
                      {menuItems.length === 0 ? (
                        <p className='p-2 bg-gray-100 rounded'>—</p>
                      ) : (
                        <div className='flex flex-wrap gap-2'>
                          {menuItems.map(item => (
                            <span
                              key={item}
                              className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                              title={item}
                            >
                              {toTitleCase(item)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Permissions
                      </label>
                      {permissions.length === 0 ? (
                        <p className='p-2 bg-gray-100 rounded'>—</p>
                      ) : (
                        <div className='flex flex-wrap gap-2'>
                          {permissions.map(perm => (
                            <span
                              key={perm}
                              className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                              title={perm}
                            >
                              {toTitleCase(perm)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='col-span-1'>
                <div className='bg-gray-50 p-6 rounded-lg border border-gray-200'>
                  <h2 className='text-lg font-semibold mb-4'>Location</h2>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>State</label>
                      <p className='p-2 bg-gray-100 rounded'>{location?.state?.name || '—'}</p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        District
                      </label>
                      <p className='p-2 bg-gray-100 rounded'>{location?.district?.name || '—'}</p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Division
                      </label>
                      <p className='p-2 bg-gray-100 rounded'>{location?.division?.name || '—'}</p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Zone</label>
                      <p className='p-2 bg-gray-100 rounded'>{location?.zone?.name || '—'}</p>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Police Station
                      </label>
                      <p className='p-2 bg-gray-100 rounded'>
                        {location?.policeStation?.name || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
