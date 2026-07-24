'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  StatusBadge,
  DetailItem,
  SectionCard,
  SummaryCard,
  DocumentTable,
} from '@/app/application/components/RedesignedComponents';
import EnhancedApplicationTimeline from '@/components/EnhancedApplicationTimeline';
import {
  UserRound,
  UserCheck,
  CalendarDays,
  Fingerprint,
  BadgeCheck,
  Clock3,
  Shield,
  Target,
  ShieldCheck,
  Crosshair,
  MapPin,
  LocateFixed,
  Package,
  FileText,
  History,
  ClipboardCheck,
  Building2,
  ShieldAlert,
  AlertTriangle,
  Users,
  TriangleAlert,
  FileWarning,
  Ban,
  Scale,
  BriefcaseBusiness,
  Loader2,
  FileQuestion,
  Info,
  Building,
  UserCog,
  CreditCard,
  FileCheck,
  Calendar,
  Landmark,
  MapPinned,
  Eye,
  FolderOpen,
} from 'lucide-react';
import { ApplicationService } from '@/api/applicationService';
import RenewalApplicationDetailsHeader from '@/components/renewal/renewalapplicationdetailsheader';
import { getStatusStyle } from '@/utils/statusColors';
import { RichTextDisplay } from '@/components/RichTextDisplay';
import { apiClient } from '@/config/authenticatedApiClient';
import { LazySection } from '@/components/LazySection';
import { formatGender } from '@/utils/formatters';
import { truncateFilename } from '@/utils/string';

const fmtDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const yn = (value?: boolean) => (value ? 'YES' : 'NO');

const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface CancelRequestDetailProps {
  request: any;
  licenseId?: number | string | null;
  licenseNumber?: string | null;
  activeTab: 'info' | 'original';
  onTabChange: (tab: string) => void;
  loading?: boolean;
  // When true, the Original License Details tab has been opened and the
  // License GET API should be (lazily) fetched once using the cancel response's licenseId.
  loadOriginal?: boolean;
}

export default function CancelRequestDetail({
  request,
  licenseId,
  licenseNumber,
  activeTab,
  onTabChange,
  loading,
  loadOriginal,
}: CancelRequestDetailProps) {
  const [licenseData, setLicenseData] = useState<any>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  // Original License Documents & Workflow History — derived from sourceAppData.
  // The Fresh/Renewal GET APIs already return uploaded documents and workflow history,
  // so no separate /documents or /workflow/history API calls are made.

  // Lazily fetch the License GET API (GET /api/licenses/:licenseId) ONLY when:
  //  - the Original License Details tab is opened (loadOriginal), and
  //  - we have a licenseId from the Cancellation GET API response, and
  //  - it has not already been fetched (prevents duplicate calls on re-renders).
  const licenseFetchedFor = React.useRef<string | null>(null);

  // Source application data: after fetching the license, read `lastModifiedAppType`
  // and fetch either the renewal application (GET /api/renewal-forms/:id) or the
  // fresh application (GET /api/application-form?applicationId=:id) accordingly.
  const [sourceAppData, setSourceAppData] = useState<any>(null);
  const [sourceAppLoading, setSourceAppLoading] = useState(false);
  const sourceAppFetchedRef = useRef<string | null>(null);

  // After license data is loaded, use `lastModifiedAppType` from the license
  // response to fetch the source application:
  //   - lastModifiedAppType === 'RENEWAL' → GET /api/renewal-forms/:renewalApplicationId
  //   - lastModifiedAppType === 'FRESH'   → GET /api/application-form?applicationId=:freshApplicationId
  //
  // The Fresh/Renewal GET API response already includes uploaded documents and
  // workflow history — no separate API calls are made for those.
  useEffect(() => {
    if (activeTab !== 'original' || !licenseData) return;

    const lastModifiedAppType = (licenseData as any).lastModifiedAppType;
    const renewalAppId = (licenseData as any).renewalApplicationId;
    const freshAppId = (licenseData as any).freshApplicationId;

    if (!lastModifiedAppType) return;

    // Determine source app ID and fetch it if not already fetched
    if (lastModifiedAppType === 'RENEWAL' && renewalAppId) {
      const key = `renewal-${renewalAppId}`;
      if (sourceAppFetchedRef.current !== key) {
        sourceAppFetchedRef.current = key;
        setSourceAppData(null); // Clear any stale data
        setSourceAppLoading(true);
        apiClient.get<any>(`/renewal-forms/${renewalAppId}`)
          .then((res: any) => {
            const data = res?.data ?? res;
            if (data) setSourceAppData(data);
          })
          .catch((err: any) => console.error('Failed to fetch renewal application:', err))
          .finally(() => setSourceAppLoading(false));
      }
    } else if (lastModifiedAppType === 'FRESH' && freshAppId) {
      const key = `fresh-${freshAppId}`;
      if (sourceAppFetchedRef.current !== key) {
        sourceAppFetchedRef.current = key;
        setSourceAppData(null); // Clear any stale data
        setSourceAppLoading(true);
        apiClient.get<any>(`/application-form?applicationId=${freshAppId}`)
          .then((res: any) => {
            const data = res?.data ?? res;
            if (data) setSourceAppData(data);
          })
          .catch((err: any) => console.error('Failed to fetch fresh application:', err))
          .finally(() => setSourceAppLoading(false));
      }
    }
  }, [activeTab, licenseData]);
  useEffect(() => {
    if (!loadOriginal) return;
    const identifier = licenseId || licenseNumber;
    if (!identifier) return;
    if (licenseFetchedFor.current === String(identifier)) return;

    let cancelled = false;
    licenseFetchedFor.current = String(identifier);
    const loadLicense = async () => {
      try {
        setLicenseLoading(true);
        setLicenseError(null);
        const res = await ApplicationService.getLicense(String(identifier));
        const data = res?.data ?? res;
        if (!cancelled) setLicenseData(data || null);
      } catch (err: any) {
        if (!cancelled) setLicenseError(err?.message || 'Failed to load license details.');
      } finally {
        if (!cancelled) setLicenseLoading(false);
      }
    };

    loadLicense();
    return () => {
      cancelled = true;
    };
  }, [loadOriginal, licenseId, licenseNumber]);

  if (!request) return null;

  // Applicant name comes from the Licenses object in the Cancellation GET API response.
  const license = request.Licenses || {};
  const applicantName = [license.firstName, license.middleName, license.lastName]
    .filter(Boolean)
    .join(' ') || request.applicantName || 'N/A';

  if (licenseLoading || sourceAppLoading) {
    return (
      <div className='p-6 lg:p-8 bg-slate-50/30 transition-opacity duration-300 animate-pulse rounded-3xl bg-white border border-slate-200'>
        {/* Application Information Section Skeleton */}
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8'>
          <div className='flex items-center justify-between border-b border-slate-100 pb-4 mb-6'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 rounded-lg bg-gray-200'></div>
              <div className='h-6 w-48 bg-gray-200 rounded'></div>
            </div>
            <div className='flex gap-2'>
              <div className='h-10 w-32 bg-gray-200 rounded-xl'></div>
              <div className='h-10 w-32 bg-gray-200 rounded-xl hidden sm:block'></div>
            </div>
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6'>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`space-y-2 ${i === 0 ? 'md:col-span-2' : ''}`}>
                  <div className='h-4 w-24 bg-gray-200 rounded'></div>
                  <div className='h-5 w-48 max-w-full bg-gray-200 rounded'></div>
                </div>
              ))}
            </div>
            <div className='space-y-6'>
              <div className='h-48 w-full bg-gray-200 rounded-2xl'></div>
              <div className='h-64 w-full bg-gray-200 rounded-2xl'></div>
            </div>
          </div>
        </div>
        {/* Three-Column Row Skeleton */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-[400px]'
            >
              <div className='flex items-center gap-3 mb-6'>
                <div className='h-10 w-10 rounded-lg bg-gray-200'></div>
                <div className='h-5 w-32 bg-gray-200 rounded'></div>
              </div>
              <div className='space-y-5'>
                {[...Array(5)].map((_, j) => (
                  <div key={j} className='space-y-2'>
                    <div className='h-3 w-20 bg-gray-200 rounded'></div>
                    <div className='h-4 w-full bg-gray-200 rounded'></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Loading indicator */}
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <div className='w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4'></div>
          <p className='text-sm font-medium text-slate-500'>
            Loading original application details...
          </p>
        </div>
      </div>
    );
  }

  if (licenseError) {
    return (
      <div className='rounded-3xl bg-red-50 border border-red-200 shadow-sm p-8 text-center text-sm font-medium text-red-700'>
        {licenseError}
      </div>
    );
  }

  return (
    <div data-printable='application-card' className='space-y-6 '>
      <RenewalApplicationDetailsHeader
        applicationId={request.id}
        licenseId={request.licenseId}
        licenseNumber={request.Licenses?.licenseNumber || request.licenseNumber}
        acknowledgementNo={request.acknowledgementNo}
        imageSrc='/file.svg'
        activeTab={activeTab === 'original' ? 'Original License Details' : 'Cancellation Info'}
        tabs={["Cancellation Info", "Original License Details"]}
        onTabChange={onTabChange}
        accentColorClass='bg-gradient-to-b from-red-500 to-red-400'
        smallLabel='CANCELLATION REQUEST'
        title='Cancellation Request'
      />

        {/* Cancellation Info tab: only data from the Cancellation GET API response. */}
        {activeTab === 'info' && (
          <>
            {loading && (
              <div className='rounded-3xl  border border-slate-200 flex items-center justify-center gap-3 py-20 text-slate-500'>
                <Loader2 className='w-5 h-5 animate-spin' />
                <span className='text-sm font-medium'>Loading cancellation info…</span>
              </div>
            )}

            {!loading && (
              <>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
                  {/* Left 2 columns: Applicant & Cancellation Details */}
                  <div className='lg:col-span-2 space-y-6'>
                    <div className='rounded-3xl bg-white  border border-slate-200 overflow-hidden'>
                      <div className='flex items-center gap-3 px-6 py-5 border-b border-slate-100'>
                        <div className='p-2.5 rounded-lg border border-blue-100 bg-blue-50 text-blue-600'>
                          <UserRound className='w-5 h-5' />
                        </div>
                        <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
                          Applicant Information
                        </h3>
                      </div>
                      <div className='grid gap-4 p-6 sm:grid-cols-2'>
                        <DetailItem label='Applicant Name' value={applicantName} icon={UserRound} className='sm:col-span-2' />
                        <DetailItem label='License Number' value={license.licenseNumber || request.licenseNumber} icon={ShieldCheck} mono />
                        <DetailItem label='License ID' value={request.licenseId} icon={Fingerprint} mono />
                      </div>
                    </div>

                    {/* Cancellation Details from the Cancellation API */}
                    <div className='rounded-3xl bg-white border border-slate-200 overflow-hidden'>
                      <div className='flex items-center gap-3 px-6 py-5 border-b border-slate-100'>
                        <div className='p-2.5 rounded-lg border border-red-100 bg-red-50 text-red-600'>
                          <FileQuestion className='w-5 h-5' />
                        </div>
                        <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
                          Cancellation Details
                        </h3>
                      </div>
                      <div className='grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3'>
                        <DetailItem label='Cancellation Reason' value={request.cancellationReason} icon={Info} className='sm:col-span-2 lg:col-span-3' />
                        <DetailItem label='Requested By' value={request.requester?.username} icon={UserRound} />
                        <DetailItem label='Requester Role' value={request.requester?.role?.name} icon={BadgeCheck} />
                        <DetailItem label='Requested Date' value={fmtDate(request.requestedDate || request.createdAt)} icon={CalendarDays} />
                        <DetailItem
                          label='Current Workflow Status'
                          value={request.workflowStatus?.name ? <StatusBadge status={request.workflowStatus} /> : (request.workflowStatus || request.status)}
                          icon={Target}
                        />
                      </div>
                      {request.remarks && (
                        <div className='px-6 pb-6'>
                          <div className='pt-4 border-t border-slate-100'>
                            <p className='text-xs font-bold uppercase tracking-wide text-slate-400 mb-2'>Remarks</p>
                            <p className='text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100'>{request.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column: Workflow Timeline */}
                  <div className='rounded-3xl bg-white border border-slate-200 overflow-hidden'>
                    <div className='flex items-center gap-3 px-6 py-5 border-b border-slate-100'>
                      <div className='p-2.5 rounded-lg border border-amber-100 bg-amber-50 text-amber-600'>
                        <History className='w-5 h-5' />
                      </div>
                      <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
                        Workflow Timeline
                      </h3>
                    </div>
                    <div className='p-6'>
                      <EnhancedApplicationTimeline
                        application={request}
                        workflowHistory={request.cancelWorkflowHistories || []}
                      />
                    </div>
                  </div>
                </div>

              </>
            )}
          </>
        )}

        {/* Original License Details tab: data from the License GET API (lazy loaded). */}
        {activeTab === 'original' && (
          <>
            <OriginalLicenseDetails
              sourceAppData={sourceAppData}
              sourceAppType={licenseData?.lastModifiedAppType}
              licenseData={licenseData}
              licenseId={request.licenseId}
              licenseNumber={request.Licenses?.licenseNumber || request.licenseNumber}
            />
          </>
        )}
    </div>
  );
}

/**
 * Original License Details tab content.
 * Mirrors the Renewal Application Details page Original tab layout exactly.
 *
 * Uses the source application data (renewal or fresh application fetched based on
 * lastModifiedAppType from the License GET API response) to display the latest
 * approved application details.
 *
 * The licenseData is still used for license-specific info (number, status).
 */
function OriginalLicenseDetails({
  sourceAppData,
  sourceAppType,
  licenseData,
  licenseId,
  licenseNumber,
}: {
  sourceAppData: any;
  sourceAppType?: string;
  licenseData: any;
  licenseId?: number | string | null;
  licenseNumber?: string | null;
}) {
  const [expandedHistory, setExpandedHistory] = useState<Record<number, boolean>>({});

  // Use source application data (renewal or fresh application) as the primary data source.
  // Fall back to licenseData for backward compatibility.
  const app = sourceAppData || licenseData || {};

  // Documents and workflow history are derived directly from the Fresh/Renewal GET API
  // response — no separate API calls are needed.
  // The Fresh API returns fileUploads[] and workflowHistories[];
  // the Renewal API returns similar document/workflow fields at the top level.
  const originDocuments: any[] = app.fileUploads || app.documents || [];
  const originDocumentsLoading = false;
  const originalLicenseHistory: any[] = app.workflowHistories || app.FreshLicenseApplicationsFormWorkflowHistories || [];
  const originalLicenseHistoryLoading = false;
  const applicantName = [app.firstName, app.middleName, app.lastName]
    .filter(Boolean)
    .join(' ') || 'N/A';

  // Extract nested data from the source application response.
  // Both fresh and renewal application APIs return data in the same nested structure
  // (personal details at top level, addresses, licenseDetails[], licenseHistories[], etc.)
  const licenseDetail = app.licenseDetails?.[0] || {};
  const licenseHistory = app.licenseHistories?.[0] || {};
  const criminalHistory = app.criminalHistories?.[0] || {};

  const weapons = Array.isArray(licenseDetail.requestedWeapons)
    ? licenseDetail.requestedWeapons.map((w: any) => w.name || w).join(', ')
    : '';

  // Application type label
  const appTypeLabel = sourceAppType
    ? String(sourceAppType).charAt(0).toUpperCase() + String(sourceAppType).slice(1).toLowerCase()
    : app?.applicationType
      ? String(app.applicationType).charAt(0).toUpperCase() + String(app.applicationType).slice(1).toLowerCase()
      : 'Original';

  return (
    <div className='space-y-8 bg-slate-50/30 rounded-3xl'>
      {/* ================= 1. Application Information Section ================= */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6'>
        <div className='flex items-center justify-between border-b border-slate-100 pb-4 mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2.5 rounded-lg border border-blue-100 bg-blue-50 text-blue-600'>
              <UserRound className='w-5 h-5' />
            </div>
            <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
              Application Information — {appTypeLabel}
            </h3>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left 2 columns: Personal Details */}
          <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4'>
            <DetailItem
              label='Full Name'
              value={applicantName}
              icon={UserRound}
              className='md:col-span-2'
            />
            {app?.parentOrSpouseName && (
              <DetailItem
                label='Parent / Spouse Name'
                value={app.parentOrSpouseName}
                icon={Users}
              />
            )}
            {app?.sex && (
              <DetailItem label='Gender' value={formatGender(app.sex)} icon={UserCheck} />
            )}
            {app?.placeOfBirth && (
              <DetailItem label='Place of Birth' value={app.placeOfBirth} icon={MapPin} />
            )}
            {(app?.dateOfBirth || app?.dob) && (
              <DetailItem
                label='Date of Birth'
                value={
                  app?.dateOfBirth
                    ? new Date(app.dateOfBirth).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : app?.dob
                      ? new Date(app.dob).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : null
                }
                icon={CalendarDays}
              />
            )}
            {app?.panNumber && (
              <DetailItem label='PAN Number' value={app.panNumber} icon={CreditCard} mono />
            )}
            {app?.aadharNumber && (
              <DetailItem
                label='Aadhar Number'
                value={app.aadharNumber}
                icon={Fingerprint}
                mono
              />
            )}
            {app?.acknowledgementNo && (
              <DetailItem
                label='Acknowledgement Number'
                value={app.acknowledgementNo}
                icon={FileCheck}
                mono
              />
            )}
            {app?.currentUser && (
              <DetailItem
                label='Current User'
                value={app.currentUser.username}
                icon={UserCog}
              />
            )}
            {app?.workflowStatus && (
              <DetailItem
                label='Workflow Status'
                value={<StatusBadge status={app.workflowStatus} />}
                icon={BadgeCheck}
              />
            )}
            <DetailItem
              label='Application Type'
              value={
                <StatusBadge
                  status={app?.applicationType || appTypeLabel}
                  label={appTypeLabel}
                />
              }
              icon={Clock3}
            />
            {app?.applicationDate && (
              <DetailItem
                label='Date & Time of Submission'
                value={new Date(app.applicationDate).toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                icon={CalendarDays}
                className='md:col-span-2'
              />
            )}
          </div>

          {/* Right column: Photo & Quick Summary + Timeline */}
          <div>
            <SummaryCard
              application={
                originDocuments?.length ? { ...app, documents: originDocuments } : app
              }
              applicationId={String(licenseId ?? '')}
              applicantName={applicantName}
            />
            <div className='bg-slate-50/50 rounded-2xl border border-slate-100 p-6 overflow-hidden relative group mt-6'>
              <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'></div>
              <div className='relative z-10'>
                <LazySection minHeight='400px'>
                  <EnhancedApplicationTimeline
                    application={app}
                    workflowHistory={originalLicenseHistory || []}
                  />
                </LazySection>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. Three-Column Row: License Details, License History, Criminal History ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <SectionCard
          title='License Details'
          icon={Shield}
          iconColorClass='text-blue-600 bg-blue-50 border-blue-100'
        >
          <div className='space-y-4 flex-1'>
            <DetailItem
              label='Need for License'
              value={licenseDetail.needForLicense}
              icon={Target}
            />
            <DetailItem
              label='Arms Category'
              value={licenseDetail.armsCategory}
              icon={ShieldCheck}
            />
            <DetailItem label='Requested Weapons' value={weapons} icon={Crosshair} />
            <DetailItem
              label='Area of Validity'
              value={licenseDetail.areaOfValidity}
              icon={MapPin}
            />
            <DetailItem
              label='Licence Place / Area'
              value={licenseDetail.licencePlaceArea}
              icon={LocateFixed}
            />
            <DetailItem
              label='Ammunition Description'
              value={licenseDetail.ammunitionDescription}
              icon={Package}
            />
            {licenseDetail.specialConsiderationReason && (
              <DetailItem
                label='Special Consideration Reason'
                value={licenseDetail.specialConsiderationReason}
                icon={FileText}
              />
            )}
            {licenseDetail.wildBeastsSpecification && (
              <DetailItem
                label='Wild Beasts Specification'
                value={licenseDetail.wildBeastsSpecification}
                icon={FileText}
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title='License History'
          icon={History}
          iconColorClass='text-amber-600 bg-amber-50 border-amber-100'
        >
          <div className='space-y-4 flex-1'>
            <DetailItem
              label='Previously Applied'
              value={yn(licenseHistory.hasAppliedBefore)}
              icon={ClipboardCheck}
            />
            <DetailItem
              label='Previous Result'
              value={licenseHistory.previousResult}
              icon={BadgeCheck}
            />
            <DetailItem
              label='Previous Authority'
              value={licenseHistory.previousAuthorityName}
              icon={Building2}
            />
            <DetailItem
              label='License Suspended'
              value={yn(licenseHistory.hasLicenceSuspended)}
              icon={ShieldAlert}
            />
            <DetailItem
              label='Suspension Reason'
              value={licenseHistory.suspensionReason}
              icon={AlertTriangle}
            />
            <DetailItem
              label='Family License'
              value={yn(licenseHistory.hasFamilyLicence)}
              icon={Users}
            />
            {licenseHistory.familyMemberName && (
              <DetailItem
                label='Family Member Name'
                value={licenseHistory.familyMemberName}
                icon={UserRound}
              />
            )}
            {licenseHistory.familyLicenceNumber && (
              <DetailItem
                label='Family License Number'
                value={licenseHistory.familyLicenceNumber}
                icon={ShieldCheck}
              />
            )}
          </div>
        </SectionCard>

        <SectionCard
          title='Criminal History'
          icon={TriangleAlert}
          iconColorClass='text-red-600 bg-red-50 border-red-100'
        >
          <div className='space-y-4 flex-1'>
            <DetailItem label='Convicted' value={yn(criminalHistory.isConvicted)} icon={Ban} />
            <DetailItem
              label='Bond Executed'
              value={yn(criminalHistory.isBondExecuted)}
              icon={FileWarning}
            />
            <DetailItem
              label='Bond Date'
              value={
                criminalHistory.bondDate
                  ? new Date(criminalHistory.bondDate).toLocaleDateString('en-IN')
                  : null
              }
              icon={Calendar}
            />
            <DetailItem label='Prohibited' value={yn(criminalHistory.isProhibited)} icon={Scale} />
            {Array.isArray(criminalHistory.firDetails) && criminalHistory.firDetails.length > 0 && (
              <div className='mt-4 pt-4 border-t border-slate-100'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5'>
                  <FileText className='w-3.5 h-3.5' />
                  FIR Details
                </h4>
                <div className='space-y-3'>
                  {criminalHistory.firDetails.map((fir: any, firIdx: number) => (
                    <div
                      key={firIdx}
                      className='bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-2'
                    >
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <span className='text-slate-400 font-semibold uppercase block'>
                            FIR Number
                          </span>
                          <span className='font-bold text-slate-700'>{fir.firNumber || '—'}</span>
                        </div>
                        <div>
                          <span className='text-slate-400 font-semibold uppercase block'>
                            District
                          </span>
                          <span className='font-bold text-slate-700'>{fir.District || '—'}</span>
                        </div>
                        <div>
                          <span className='text-slate-400 font-semibold uppercase block'>
                            Police Station
                          </span>
                          <span className='font-bold text-slate-700'>
                            {fir.policeStation || '—'}
                          </span>
                        </div>
                        <div>
                          <span className='text-slate-400 font-semibold uppercase block'>
                            Under Section
                          </span>
                          <span className='font-bold text-slate-700'>
                            {fir.underSection || '—'}
                          </span>
                        </div>
                      </div>
                      {fir.offence && (
                        <div>
                          <span className='text-slate-400 font-semibold uppercase block'>
                            Offence
                          </span>
                          <span className='font-medium text-slate-700'>{fir.offence}</span>
                        </div>
                      )}
                      {fir.DateOfSentence && (
                        <div>
                          <span className='text-slate-400 font-semibold uppercase block'>
                            Sentence Date
                          </span>
                          <span className='font-medium text-slate-700'>{fir.DateOfSentence}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ================= 3. Three-Column Address Row ================= */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {(() => {
          const present = app.presentAddress || {};
          const presentState =
            typeof present.state === 'object' ? present.state?.name : present.state;
          const presentDistrict =
            typeof present.district === 'object' ? present.district?.name : present.district;
          return (
            <SectionCard
              title='Present Address Details'
              icon={MapPin}
              iconColorClass='text-purple-600 bg-purple-50 border-purple-100'
            >
              <div className='space-y-4 flex-1'>
                <DetailItem label='Address' value={present.addressLine} icon={Building} />
                <DetailItem label='State' value={presentState} icon={Landmark} />
                <DetailItem label='District' value={presentDistrict} icon={Building2} />
                <DetailItem label='Zone' value={present.zone?.name} icon={MapPin} />
                <DetailItem label='Division' value={present.division?.name} icon={MapPin} />
                <DetailItem
                  label='Police Station'
                  value={present.policeStation?.name}
                  icon={Building2}
                />
                <DetailItem
                  label='Since Residing'
                  value={fmtDate(present.sinceResiding)}
                  icon={Calendar}
                />
              </div>
            </SectionCard>
          );
        })()}
        {(() => {
          const permanent = app.permanentAddress || {};
          const permanentState =
            typeof permanent.state === 'object' ? permanent.state?.name : permanent.state;
          const permanentDistrict =
            typeof permanent.district === 'object' ? permanent.district?.name : permanent.district;
          return (
            <SectionCard
              title='Permanent Address Details'
              icon={MapPin}
              iconColorClass='text-indigo-600 bg-indigo-50 border-indigo-100'
            >
              <div className='space-y-4 flex-1'>
                <DetailItem label='Address' value={permanent.addressLine} icon={Building} />
                <DetailItem label='State' value={permanentState} icon={Landmark} />
                <DetailItem label='District' value={permanentDistrict} icon={Building2} />
                <DetailItem label='Zone' value={permanent.zone?.name} icon={MapPin} />
                <DetailItem label='Division' value={permanent.division?.name} icon={MapPin} />
                <DetailItem
                  label='Police Station'
                  value={permanent.policeStation?.name}
                  icon={Building2}
                />
                <DetailItem
                  label='Since Residing'
                  value={fmtDate(permanent.sinceResiding)}
                  icon={Calendar}
                />
              </div>
            </SectionCard>
          );
        })()}
        {(() => {
          const occ = app.occupationAndBusiness || {};
          return (
            <SectionCard
              title='Occupation & Business Details'
              icon={BriefcaseBusiness}
              iconColorClass='text-teal-600 bg-teal-50 border-teal-100'
            >
              <div className='space-y-4 flex-1'>
                <DetailItem label='Occupation' value={occ.occupation} icon={BriefcaseBusiness} />
                <DetailItem label='Office Address' value={occ.officeAddress} icon={Building} />
                <DetailItem label='State' value={occ.state?.name} icon={Landmark} />
                <DetailItem label='District' value={occ.district?.name} icon={Building2} />
                <DetailItem label='Crop Location' value={occ.cropLocation} icon={MapPinned} />
                {occ.areaUnderCultivation && (
                  <DetailItem
                    label='Area Under Cultivation'
                    value={`${occ.areaUnderCultivation} Acres`}
                    icon={Building}
                  />
                )}
              </div>
            </SectionCard>
          );
        })()}
      </div>

      {/* ================= 5. Uploaded Documents Section ================= */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
        <h3 className='text-base font-bold text-slate-800 flex items-center gap-2 mb-6'>
          <div className='w-1 h-5 bg-emerald-500 rounded-full'></div>
          Uploaded Documents
        </h3>
        <LazySection minHeight='250px'>
          {originDocumentsLoading ? (
            <div className='flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200'>
              <div className='w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3'></div>
              <p className='text-slate-500 text-sm font-semibold'>Loading origin documents...</p>
            </div>
          ) : (
            <DocumentTable documents={originDocuments || []} />
          )}
        </LazySection>
      </div>

      {/* ================= 6. Application History Section ================= */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
            <div className='w-1 h-5 bg-green-600 rounded-full mr-3'></div>
            Application History
          </h3>
        </div>

        {(() => {
          const historyToShow = originalLicenseHistory || app.workflowHistories || [];
          if (!historyToShow || historyToShow.length === 0) {
            if (originalLicenseHistoryLoading) {
              return (
                <div className='flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200'>
                  <div className='w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3'></div>
                  <p className='text-slate-500 text-sm font-semibold'>Loading license history...</p>
                </div>
              );
            }
            return (
              <div className='flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200'>
                <History className='w-10 h-10 text-slate-300 mb-3' />
                <p className='text-slate-500 text-sm font-semibold'>No history available</p>
              </div>
            );
          }
          return (
            <div className='space-y-5'>
              {historyToShow.map((h: any, idx: number) => {
                const actionTaken = h?.actionTaken || 'Processed';
                const statusStyle = getStatusStyle(actionTaken);
                const borderColor = statusStyle.border;
                const backgroundColor = hexToRgba(borderColor, 0.05);

                const hasRemarks = !!h.remarks;
                const attachmentsArr = Array.isArray(h.attachments)
                  ? h.attachments.filter(Boolean)
                  : [];
                const hasAttachments = attachmentsArr.length > 0;
                const hasDetails = hasRemarks || hasAttachments;
                const isExpanded = expandedHistory[idx] ?? false;

                const historyDate = h.createdAt ? new Date(h.createdAt) : new Date();
                const formattedDate = historyDate.toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const formattedTime = historyDate.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const previousUserName = h.previousUser?.username || 'Initiator';
                const previousRoleName = h.previousRole?.name || 'Role';
                const nextUserName = h.nextUser?.username;
                const nextRoleName = h.nextRole?.name;

                return (
                  <div
                    key={h.id ?? idx}
                    className='border-l-4 pl-4 pr-4 py-3 rounded-r-lg'
                    style={{ borderLeftColor: borderColor, backgroundColor }}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='font-semibold text-gray-900 text-sm'>{previousUserName}</p>
                        <p className='text-xs text-gray-600 mt-0.5'>{previousRoleName}</p>
                        <p className='text-sm text-gray-700 font-medium mt-1'>{actionTaken}</p>
                        {nextUserName &&
                          !(
                            h.previousUserId &&
                            h.nextUserId &&
                            Number(h.previousUserId) === Number(h.nextUserId)
                          ) && (
                            <p className='text-xs text-gray-600 mt-1'>
                              {'→'} Forwarded to:{' '}
                              <span className='font-medium'>{nextUserName}</span> ({nextRoleName})
                            </p>
                          )}
                        <p className='text-xs text-gray-500 mt-1 flex items-center'>
                          <svg
                            className='w-3 h-3 mr-1'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                          </svg>
                          {formattedDate} {formattedTime}
                        </p>
                      </div>
                    </div>

                    {hasDetails && (
                      <button
                        type='button'
                        onClick={() =>
                          setExpandedHistory((prev: Record<number, boolean>) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className='mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1'
                      >
                        {isExpanded ? 'Hide' : 'Show more'}
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                          />
                        </svg>
                      </button>
                    )}

                    {hasRemarks && isExpanded && (
                      <div className='mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm'>
                        <div className='text-base font-semibold text-gray-800 mb-3'>Remarks</div>
                        <RichTextDisplay content={h.remarks} className='text-sm text-gray-700' />
                      </div>
                    )}

                    {hasAttachments && isExpanded && (
                      <div className='mt-3 pt-3 border-t border-gray-200'>
                        <p className='text-xs font-semibold text-gray-600 mb-2'>Attachments</p>
                        <div className='flex flex-wrap gap-2'>
                          {attachmentsArr.map((att: any, attIdx: number) => {
                            const isPdf =
                              att.contentType?.includes('pdf') || att.name?.endsWith('.pdf');
                            const isImage =
                              att.contentType?.includes('image') ||
                              att.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
                            return (
                              <span
                                key={attIdx}
                                className='inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700'
                              >
                                {isPdf ? (
                                  <Eye className='w-3 h-3 text-red-500' />
                                ) : isImage ? (
                                  <Eye className='w-3 h-3 text-green-500' />
                                ) : (
                                  <FolderOpen className='w-3 h-3 text-slate-500' />
                                )}
                                {truncateFilename(att.name || att.fileName || 'File', 10)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
