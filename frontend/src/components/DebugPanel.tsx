"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthLoading, selectAuthError, selectIsAuthenticated, selectCurrentUser } from '../store/slices/authSlice';

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
                <div>Current User: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/me</div>
              </div>
            </div>

            {/* Test Credentials */}
            <div>
              <h4 className="font-semibold text-yellow-400">🔑 Test Credentials:</h4>
              <div className="pl-2 text-xs">
                <div>Username: <span className="text-green-300">ADMIN_USER</span></div>
                <div>Password: <span className="text-green-300">password</span></div>
                <div className="mt-1 text-gray-400">Other users: CP_HYD, ACP_NORTH, DCP_CENTRAL</div>
                <div className="text-gray-400">All passwords: password</div>
              </div>
            </div>

            {/* Browser Info */}
            <div>
              <h4 className="font-semibold text-red-400">🌐 Browser:</h4>
              <div className="pl-2">
                <div>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</div>
                <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'SSR'}...</div>
              </div>
            </div>
          </div>
          
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
              const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
              const endpoint = `${baseUrl}/auth/login`;
              console.log('🧪 Testing connectivity to:', endpoint);
              
              try {
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    username: 'ADMIN_USER',
                    password: 'password'
                  }),
                });
                
                console.log('🧪 Response status:', response.status);
                console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
                
                const data = await response.json();
                console.log('🧪 Response data:', data);
                
                alert(`API Test: ${response.status} - Check console for details`);
              } catch (error) {
                console.error('🧪 API Test failed:', error);
                alert(`API Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
          >
            🧪 Test API with Valid Credentials
          </button>
          
          <button
            onClick={async () => {
              const endpoint = 'http://localhost:3000/auth/login';
              console.log('🔥 Testing EXACT Postman payload:', endpoint);
              
              const payload = {
                username: 'CADO_HYD',
                password: 'password'
              };
              
              console.log('🔥 Payload being sent:', payload);
              
              try {
                const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload),
                });
                
                console.log('🔥 Response status:', response.status);
                console.log('🔥 Response headers:', Object.fromEntries(response.headers.entries()));
                
                const responseText = await response.text();
                console.log('🔥 Raw response text:', responseText);
                
                try {
                  const data = JSON.parse(responseText);
                  console.log('🔥 Parsed response data:', data);
                  alert(`Postman Test: ${response.status} - ${data.success ? 'SUCCESS' : 'FAILED'} - Check console`);
                } catch (parseError) {
                  console.error('🔥 Failed to parse JSON:', parseError);
                  alert(`Postman Test: ${response.status} - Parse Error - Check console`);
                }
              } catch (error) {
                console.error('🔥 Postman test failed:', error);
                alert(`Postman test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
            className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
          >
            🔥 Test Exact Postman Payload
          </button>
        </div>
      )}
    </div>
  );
};
