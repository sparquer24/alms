'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdminActionService, MasterEntity } from '@/services/admin/actions';

interface ApplicationTypeSelectorProps {
  selectedTypeId?: number | null;
  selectedCategoryId?: number | null;
  onTypeChange: (id: number | null, name: string | null) => void;
  onCategoryChange?: (id: number | null) => void;
  showCategory?: boolean;
}

export const ApplicationTypeSelector: React.FC<ApplicationTypeSelectorProps> = ({
  selectedTypeId,
  selectedCategoryId,
  onTypeChange,
  onCategoryChange,
  showCategory = false,
}) => {
  const [appTypes, setAppTypes] = useState<MasterEntity[]>([]);
  const [categories, setCategories] = useState<MasterEntity[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  const selectedType = appTypes.find(t => t.id === selectedTypeId);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    AdminActionService.getApplicationTypes(true).then(setAppTypes).catch(() => {});
    if (showCategory) {
      AdminActionService.getCategories(true).then(setCategories).catch(() => {});
    }
  }, [showCategory]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className='flex items-center gap-4'>
      {/* Application Type Button */}
      <div className='relative' ref={dropdownRef}>
        <button
          type='button'
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className='flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 rounded-lg hover:bg-blue-50 font-medium text-sm transition-colors shadow-sm'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
          {selectedType ? (
            <>
              <span className='w-2 h-2 rounded-full bg-green-500' />
              {selectedType.name}
            </>
          ) : (
            'Select Application Type'
          )}
        </button>

        {dropdownOpen && (
          <div className='absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto'>
            <div className='p-1'>
              {appTypes.map(type => (
                <button
                  key={type.id}
                  type='button'
                  onClick={() => {
                    onTypeChange(type.id, type.name);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                    ${selectedTypeId === type.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  <div className='font-medium'>{type.name}</div>
                  <div className='text-xs text-gray-400'>{type.code}</div>
                </button>
              ))}
              {appTypes.length === 0 && (
                <div className='px-3 py-4 text-sm text-gray-400 text-center'>No types available</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Dropdown (only for Fresh applications) */}
      {showCategory && (
        <div className='relative' ref={catDropdownRef}>
          <button
            type='button'
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className='flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-500 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium text-sm transition-colors shadow-sm'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
            {selectedCategory ? (
              <>
                <span className='w-2 h-2 rounded-full bg-emerald-500' />
                {selectedCategory.name}
              </>
            ) : (
              'Select Category'
            )}
          </button>

          {catDropdownOpen && (
            <div className='absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto'>
              <div className='p-1'>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type='button'
                    onClick={() => {
                      onCategoryChange?.(cat.id);
                      setCatDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                      ${selectedCategoryId === cat.id ? 'bg-emerald-100 text-emerald-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <div className='font-medium'>{cat.name}</div>
                    <div className='text-xs text-gray-400'>{cat.code}</div>
                  </button>
                ))}
                {categories.length === 0 && (
                  <div className='px-3 py-4 text-sm text-gray-400 text-center'>No categories available</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
