/**
 * Fresh Application Data Loader Component
 * 
 * This component demonstrates and provides easy access to the loadExistingData functionality.
 * It can be used as a standalone component or integrated into the main form flow.
 */
"use client";

import React, { useState } from 'react';
import { FormDataLoader, useFormDataLoader } from '../utils/formDataLoader';
import { Input } from '../components/forms/elements/Input';

interface ApplicationDataLoaderProps {
  /** Optional callback when data is loaded successfully */
  onDataLoaded?: (data: any) => void;
  /** Optional callback when loading fails */
  onError?: (error: string) => void;
  /** Show as compact version */
  compact?: boolean;
}

const ApplicationDataLoader: React.FC<ApplicationDataLoaderProps> = ({
  onDataLoaded,
  onError,
  compact = false
}) => {
  const [applicationId, setApplicationId] = useState('');
  const [loadedData, setLoadedData] = useState<any>(null);
  const [availability, setAvailability] = useState<any>(null);
  
  const {
    loadData,
    loading,
    error,
    progress,
    progressMessage
  } = useFormDataLoader();

  const handleLoadData = async () => {
    if (!applicationId.trim()) {
      onError?.('Please enter an Application ID');
      return;
    }

    try {
      // First check availability
      const availabilityStatus = await FormDataLoader.checkDataAvailability(applicationId);
      setAvailability(availabilityStatus);

      if (!availabilityStatus.exists) {
        onError?.(availabilityStatus.message);
        return;
      }

      // Load the data
      const data = await loadData(applicationId);
      setLoadedData(data);
      onDataLoaded?.(data);
      
    } catch (err: any) {
      onError?.(err.message);
    }
  };

  const handleCheckAvailability = async () => {
    if (!applicationId.trim()) {
      return;
    }

    try {
      const availabilityStatus = await FormDataLoader.checkDataAvailability(applicationId);
      setAvailability(availabilityStatus);
    } catch (err: any) {
      onError?.(err.message);
    }
  };

  if (compact) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex gap-2 items-end">
          <Input
            label="Application ID"
            name="applicationId"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="Enter Application ID (e.g., APP12345)"
            className="flex-1"
          />
          <button
            onClick={handleLoadData}
            disabled={loading || !applicationId.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>
        
        {loading && (
          <div className="mt-2 text-sm text-gray-600">
            {progressMessage} ({progress}%)
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        {availability && (
          <div className="mt-2 text-sm">
            {availability.exists ? (
              <span className="text-green-600">✅ {availability.message}</span>
            ) : (
              <span className="text-orange-600">⚠️ {availability.message}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Load Existing Application Data
      </h2>
      
      <p className="text-gray-600 mb-6">
        Enter your Application ID to automatically load and populate all your saved form data.
        This will restore all sections including Personal Information, Address Details, 
        Occupation, Criminal History, License History, and License Details.
      </p>

      <div className="space-y-4">
        <Input
          label="Application ID"
          name="applicationIdMain"
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
          placeholder="Enter your Application ID (e.g., APP12345)"
          className="w-full"
        />

        <div className="flex gap-3">
          <button
            onClick={handleCheckAvailability}
            disabled={loading || !applicationId.trim()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Check Availability
          </button>
          
          <button
            onClick={handleLoadData}
            disabled={loading || !applicationId.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Loading Data...' : 'Load All Data'}
          </button>
        </div>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-800 font-medium">Loading your data...</span>
            </div>
            <div className="text-sm text-blue-700 mb-2">{progressMessage}</div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">Error Loading Data</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {availability && !loading && (
          <div className={`border rounded-lg p-4 ${
            availability.exists 
              ? 'bg-green-50 border-green-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center mb-2">
              <span className={`text-lg mr-2 ${
                availability.exists ? 'text-green-600' : 'text-orange-600'
              }`}>
                {availability.exists ? '✅' : '⚠️'}
              </span>
              <span className={`font-medium ${
                availability.exists ? 'text-green-800' : 'text-orange-800'
              }`}>
                {availability.message}
              </span>
            </div>
            
            {availability.exists && availability.sections.length > 0 && (
              <div>
                <p className="text-green-700 text-sm mb-2">Available sections:</p>
                <div className="flex flex-wrap gap-2">
                  {availability.sections.map((section: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loadedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Data Loaded Successfully!</span>
            </div>
            
            <p className="text-green-700 text-sm mb-3">
              Your application data has been loaded and is ready to use. You can now navigate to any form section and your saved data will be automatically populated.
            </p>
            
            <div className="text-xs text-green-600">
              Sections loaded: {Object.keys(loadedData).filter(key => loadedData[key] && Object.keys(loadedData[key]).length > 0).length}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Enter your Application ID (provided when you first created your application)</li>
          <li>• Click "Check Availability" to see what data is saved</li>
          <li>• Click "Load All Data" to populate all form sections</li>
          <li>• Navigate to any form section - your data will be automatically filled</li>
          <li>• Data remains loaded until you manually clear it or create a new application</li>
        </ul>
      </div>
    </div>
  );
};

export default ApplicationDataLoader;