"use client";

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated, selectAuthToken } from '../store/slices/authSlice';

interface AuthDebugInfoProps {
  showCookieInfo?: boolean;
}

const getCookieInfo = (): { [key: string]: any } => {
  if (typeof window === 'undefined') return { error: 'Server-side rendering' };

  try {
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth='));

    if (authCookie) {
      const cookieValue = decodeURIComponent(authCookie.split('=')[1]);
      return JSON.parse(cookieValue);
    }
    return { message: 'No auth cookie found' };
  } catch (error) {
    return { error: `Failed to parse cookie: ${error}` };
  }
};

export const AuthDebugInfo: React.FC<AuthDebugInfoProps> = ({ showCookieInfo = false }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const token = useSelector(selectAuthToken);

  const cookieInfo = useMemo(() => (showCookieInfo ? getCookieInfo() : null), [showCookieInfo]);

  return (
    <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 font-mono text-sm">
      <h3 className="font-bold text-lg mb-3 text-gray-800">Authentication Debug Info</h3>

      <div className="space-y-2">
        <div>
          <span className="font-semibold">Redux State:</span>
        </div>
        <div className="ml-4 space-y-1">
          <DebugItem label="isAuthenticated" value={isAuthenticated ? 'true' : 'false'} isHighlighted={isAuthenticated} />
          <DebugItem label="token" value={token ? '✓ Present' : '✗ Missing'} />
          <DebugItem label="user role" value={currentUser?.role || 'No role'} isHighlighted={!!currentUser?.role} />
          <DebugItem label="user name" value={currentUser?.name || 'No name'} />
          <DebugItem label="user id" value={currentUser?.id || 'No ID'} />
          <DebugItem label="full user object" value={currentUser ? JSON.stringify(currentUser) : 'No user data'} isCode />
        </div>

        {showCookieInfo && (
          <>
            <div className="mt-4">
              <span className="font-semibold">Cookie Data:</span>
            </div>
            <div className="ml-4">
              <pre className="bg-white p-2 rounded border max-h-32 overflow-y-auto text-xs">
                {JSON.stringify(cookieInfo, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface DebugItemProps {
  label: string;
  value: string;
  isHighlighted?: boolean;
  isCode?: boolean;
}

const DebugItem: React.FC<DebugItemProps> = ({ label, value, isHighlighted = false, isCode = false }) => {
  const highlightClass = isHighlighted ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800';
  const valueClass = isCode ? 'text-xs' : '';

  return (
    <div>
      <span className="font-medium">{label}:</span>
      <span className={`ml-2 px-2 py-1 rounded ${isHighlighted ? highlightClass : ''} ${valueClass}`}>{value}</span>
    </div>
  );
};

export default React.memo(AuthDebugInfo);
