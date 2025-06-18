"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import { useAuth } from '../../config/auth';
import { RoleTypes, getRoleConfig } from '../../config/roles';
import { UserApi } from '../../config/APIClient';

export default function SettingsPage() {
  const { isAuthenticated, userRole, userName, setUserRole, token } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    applicationStatusChanges: true,
    applicationForwarded: true,
    applicationReturned: true,
    commentNotifications: true,
    systemAlerts: true,
    darkMode: false,
    compactView: false,
    autoSave: true,
    language: 'english'
  });

  // Fetch user preferences on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (token) {
      fetchUserPreferences();
    }
  }, [isAuthenticated, router, token]);

  // Fetch user preferences from the API
  const fetchUserPreferences = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await UserApi.getPreferences(token);
      
      if (response.success && response.data) {
        const userPreferences = response.data;
        
        // Update settings state with fetched preferences
        setSettings({
          notifications: userPreferences.notifications?.enabled ?? true,
          emailAlerts: userPreferences.notifications?.emailNotifications ?? true,
          applicationStatusChanges: userPreferences.notifications?.applicationStatusChanges ?? true,
          applicationForwarded: userPreferences.notifications?.applicationForwarded ?? true,
          applicationReturned: userPreferences.notifications?.applicationReturned ?? true,
          commentNotifications: userPreferences.notifications?.commentNotifications ?? true,
          systemAlerts: userPreferences.notifications?.systemAlerts ?? true,
          darkMode: userPreferences.display?.darkMode ?? false,
          compactView: userPreferences.display?.compactView ?? false,
          autoSave: userPreferences.application?.autoSave ?? true,
          language: userPreferences.display?.language ?? 'english'
        });
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      setErrorMessage("Failed to load user preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserRole(e.target.value as keyof typeof RoleTypes);
    setSuccessMessage('Role updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle setting changes with API update
  const handleSettingChange = async (setting: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Save to backend if authenticated
    if (token) {
      setIsLoading(true);
      
      try {
        // Format preferences based on the updated setting
        const preferences = formatPreferencesForApi({
          ...settings,
          [setting]: value
        });
        
        const response = await UserApi.updatePreferences(token, preferences);
        
        if (response.success) {
          setSuccessMessage('Setting updated successfully!');
        } else {
          setErrorMessage('Failed to update setting: ' + (response.error?.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error updating user preferences:', error);
        setErrorMessage('An error occurred while saving your preferences');
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 3000);
      }
    }
  };
  
  // Format settings object into the structure expected by the API
  const formatPreferencesForApi = (currentSettings: any) => {
    return {
      notifications: {
        enabled: currentSettings.notifications,
        applicationStatusChanges: currentSettings.applicationStatusChanges,
        applicationForwarded: currentSettings.applicationForwarded,
        applicationReturned: currentSettings.applicationReturned,
        commentNotifications: currentSettings.commentNotifications,
        systemAlerts: currentSettings.systemAlerts,
        emailNotifications: currentSettings.emailAlerts
      },
      display: {
        darkMode: currentSettings.darkMode,
        compactView: currentSettings.compactView,
        language: currentSettings.language
      },
      application: {
        autoSave: currentSettings.autoSave
      }
    };
  };

  const handleSearch = () => {};
  const handleDateFilter = () => {};
  const handleReset = () => {};

  const roleConfig = getRoleConfig(userRole);

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />

      <main className="flex-1 p-8 overflow-y-auto ml-[18%] mt-[70px]">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {isLoading && (
            <div className="mb-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User Profile Section */}
            <div className="col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">User Profile</h2>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-2xl font-bold">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="p-2 bg-gray-100 rounded">{userName}</p>
                  </div>                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                    <p className="p-2 bg-gray-100 rounded">{roleConfig.displayName}</p>
                  </div>
                  <div>
                    <button
                      onClick={() => router.push('/settings/change-password')}
                      className="w-full py-2 px-3 border border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Switch Role (Demo Only)
                    </label>                    <select
                      id="role"
                      value={userRole}
                      onChange={handleRoleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#6366F1] focus:border-[#6366F1]"
                    >
                      <option value={RoleTypes.APPLICANT}>Citizen Applicant</option>
                      <option value={RoleTypes.ZS}>Zonal Superintendent</option>
                      <option value={RoleTypes.DCP}>Deputy Commissioner of Police</option>
                      <option value={RoleTypes.ACP}>Assistant Commissioner of Police</option>
                      <option value={RoleTypes.SHO}>Station House Officer</option>
                      <option value={RoleTypes.AS}>Arms Superintendent</option>
                      <option value={RoleTypes.ADO}>Administrative Officer</option>
                      <option value={RoleTypes.CADO}>Chief Administrative Officer</option>
                      <option value={RoleTypes.JTCP}>Joint Commissioner of Police</option>
                      <option value={RoleTypes.CP}>Commissioner of Police</option>
                      <option value={RoleTypes.ADMIN}>System Administrator</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className="col-span-2">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Application Settings</h2>
                
                <div className="space-y-6">                  {/* Notifications Section */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Notification Preferences</h3>
                    
                    {/* All Notifications Toggle */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900">Enable Notifications</h4>
                        <p className="text-sm text-gray-500">Master toggle for all notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications}
                          onChange={() => handleSettingChange('notifications', !settings.notifications)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1]"></div>
                      </label>
                    </div>
                    
                    {/* Individual Notification Settings */}
                    <div className={settings.notifications ? "space-y-4 pl-2" : "space-y-4 pl-2 opacity-50 pointer-events-none"}>
                      {/* Status Changes */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Application Status Changes</h4>
                          <p className="text-xs text-gray-500">Get notified when application status changes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.applicationStatusChanges}
                            onChange={() => handleSettingChange('applicationStatusChanges', !settings.applicationStatusChanges)}
                            disabled={!settings.notifications}
                          />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6366F1]"></div>
                        </label>
                      </div>
                      
                      {/* Applications Forwarded */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Applications Forwarded</h4>
                          <p className="text-xs text-gray-500">Get notified when applications are forwarded to you</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.applicationForwarded}
                            onChange={() => handleSettingChange('applicationForwarded', !settings.applicationForwarded)}
                            disabled={!settings.notifications}
                          />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6366F1]"></div>
                        </label>
                      </div>
                      
                      {/* Applications Returned */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Applications Returned</h4>
                          <p className="text-xs text-gray-500">Get notified when applications are returned</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.applicationReturned}
                            onChange={() => handleSettingChange('applicationReturned', !settings.applicationReturned)}
                            disabled={!settings.notifications}
                          />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6366F1]"></div>
                        </label>
                      </div>
                      
                      {/* Comments */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Comments & Remarks</h4>
                          <p className="text-xs text-gray-500">Get notified when new comments are added</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.commentNotifications}
                            onChange={() => handleSettingChange('commentNotifications', !settings.commentNotifications)}
                            disabled={!settings.notifications}
                          />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6366F1]"></div>
                        </label>
                      </div>
                      
                      {/* System Alerts */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">System Alerts</h4>
                          <p className="text-xs text-gray-500">Get notified about system updates and maintenance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.systemAlerts}
                            onChange={() => handleSettingChange('systemAlerts', !settings.systemAlerts)}
                            disabled={!settings.notifications}
                          />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6366F1]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Alerts */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div>
                      <h3 className="font-medium text-gray-900">Email Alerts</h3>
                      <p className="text-sm text-gray-500">Receive email alerts for important updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.emailAlerts}
                        onChange={() => handleSettingChange('emailAlerts', !settings.emailAlerts)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1]"></div>
                    </label>
                  </div>

                  {/* Dark Mode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Dark Mode</h3>
                      <p className="text-sm text-gray-500">Toggle dark theme for the application</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.darkMode}
                        onChange={() => handleSettingChange('darkMode', !settings.darkMode)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1]"></div>
                    </label>
                  </div>

                  {/* Compact View */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Compact View</h3>
                      <p className="text-sm text-gray-500">Use compact view for tables and lists</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.compactView}
                        onChange={() => handleSettingChange('compactView', !settings.compactView)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1]"></div>
                    </label>
                  </div>

                  {/* Auto Save */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Auto Save Forms</h3>
                      <p className="text-sm text-gray-500">Automatically save form data as you type</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.autoSave}
                        onChange={() => handleSettingChange('autoSave', !settings.autoSave)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6366F1] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1]"></div>
                    </label>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      id="language"
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#6366F1] focus:border-[#6366F1]"
                    >
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="marathi">Marathi</option>
                      <option value="tamil">Tamil</option>
                      <option value="telugu">Telugu</option>
                      <option value="bengali">Bengali</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-6">
                <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <button 
                    className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] w-full md:w-auto"
                    onClick={() => setSuccessMessage('Password change functionality would be implemented here!')}
                  >
                    Change Password
                  </button>
                  <button 
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full md:w-auto"
                    onClick={() => setSuccessMessage('Two-factor authentication would be implemented here!')}
                  >
                    Setup Two-Factor Authentication
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
