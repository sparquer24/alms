"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthLoading, selectAuthError, selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';
import { postData } from '../api/axiosConfig'; // centralized axios helper

interface DebugPanelProps {
  formData?: any;
  isFormValid?: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ formData, isFormValid }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Redux state
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        🐛 Debug Panel {isExpanded ? '▼' : '▶'}
      </button>
      
      {isExpanded && (
        <div className="absolute bottom-12 right-0 w-96 bg-gray-800 text-white p-4 rounded-lg shadow-xl max-h-96 overflow-y-auto text-xs">
          <h3 className="text-lg font-bold mb-2 text-yellow-400">🐛 Debug Information</h3>
          
          <div className="space-y-3">
            {/* Environment */}
            <div>
              <h4 className="font-semibold text-green-400">🌍 Environment:</h4>
              <div className="pl-2">
                <div>NODE_ENV: {process.env.NODE_ENV}</div>
                <div>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'undefined'}</div>
                <div>Base URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</div>
              </div>
            </div>

            {/* Redux State */}
            <div>
              <h4 className="font-semibold text-blue-400">🔄 Redux State:</h4>
              <div className="pl-2">
                <div>isLoading: {isLoading ? '✅' : '❌'}</div>
                <div>isAuthenticated: {isAuthenticated ? '✅' : '❌'}</div>
                <div>error: {error || 'None'}</div>
                <div>currentUser: {currentUser ? `${currentUser.username} (${currentUser.role})` : 'None'}</div>
              </div>
            </div>

            {/* Form State */}
            {formData && (
              <div>
                <h4 className="font-semibold text-purple-400">📝 Form State:</h4>
                <div className="pl-2">
                  <div>username: '{formData.username}' (length: {formData.username.length})</div>
                  <div>password: {'*'.repeat(formData.password.length)} (length: {formData.password.length})</div>
                  <div>isFormValid: {isFormValid ? '✅' : '❌'}</div>
                </div>
              </div>
            )}

            {/* Cookies */}
            <div>
              <h4 className="font-semibold text-orange-400">🍪 Cookies:</h4>
              <div className="pl-2">
                <div>auth cookie: {document.cookie.includes('auth') ? '✅ Present' : '❌ Missing'}</div>
                {document.cookie.includes('auth') && (
                  <div className="text-xs break-all">
                    {document.cookie.split(';').find(c => c.trim().startsWith('auth='))?.substring(0, 100)}...
                  </div>
                )}
              </div>
            </div>

            {/* API Endpoints */}
            <div>
              <h4 className="font-semibold text-cyan-400">🌐 API Endpoints:</h4>
              <div className="pl-2 text-xs">
                <div>Login: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/login</div>
                <div>Current User: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/me</div>
              </div>
            </div>

            {/* Test Credentials removed for production/security */}

            {/* Browser Info */}
            <div>
              <h4 className="font-semibold text-red-400">🌐 Browser:</h4>
              <div className="pl-2">
                <div>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</div>
                <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'SSR'}...</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                console.log('🐛 Full Debug State:', {
                  environment: {
                    NODE_ENV: process.env.NODE_ENV,
                    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
                  },
                  redux: { isLoading, isAuthenticated, error, currentUser },
                  form: formData,
                  cookies: document.cookie,
                  url: typeof window !== 'undefined' ? window.location.href : 'SSR'
                });
              }}
              className="mt-3 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
            >
              📋 Log Full State to Console
            </button>

            <button
              onClick={async () => {
                console.log('🔧 Running diagnostics (no credentials will be sent)');
                try {
                  // Simple health check to base URL
                  const endpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                  const res = await postData(`${endpoint}/health-check`, {});
                  console.log('� Health check response:', res);
                  alert('Diagnostics complete - check console for details');
                } catch (err) {
                  console.error('� Diagnostics failed:', err);
                  alert(`Diagnostics failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }}
              className="mt-2 bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
            >
              � Run diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
