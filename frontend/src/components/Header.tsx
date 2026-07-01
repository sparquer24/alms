'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '../config/layoutContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '../config/notificationContext';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';
import { APPLICATION_TYPES } from '../config/helpers';
import { ApplicationService } from '../api/applicationService';
import { RenewalService } from '../api/renewalService';
import { CancelService } from '../api/cancelService';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface HeaderProps {
  onCreateApplication?: (typeKey: string) => void;
  onShowMessage?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  /** Optional breadcrumb trail shown on the left side of the header */
  breadcrumbs?: BreadcrumbItem[];
  /** Optional title shown alongside breadcrumbs (e.g., "Application Details") */
  pageTitle?: string;
  /** Optional status badge shown in the header (for detail views) */
  statusBadge?: {
    label: string;
    className?: string;
    style?: React.CSSProperties;
  };
  /** Hide the print button */
  hidePrint?: boolean;
  /** Hide the Create Form button even if sidebar is visible */
  hideCreateForm?: boolean;
  /** Optional application type label to display in the header */
  applicationTypeLabel?: string;
}

const Header = (props: HeaderProps) => {
  const {
    onShowMessage,
    breadcrumbs,
    pageTitle: _pageTitle,
    statusBadge,
    hidePrint,
    hideCreateForm,
    applicationTypeLabel,
  } = props;
  const { showHeader, showSidebar } = useLayout();
  const { userName, isLoading, user, userRole: hookUserRole } = useAuth();
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [renewalApplicationId, setRenewalApplicationId] = useState('');
  const [cancelApplicationId, setCancelApplicationId] = useState('');
  const [renewalLookupError, setRenewalLookupError] = useState<string | null>(null);
  const [cancelLookupError, setCancelLookupError] = useState<string | null>(null);
  const [isRenewalLookupLoading, setIsRenewalLookupLoading] = useState(false);
  const [isCancelLookupLoading, setIsCancelLookupLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const name = userName || user?.name || user?.username;
    if (!isLoading && name) setDisplayName(name);
  }, [userName, user, isLoading, hookUserRole]);

  const hasValidUserName = !isLoading && typeof displayName === 'string' && displayName.length > 0;
  const handleDropdownClick = (type: (typeof APPLICATION_TYPES)[number]) => {
    setShowDropdown(false);
    if (type.enabled) {
      if (type.key === 'fresh') {
        router.push('/forms/createFreshApplication/personal-information');
      } else if (type.key === 'renewal') {
        setRenewalApplicationId('');
        setRenewalLookupError(null);
        setShowRenewalModal(true);
      } else if (type.key === 'cancel') {
        setCancelApplicationId('');
        setCancelLookupError(null);
        setShowCancelModal(true);
      } else {
        router.push(`/inbox?type=all?type=${encodeURIComponent(type.key)}`);
      }
    } else if (onShowMessage) {
      onShowMessage('This feature will come soon', 'info');
    }
  };

  const getLicenseNumber = (data: any): string => {
    if (!data) return '';
    return (
      data.licenseNumber ||
      data.almsLicenseId ||
      data.licenseId ||
      data.previousLicenseNumber ||
      data.licenseHistories?.[0]?.previousLicenseNumber ||
      data.licenseHistory?.[0]?.previousLicenseNumber ||
      data.previousApplicationDetails?.previousLicenseNumber ||
      ''
    );
  };

  const handleRenewalSubmit = async () => {
    const id = renewalApplicationId.trim();

    if (!id) {
      setRenewalLookupError('Enter a Fresh Application ID or Acknowledgement Number.');
      return;
    }

    try {
      setIsRenewalLookupLoading(true);
      setRenewalLookupError(null);

      const response = await ApplicationService.getApplication(id);
      const freshApplication = response?.data ?? response;

      if (!freshApplication) {
        throw new Error('No fresh application data returned for that ID.');
      }

      const workflowStatusCode = freshApplication?.workflowStatus?.code?.toString().toUpperCase();
      const hasApprovedHistory =
        Array.isArray(freshApplication?.workflowHistories) &&
        freshApplication.workflowHistories.some(
          (history: any) => history?.actionTaken?.toString().toUpperCase() === 'APPROVED'
        );

      if (workflowStatusCode !== 'APPROVED' && !hasApprovedHistory) {
        throw new Error('Only approved fresh applications can create a renewal form.');
      }

      const licenseNumber = getLicenseNumber(freshApplication);
      if (licenseNumber) {
        const existingRenewal = await RenewalService.findRenewalByLicenseNumber(licenseNumber);
        if (existingRenewal) {
          const existingRenewalId = existingRenewal.id || existingRenewal.renewalApplicationId;
          if (existingRenewalId) {
            // Display the existing Renewal ID
            setRenewalLookupError(
              `Renewal already exists (Renewal ID: ${existingRenewalId}). Redirecting...`
            );
            setTimeout(() => {
              setShowRenewalModal(false);
              router.push(
                `/forms/renewal?applicationId=${encodeURIComponent(id)}&renewalId=${encodeURIComponent(String(existingRenewalId))}`
              );
            }, 1500);
            return;
          }
        }
      }

      // Create new Renewal Application using Renewal creation API
      const getSexValue = (val: any): 'MALE' | 'FEMALE' | 'OTHER' => {
        const s = String(val || '').toUpperCase();
        if (s === 'FEMALE') return 'FEMALE';
        if (s === 'OTHER') return 'OTHER';
        return 'MALE';
      };

      const formatDate = (val: any): string => {
        if (!val) return '';
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
        } catch {}
        return '';
      };

      const payload = {
        freshLicenseId: freshApplication.id ? Number(freshApplication.id) : undefined,
        licenseNumber,
        firstName:
          freshApplication.firstName ||
          freshApplication.personalDetails?.firstName ||
          freshApplication.applicantName ||
          'N/A',
        middleName:
          freshApplication.middleName || freshApplication.personalDetails?.middleName || '',
        lastName: freshApplication.lastName || freshApplication.personalDetails?.lastName || '',
        parentOrSpouseName:
          freshApplication.parentOrSpouseName ||
          freshApplication.personalDetails?.parentOrSpouseName ||
          freshApplication.fatherName ||
          'N/A',
        sex: getSexValue(
          freshApplication.sex || freshApplication.personalDetails?.sex || freshApplication.gender
        ),
        dateOfBirth: formatDate(
          freshApplication.dateOfBirth || freshApplication.personalDetails?.dateOfBirth
        ),
        dobInWords:
          freshApplication.dobInWords || freshApplication.personalDetails?.dobInWords || '',
        panNumber: freshApplication.panNumber || '',
        aadharNumber: freshApplication.aadharNumber || freshApplication.aadhaarNumber || '',
        filledBy: freshApplication.filledBy || '',
      };

      const createResponse = await RenewalService.createRenewalForm(payload);
      const created = createResponse?.data ?? createResponse;
      const newRenewalId = created?.id || created?.renewalApplicationId;

      if (!newRenewalId) {
        throw new Error('Renewal application was created but no renewal ID was returned.');
      }

      setShowRenewalModal(false);
      router.push(
        `/forms/renewal?applicationId=${encodeURIComponent(id)}&renewalId=${encodeURIComponent(String(newRenewalId))}`
      );
    } catch (error: any) {
      const message = error?.message || 'Unable to fetch fresh application data.';
      setRenewalLookupError(message);
      onShowMessage?.(message, 'error');
    } finally {
      setIsRenewalLookupLoading(false);
    }
  };

  const handleCancelSubmit = async () => {
    const id = cancelApplicationId.trim();

    if (!id) {
      setCancelLookupError('Enter a Fresh Application ID or Acknowledgement Number.');
      return;
    }

    try {
      setIsCancelLookupLoading(true);
      setCancelLookupError(null);

      const response = await ApplicationService.getApplication(id);
      const freshApplication = response?.data ?? response;

      if (!freshApplication) {
        throw new Error('No fresh application data returned for that ID.');
      }

      const workflowStatusCode = freshApplication?.workflowStatus?.code?.toString().toUpperCase();
      const hasApprovedHistory =
        Array.isArray(freshApplication?.workflowHistories) &&
        freshApplication.workflowHistories.some(
          (history: any) => history?.actionTaken?.toString().toUpperCase() === 'APPROVED'
        );

      if (workflowStatusCode !== 'APPROVED' && !hasApprovedHistory) {
        throw new Error('Only approved fresh applications can create a cancellation form.');
      }

      // Check if a cancellation request already exists for this application
      try {
        const existingCancelResponse = await CancelService.getCancelRequests({ applicationId: Number(freshApplication.id) });
        const existingCancel = existingCancelResponse?.data || existingCancelResponse;
        if (Array.isArray(existingCancel) && existingCancel.length > 0) {
          throw new Error('A cancellation request already exists for this application.');
        }
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          // If it's a general network error/not found, ignore it and let user proceed, but if it has matching message, throw.
        } else {
          throw err;
        }
      }

      setShowCancelModal(false);
      router.push(
        `/cancelForm/new?applicationId=${encodeURIComponent(String(freshApplication.id))}`
      );
    } catch (error: any) {
      const message = error?.message || 'Unable to fetch fresh application data.';
      setCancelLookupError(message);
      onShowMessage?.(message, 'error');
    } finally {
      setIsCancelLookupLoading(false);
    }
  };

  if (!showHeader) return null;

  const isZSUser = hookUserRole?.toUpperCase() === 'ZS';

  // Adjust header position based on sidebar visibility
  const headerLeftClass = showSidebar ? 'left-[80px] md:left-[18%]' : 'left-0';

  // Determine if header needs extra height for breadcrumbs
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <header
      className={`fixed top-0 right-0 ${headerLeftClass} min-w-[200px] bg-[#001F54] ${hasBreadcrumbs ? 'h-auto min-h-[64px] md:min-h-[70px] py-3' : 'h-[64px] md:h-[70px]'} px-4 md:px-6 flex items-center justify-between shadow-lg z-40 transition-all duration-300`}
    >
      <div className='max-w-8xl w-full mx-auto flex items-center justify-between'>
        {/* Left section: breadcrumbs / create form */}
        <div className='flex items-center gap-4 min-w-0'>
          {/* Show Create Form only when sidebar is visible and not hidden */}
          {showSidebar && !hideCreateForm && (
            <div className='relative flex-shrink-0'>
              {isZSUser && (
                <>
                  <button
                    className='px-4 py-2 bg-white text-[#001F54] rounded-md hover:bg-gray-100 flex items-center justify-center h-10 min-w-[120px] z-50 font-medium text-sm whitespace-nowrap shadow-sm'
                    onClick={() => setShowDropdown(v => !v)}
                  >
                    <span className='mr-2'>Create Form</span>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </button>
                  {showDropdown && (
                    <div className='absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50'>
                      {APPLICATION_TYPES.map(type => (
                        <button
                          key={type.key}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${type.enabled ? '' : 'text-gray-400 cursor-not-allowed'}`}
                          onClick={() => handleDropdownClick(type)}
                          disabled={!type.enabled}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Breadcrumbs */}
          {hasBreadcrumbs && (
            <nav className='min-w-0 flex-1' aria-label='Breadcrumb'>
              <ol className='flex items-center space-x-2 text-sm truncate'>
                {breadcrumbs.map((crumb, idx) => (
                  <li key={idx} className='flex items-center space-x-2 min-w-0'>
                    {idx > 0 && <span className='text-white text-opacity-50 flex-shrink-0'>/</span>}
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className='text-white text-opacity-70 hover:text-opacity-100 transition-colors truncate'
                      >
                        {crumb.label}
                      </button>
                    ) : crumb.href ? (
                      <Link
                        href={crumb.href}
                        className='text-white text-opacity-70 hover:text-opacity-100 transition-colors truncate'
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className='text-white font-medium truncate'>{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>

        {/* Right section: status badge + actions */}
        <div className='flex items-center space-x-3  justify-end flex-shrink-0'>
          {/* Application Type badge */}
          {applicationTypeLabel && (
            <div className='flex items-center space-x-2 bg-white bg-opacity-10 rounded-lg px-4 py-2'>
              <div className='w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0'>
                {applicationTypeLabel.toLowerCase().includes('renewal') ? (
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                ) : (
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                )}
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border whitespace-nowrap ${
                    applicationTypeLabel.toLowerCase().includes('renewal')
                      ? 'bg-[#D97706] text-white border-[#B45309]'
                      : 'bg-[#059669] text-white border-[#047857]'
                  }`}
                >
                  {applicationTypeLabel}
                </span>
              </div>
            </div>
          )}
          {/* Status badge */}
          {statusBadge && (
            <div className='flex items-center space-x-2 bg-white bg-opacity-10 rounded-lg px-4 py-2'>
              <div className='w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-5 h-5 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${statusBadge.className || 'bg-white bg-opacity-20 text-white border-white border-opacity-30'}`}
                  style={statusBadge.style}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>
          )}
          <div className='relative'>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className='p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-full'
              aria-label='Toggle notifications'
              aria-expanded={showNotifications}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                />
              </svg>
              {unreadCount > 0 && (
                <span className='absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full'>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>
          {/* Print button - hidden when hidePrint is true */}
          {!hidePrint && (
            <button
              onClick={() => globalThis.print()}
              className='p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-md'
              aria-label='Print page'
              title='Print'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 9V2h12v7m-6 4v6m-6 0h12'
                />
              </svg>
            </button>
          )}
          {hasValidUserName && (
            <Link
              href='/settings'
              className='flex items-center hover:bg-white hover:bg-opacity-10 rounded-full p-1 transition-colors'
            >
              <div className='bg-white text-[#001F54] rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm'>
                {displayName.charAt(0).toUpperCase()}
              </div>
            </Link>
          )}
        </div>
      </div>

      {showRenewalModal && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
            <h2 className='text-lg font-semibold text-gray-900'>Renewal Application</h2>
            <p className='mt-2 text-sm text-gray-600'>
              Enter the approved Fresh Application ID or Acknowledgement Number to load the existing
              application data.
            </p>

            <div className='mt-4'>
              <label
                htmlFor='renewal-application-id'
                className='block text-sm font-medium text-gray-700'
              >
                Fresh Application ID / Acknowledgement Number
              </label>
              <input
                id='renewal-application-id'
                value={renewalApplicationId}
                onChange={e => {
                  setRenewalApplicationId(e.target.value);
                  if (renewalLookupError) setRenewalLookupError(null);
                }}
                placeholder='Enter ID or Acknowledgement Number (e.g., ALMS...)'
                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#001F54] focus:ring-2 focus:ring-[#001F54]/20'
                autoFocus
              />
              {renewalLookupError && (
                <p className='mt-2 text-sm text-red-600'>{renewalLookupError}</p>
              )}
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setShowRenewalModal(false)}
                className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleRenewalSubmit}
                disabled={isRenewalLookupLoading}
                className='rounded-md bg-[#001F54] px-4 py-2 text-sm font-medium text-white hover:bg-[#012a73] disabled:cursor-not-allowed disabled:opacity-70'
              >
                {isRenewalLookupLoading ? 'Loading…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
            <h2 className='text-lg font-semibold text-gray-900'>Cancel Application</h2>
            <p className='mt-2 text-sm text-gray-600'>
              Enter the approved Fresh Application ID or Acknowledgement Number to initiate the cancellation request.
            </p>

            <div className='mt-4'>
              <label
                htmlFor='cancel-application-id'
                className='block text-sm font-medium text-gray-700'
              >
                Fresh Application ID / Acknowledgement Number
              </label>
              <input
                id='cancel-application-id'
                value={cancelApplicationId}
                onChange={e => {
                  setCancelApplicationId(e.target.value);
                  if (cancelLookupError) setCancelLookupError(null);
                }}
                placeholder='Enter ID or Acknowledgement Number (e.g., ALMS...)'
                className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#001F54] focus:ring-2 focus:ring-[#001F54]/20'
                autoFocus
              />
              {cancelLookupError && (
                <p className='mt-2 text-sm text-red-600'>{cancelLookupError}</p>
              )}
            </div>

            <div className='mt-6 flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setShowCancelModal(false)}
                className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleCancelSubmit}
                disabled={isCancelLookupLoading}
                className='rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {isCancelLookupLoading ? 'Loading…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
