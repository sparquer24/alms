'use client';

import React, { useState, useEffect, use, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LayoutProvider, useLayout } from '@/config/layoutContext';
import Header from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import Footer from '@/components/Footer';
import LicenseDetailsHeader from '@/components/licenses/LicenseDetailsHeader';
import PrintLicense from '@/components/licenses/PrintLicense';
import { getLicensesListUrl } from '@/components/licenses/licensesListUrl';
import { PageLayoutSkeleton, ApplicationDetailSkeleton } from '@/components/Skeleton';
import { normalizeRole } from '@/utils/roleUtils';
import LicenseService from '@/services/licenseService';
import { LicenseData } from '@/types';
import { ChevronLeft, ChevronDown, ExternalLink, Printer, FileText, History, Ban, ShieldCheck, UserRound, Calendar, MapPin, Search } from 'lucide-react';
import { apiClient } from '@/config/authenticatedApiClient';
import { ApplicationDetailsView } from '@/components/licenses/ApplicationDetailsView';
import { SectionCard, DetailItem, SummaryCard, DocumentTable, StatusBadge, MaskedAadhaar } from '@/app/application/components/RedesignedComponents';
import { getDocuments } from '@/services/documentService';
import { getStatusStyle } from '@/utils/statusColors';
import { formatGender, formatStatusLabel, humanize } from '@/utils/formatters';
import EnhancedApplicationTimeline from '@/components/EnhancedApplicationTimeline';
import { LazySection } from '@/components/LazySection';

type Tab = 'details' | 'fresh' | 'renewals' | 'cancellations';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Licenses table PK. `licenseId` is always the license's own id in the
// /licenses/:id response; `id` is the fallback for older payload shapes.
const getLicensePk = (license: any): number | undefined => license?.licenseId ?? license?.id;

const getFullName = (license: LicenseData | null | undefined) =>
  [license?.firstName, license?.middleName, license?.lastName].filter(Boolean).join(' ') || '-';

const locationValue = (name?: string | null, id?: number | null, type?: string) => {
  if (name) return name;
  if (id) return `${type} ID: ${id}`;
  return '-';
};

const getLicenseSource = (license: LicenseData): { label: string; badge: string } => {
  const type = (license.lastModifiedAppType || '').toUpperCase();
  switch (type) {
    case 'IMPORT':
      return { label: 'Imported', badge: 'bg-amber-100 text-amber-800' };
    case 'RENEWAL':
      return { label: 'Renewal', badge: 'bg-blue-100 text-blue-700' };
    case 'CANCELLATION':
      return { label: 'Cancellation', badge: 'bg-red-100 text-red-800' };
    default:
      return { label: 'Fresh Application', badge: 'bg-green-100 text-green-800' };
  }
};

const getIconForField = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('name') || l.includes('guardian') || l.includes('gender') || l.includes('user')) {
    return <UserRound className="h-4 w-4 text-blue-500" />;
  }
  if (l.includes('date')) {
    return <Calendar className="h-4 w-4 text-blue-500" />;
  }
  if (l.includes('address') || l.includes('state') || l.includes('district') || l.includes('station') || l.includes('zone') || l.includes('office') || l.includes('division')) {
    return <MapPin className="h-4 w-4 text-blue-500" />;
  }
  return <FileText className="h-4 w-4 text-blue-500" />;
};

/** Validity chip for the header: days left, or when it expired. */
const getValidityChip = (license: LicenseData): { label: string; className: string } | null => {
  if (!license.validTill || license.status === 'CANCELLED') return null;
  const days = Math.ceil((new Date(license.validTill).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days)) return null;
  if (days < 0 || license.status === 'EXPIRED') {
    return {
      label: `Expired on ${formatDate(license.validTill)}`,
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }
  if (days <= 90) {
    return {
      label: `Expires in ${days} day${days === 1 ? '' : 's'} (${formatDate(license.validTill)})`,
      className:
        days <= 30
          ? 'border-orange-200 bg-orange-50 text-orange-700'
          : 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  return {
    label: `Valid till ${formatDate(license.validTill)}`,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
};

/**
 * A renewal still in progress. Once a renewal is approved it becomes the license's
 * last modifying application, and the next renewal can be started.
 */
const getPendingRenewalId = (license: any): number | null => {
  const id = license?.renewalApplicationId;
  if (!id) return null;
  const completed =
    String(license.lastModifiedAppType || '').toUpperCase() === 'RENEWAL' &&
    String(license.lastModifiedAppId ?? license.lastModifiedRenewalId) === String(id);
  return completed ? null : id;
};

export default function LicenseDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { userRole } = useAuth();
  const role = useMemo(() => normalizeRole(userRole), [userRole]);
  const isZS = role === 'ZS';
  
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [freshApp, setFreshApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab-specific loading states
  const [isFetchingFresh, setIsFetchingFresh] = useState(false);
  const [isFetchingRenewals, setIsFetchingRenewals] = useState(false);
  const [isFetchingCancel, setIsFetchingCancel] = useState(false);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const defaultTab = (searchParams?.get('tab') as Tab) || 'details';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  // Refs to track if detailed data has been fetched for a tab
  const freshFetched = useRef(false);
  const renewalsFetched = useRef(false);
  const cancelFetched = useRef(false);

  // Initial load: fetch only this specific license + its audit log
  useEffect(() => {
    const fetchLicenseDetails = async () => {
      try {
        setLoading(true);
        const res: any = await apiClient.get(`/licenses/${resolvedParams.id}`);
        const licenseData = res.data?.data || res.data;
        setLicense(licenseData);
        const auditId = licenseData?.licenseId ?? licenseData?.id;
        if (auditId) {
          try {
            const audit = await LicenseService.getLicenseAudit(auditId);
            setAuditRows(audit);
          } catch (auditErr) {
            console.warn('Audit log not available for this license:', auditErr);
            setAuditRows([]);
          }
        }
      } catch (error: any) {
        const msg = error?.message || '';
        if (msg.toLowerCase().includes('not found')) {
          console.warn('License not found for id:', resolvedParams.id);
        } else {
          console.error('Error fetching license details:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLicenseDetails();
  }, [resolvedParams.id]);

  // On-demand load: Fresh Application
  useEffect(() => {
    if (activeTab === 'fresh' && license && !freshFetched.current) {
      const fetchFresh = async () => {
        setIsFetchingFresh(true);
        try {
          // Only a real fresh application belongs in this tab; imported licenses
          // have none, and renewals are listed in the Renewals tab.
          if (license.freshApplicationId) {
            const freshRes: any = await apiClient.get(`/application-form/?applicationId=${license.freshApplicationId}`);
            const data = freshRes.data?.data || freshRes.data || freshRes;
            setFreshApp(Array.isArray(data) ? data[0] : data);
          }
          freshFetched.current = true;
        } catch (err) {
          console.error('Error fetching fresh app', err);
        } finally {
          setIsFetchingFresh(false);
        }
      };
      fetchFresh();
    }
  }, [activeTab, license]);

  // On-demand load: Renewals
  useEffect(() => {
    if (activeTab === 'renewals' && license && !renewalsFetched.current) {
      const fetchRenewals = async () => {
        setIsFetchingRenewals(true);
        try {
          const res: any = await apiClient.get(`/renewal-forms?licenseId=${getLicensePk(license)}&limit=100`);
          const list = res.data?.data ?? res.data ?? [];
          const rows: any[] = Array.isArray(list) ? list : [];
          // The list endpoint omits file contents, so each renewal's documents (incl. the
          // photograph) come from the Documents API. The rows carry no type of their own.
          const withDocuments = await Promise.all(
            rows.map(async (renewal: any) => {
              const documents = await getDocuments(Number(renewal.id), 'Renewal');
              return {
                ...renewal,
                applicationType: 'Renewal',
                documents,
                // List rows have no fileUrl, so the documents table could not open them.
                fileUploads: documents.length ? documents : renewal.fileUploads,
              };
            })
          );
          setRenewals(withDocuments);
          renewalsFetched.current = true;
        } catch (err) {
          console.error('Error fetching renewals', err);
        } finally {
          setIsFetchingRenewals(false);
        }
      };
      fetchRenewals();
    }
  }, [activeTab, license]);

  // On-demand load: Cancellations
  useEffect(() => {
    if (activeTab === 'cancellations' && license && !cancelFetched.current) {
      const fetchCancellations = async () => {
        setIsFetchingCancel(true);
        try {
          const res: any = await apiClient.get(`/cancel-forms?licenseId=${getLicensePk(license)}&limit=100`);
          // cancel-forms API returns: { success, message, data: [...], pagination: {...} }
          const list = res.data?.data ?? res.data ?? [];
          setCancellations(Array.isArray(list) ? list : []);
          cancelFetched.current = true;
        } catch (err) {
          console.error('Error fetching cancellations', err);
        } finally {
          setIsFetchingCancel(false);
        }
      };
      fetchCancellations();
    }
  }, [activeTab, license]);

  const handleTabChange = (t: string) => {
    let tab: Tab = 'details';
    if (t === 'License Details') tab = 'details';
    else if (t === 'Fresh Application') tab = 'fresh';
    else if (t === 'Renewals') tab = 'renewals';
    else tab = 'cancellations';
    
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  if (loading) return <PageLayoutSkeleton sidebar={false} />;
  if (!license) return <div className="p-8 text-center text-red-500">License not found</div>;

  return (
    <LayoutProvider initialShowSidebar={false}>
      <LicenseDetailContent
        license={license}
        auditRows={auditRows}
        renewals={renewals}
        cancellations={cancellations}
        freshApp={freshApp}
        activeTab={activeTab}
        isZS={isZS}
        router={router}
        handleTabChange={handleTabChange}
        isFetchingFresh={isFetchingFresh}
        isFetchingRenewals={isFetchingRenewals}
        isFetchingCancel={isFetchingCancel}
      />
    </LayoutProvider>
  );
}

function LicenseDetailContent({ 
  license, 
  auditRows, 
  renewals, 
  cancellations,
  freshApp,
  activeTab,
  isZS,
  router,
  handleTabChange,
  isFetchingFresh,
  isFetchingRenewals,
  isFetchingCancel
}: any) {
  const { setShowSidebar, headerHeight } = useLayout();
  // Renewals tab: which renewal rows are expanded (a lone renewal starts open).
  const [renewalToggles, setRenewalToggles] = useState<Record<string, boolean>>({});

  // Return to the list view the user came from (same tab/filters/page), not the
  // unfiltered list. Read after mount — sessionStorage isn't available on the server.
  const [listHref, setListHref] = useState('/licenses?tab=all');
  useEffect(() => {
    setListHref(getLicensesListUrl());
  }, []);

  useEffect(() => {
    // This page renders its own <Sidebar /> and <Header /> inline,
    // so we only need to suppress the global sidebar — not the global header.
    setShowSidebar(false);
    return () => {
      setShowSidebar(true);
    };
  }, [setShowSidebar]);

  return (
    <>
    <div className='flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white'>
      <Sidebar />
      
      <Header
        showBackButton
        backHref={listHref}
        breadcrumbs={[
          { label: 'License Management', href: listHref },
          { label: `License Number: ${license.licenseNumber}` },
        ]}
        applicationTypeLabel='License Details'
        statusBadge={
          license
            ? {
                label: formatStatusLabel(license.status),
                style: (() => {
                  const style = getStatusStyle(license.status);
                  return {
                    backgroundColor: style.bg,
                    color: style.text,
                    borderColor: style.border,
                  };
                })(),
              }
            : undefined
        }
        hideCreateForm={true}
        hidePrint={true}
      />
      
      <main
        className='flex-1 ml-0 h-full overflow-y-auto flex flex-col pt-[72px] md:pt-[86px]'
        style={headerHeight != null ? { paddingTop: headerHeight + 20 } : undefined}
      >
        <div className='flex-grow w-full mx-auto mb-16'>
          
          <div className='mb-6'>
            <LicenseDetailsHeader
              licenseNumber={license.licenseNumber}
              holderName={getFullName(license)}
              badges={(() => {
                const validity = getValidityChip(license);
                return validity ? (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${validity.className}`}
                  >
                    {validity.label}
                  </span>
                ) : null;
              })()}
              tabCounts={{
                Renewals: Array.isArray((license as any).renewalIds)
                  ? (license as any).renewalIds.length
                  : undefined,
                Cancellations: (license as any).cancelApplicationId ? 1 : undefined,
              }}
              actions={
                <>
                  <button
                    type='button'
                    onClick={() => window.print()}
                    className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                  >
                    <Printer className='h-4 w-4' />
                    Print license
                  </button>
                {isZS && license.status !== 'CANCELLED'
                  ? (() => {
                      const licensePk = getLicensePk(license);
                      const pendingRenewalId = getPendingRenewalId(license);
                      const cancelId = (license as any).cancelApplicationId;
                      return (
                        <>
                          <button
                            type='button'
                            onClick={() =>
                              router.push(
                                pendingRenewalId
                                  ? `/renewalApplication/${pendingRenewalId}`
                                  : `/forms/renewal?licenseId=${licensePk}`
                              )
                            }
                            className='inline-flex items-center gap-2 rounded-lg bg-[#071933] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0F2D52]'
                          >
                            <History className='h-4 w-4' />
                            {pendingRenewalId ? 'View renewal' : 'Start renewal'}
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              router.push(
                                cancelId ? `/cancelForm/${cancelId}` : `/cancelForm/new?licenseId=${licensePk}`
                              )
                            }
                            className='inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50'
                          >
                            <Ban className='h-4 w-4' />
                            {cancelId ? 'View cancellation' : 'Cancel license'}
                          </button>
                        </>
                      );
                    })()
                  : null}
                </>
              }
              tabs={['License Details', 'Fresh Application', 'Renewals', 'Cancellations']}
              activeTab={
                activeTab === 'details' ? 'License Details' :
                activeTab === 'fresh' ? 'Fresh Application' :
                activeTab === 'renewals' ? 'Renewals' :
                'Cancellations'
              }
              onTabChange={handleTabChange}
            />
          </div>
          
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden avoid-break'>
            <div className='p-6 lg:p-8 bg-slate-50/30 min-h-[500px]'>
              <div className="space-y-8">
            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* 1. Application Information Section */}
                <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6'>
                  <div className='flex items-center justify-between border-b border-slate-100 pb-4 mb-6'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2.5 rounded-lg border border-blue-100 bg-blue-50 text-blue-600'>
                        <UserRound className='w-5 h-5' />
                      </div>
                      <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
                        License Information
                      </h3>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    {/* Left 2 columns: Applicant Details */}
                    <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {[
                        ['Name', getFullName(license)],
                        ['Father/Guardian', license.parentOrSpouseName],
                        ['Gender', license.sex ? formatGender(license.sex) : null],
                        ['Date of Birth', formatDate(license.dateOfBirth)],
                        ['Aadhaar', license.aadharNumber ? <MaskedAadhaar value={license.aadharNumber} /> : null],
                        ['PAN', license.panNumber],
                        ['License Number', license.licenseNumber],
                        ['Issue Date', formatDate(license.issueDate || license.validFrom)],
                        ['Expiry Date', formatDate(license.validTill)],
                        ['Purpose', license.needForLicense ? humanize(license.needForLicense) : null],
                        ['Created From', getLicenseSource(license).label],
                      ].map(([label, value]) => (
                        <DetailItem
                          key={label as string}
                          label={label as string}
                          value={value}
                          emptyText='Not provided'
                          icon={
                            (label as string).toLowerCase().includes('name') || (label as string).toLowerCase().includes('guardian') || (label as string).toLowerCase().includes('gender') ? UserRound :
                            (label as string).toLowerCase().includes('date') ? Calendar :
                            FileText
                          }
                          className={(label === 'Name' || label === 'Created From') ? 'md:col-span-2' : ''}
                        />
                      ))}
                    </div>

                    {/* Right column: Photo & Timeline */}
                    <div>
                      <SummaryCard
                        application={license}
                        applicationId={license.licenseNumber}
                        applicantName={getFullName(license)}
                      />
                      {auditRows && auditRows.length > 0 && (
                        <div className='bg-slate-50/50 rounded-2xl border border-slate-100 p-6 overflow-hidden mt-4'>
                          <div>
                            <LazySection minHeight='400px'>
                              <EnhancedApplicationTimeline
                                application={license}
                                workflowHistory={auditRows.map((row: any) => ({
                                  ...row,
                                  actionTaken: row.action || row.event || row.newStatus || '',
                                  previousUser: { username: row.performedBy || row.officer || row.changedByUser?.username || row.changedBy || 'System' },
                                  remarks: row.remarks,
                                  createdAt: row.createdAt
                                }))}
                              />
                            </LazySection>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Addresses and Weapon Details */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                  {[
                    [
                      'Present Address',
                      [
                        ['Address', license.presentAddressLine],
                        ['State', locationValue(license.presentStateName, license.presentStateId, 'State')],
                        ['District', locationValue(license.presentDistrictName, license.presentDistrictId, 'District')],
                        ['Police Station', locationValue(license.presentPoliceStationName, license.presentPoliceStationId, 'Police Station')],
                        ['Range Office', locationValue(license.presentRangeOfficeName, license.presentRangeOfficeId, 'Range Office')],
                        ['Zone', locationValue(license.presentZoneName, license.presentZoneId, 'Zone')],
                        ['Division', locationValue(license.presentDivisionName, license.presentDivisionId, 'Division')],
                      ],
                    ],
                    [
                      'Permanent Address',
                      [
                        ['Address', license.permanentAddressLine],
                        ['State', locationValue(license.permanentStateName, license.permanentStateId, 'State')],
                        ['District', locationValue(license.permanentDistrictName, license.permanentDistrictId, 'District')],
                        ['Police Station', locationValue(license.permanentPoliceStationName, license.permanentPoliceStationId, 'Police Station')],
                        ['Range Office', locationValue(license.permanentRangeOfficeName, license.permanentRangeOfficeId, 'Range Office')],
                        ['Zone', locationValue(license.permanentZoneName, license.permanentZoneId, 'Zone')],
                        ['Division', locationValue(license.permanentDivisionName, license.permanentDivisionId, 'Division')],
                      ],
                    ],
                    [
                      'Weapon Details',
                      [
                        ['Weapon Type', license.armsCategory ? humanize(license.armsCategory) : null],
                        [
                          'Weapon Details',
                          license.endorsedWeapons?.map((w: any) => w.name).join(', '),
                        ],
                        ['Ammunition', license.ammunitionDescription],
                      ],
                    ],
                  ].map(([title, fields]) => (
                    <SectionCard
                      key={String(title)}
                      title={String(title)}
                      icon={(title as string).includes('Address') ? MapPin : ShieldCheck}
                      iconColorClass="text-blue-600 bg-blue-50 border-blue-100"
                    >
                      <div className='space-y-4 flex-1'>
                        {(fields as any[]).map(([label, value]) => (
                          <DetailItem
                            key={label}
                            label={label as string}
                            value={value}
                          emptyText='Not provided'
                            icon={
                              (label as string).toLowerCase().includes('address') || (label as string).toLowerCase().includes('state') || (label as string).toLowerCase().includes('district') || (label as string).toLowerCase().includes('station') || (label as string).toLowerCase().includes('zone') || (label as string).toLowerCase().includes('division') ? MapPin :
                              FileText
                            }
                          />
                        ))}
                      </div>
                    </SectionCard>
                  ))}
                </div>
                
                {/* 3. Documents — always from the most recently approved application */}
                {(() => {
                  const docs = license.documents ?? license.fileUploads ?? [];
                  return docs.length > 0 ? (
                    <SectionCard
                      title="Uploaded Documents"
                      icon={FileText}
                      iconColorClass="text-indigo-600 bg-indigo-50 border-indigo-100"
                    >
                      <div className="w-full">
                        <DocumentTable documents={docs} />
                      </div>
                    </SectionCard>
                  ) : null;
                })()}
              </div>
            )}

            {/* FRESH APP TAB */}
            {activeTab === 'fresh' && (
              <div className="space-y-6">
                {isFetchingFresh ? (
                  <ApplicationDetailSkeleton />
                ) : freshApp ? (
                  <ApplicationDetailsView application={freshApp} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No associated Fresh Application found.</p>
                    <p className="text-sm mt-1">This license may have been imported directly.</p>
                  </div>
                )}
              </div>
            )}

            {/* RENEWALS TAB */}
            {activeTab === 'renewals' && (
              <div className="space-y-6">
                {isFetchingRenewals ? (
                  <ApplicationDetailSkeleton />
                ) : renewals.length > 0 ? (
                  <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {renewals.map((renewal: any) => {
                      const renewalLicenseId = renewal.licenseId ?? renewal.license?.id ?? null;
                      const renewalLicenseNumber = renewal.licenseNumber ?? renewal.license?.licenseNumber ?? null;
                      const isMatched =
                        renewalLicenseId != null
                          ? renewalLicenseId === getLicensePk(license)
                          : renewalLicenseNumber != null
                          ? renewalLicenseNumber === license.licenseNumber
                          : true; // can't determine, assume OK
                      const key = String(renewal.id);
                      const isOpen = renewalToggles[key] ?? renewals.length === 1;
                      const submittedOn = renewal.applicationDate || renewal.createdAt;
                      const statusCode = String(renewal.workflowStatus?.code || '').toUpperCase();
                      const isDecided = ['APPROVED', 'REJECTED', 'CLOSE', 'CANCELLED', 'DISPOSED'].includes(statusCode);

                      return (
                        <li key={key} className={isMatched ? '' : 'bg-amber-50/40'}>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {renewal.acknowledgementNo ? `Ack No: ${renewal.acknowledgementNo}` : `Renewal #${renewal.id}`}
                              </p>
                              <p className="text-xs text-slate-500">
                                {[
                                  submittedOn && `Submitted ${formatDate(submittedOn)}`,
                                  !isDecided && renewal.currentUser?.username && `With ${renewal.currentUser.username}`,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            </div>
                            {renewal.workflowStatus && <StatusBadge status={renewal.workflowStatus} />}
                            {!isMatched && (
                              <span
                                className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                                title={`Linked to license ${renewalLicenseNumber ?? renewalLicenseId}`}
                              >
                                License mismatch
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => router.push(`/renewalApplication/${renewal.id}`)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenewalToggles(prev => ({ ...prev, [key]: !isOpen }))}
                                aria-expanded={isOpen}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Details
                                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          {isOpen && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                              <ApplicationDetailsView application={renewal} hideLicenseDetails={true} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed text-slate-500">
                    <History className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-700">No Renewal Applications</p>
                    <p className="text-sm mt-1">There are no renewal applications associated with this license yet.</p>
                  </div>
                )}
              </div>
            )}


            {/* CANCELLATIONS TAB */}
            {activeTab === 'cancellations' && (
              <div className="space-y-6">
                {isFetchingCancel ? (
                  <ApplicationDetailSkeleton />
                ) : cancellations.length > 0 ? (
                  <div className="space-y-6">
                    {cancellations.map((cancel: any) => {
                      const isMatched = cancel.licenseId === getLicensePk(license);
                      return (
                        <div key={cancel.id} className={`rounded-xl border ${isMatched ? 'border-gray-200' : 'border-amber-300 bg-amber-50/40'}`}>
                          {/* Header */}
                          <div className={`flex flex-wrap items-center gap-3 px-5 py-3 rounded-t-xl border-b ${isMatched ? 'border-gray-200 bg-slate-50' : 'border-amber-200 bg-amber-50'}`}>
                            <Ban className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-bold text-gray-800">Cancellation Application #{cancel.id}</span>
                            <span className="h-4 w-px bg-gray-300" />
                            {cancel.licenseId != null && (
                              <span className="text-xs text-gray-500">License ID: <span className="font-semibold text-gray-700">{cancel.licenseId}</span></span>
                            )}
                            {cancel.acknowledgementNo && (
                              <span className="text-xs text-gray-500">Ack No: <span className="font-semibold text-gray-700">{cancel.acknowledgementNo}</span></span>
                            )}
                            {cancel.workflowStatus?.name && (
                              <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                                {cancel.workflowStatus.name}
                              </span>
                            )}
                            {!isMatched && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-semibold">
                                ⚠ License mismatch
                              </span>
                            )}
                          </div>
                          {/* Body */}
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                              ['Application Type', cancel.applicationType ? humanize(cancel.applicationType) : null],
                              ['Cancellation Reason', cancel.cancellationReason],
                              ['Remarks', cancel.remarks],
                              ['Requested By', cancel.requester?.username || cancel.requestedBy],
                              ['Requested Date', formatDate(cancel.requestedDate || cancel.createdAt)],
                              ['Actioner', cancel.actioner?.username || '-'],
                              ['Actioned Date', formatDate(cancel.actionedDate)],
                            ].map(([label, value]) => value ? (
                              <DetailItem key={label as string} label={label as string} value={value as string} icon={FileText} />
                            ) : null)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed text-slate-500">
                    <Ban className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-700">No Cancellation Applications</p>
                    <p className="text-sm mt-1">There are no cancellation applications associated with this license.</p>
                  </div>
                )}
              </div>
            )}
            
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>

    {/* Print-only copy of the license; the app shell is hidden while printing */}
    <div className='hidden print:block'>
      <PrintLicense license={license} />
    </div>
    </>
  );
}
