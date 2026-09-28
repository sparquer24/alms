'use client';

import React, { useState, useEffect, use, useMemo, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LayoutProvider, useLayout } from '@/config/layoutContext';
import Header from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import Footer from '@/components/Footer';
import LicenseDetailsHeader from '@/components/licenses/LicenseDetailsHeader';
import { PageLayoutSkeleton, ApplicationDetailSkeleton } from '@/components/Skeleton';
import { normalizeRole } from '@/utils/roleUtils';
import LicenseService from '@/services/licenseService';
import { LicenseData } from '@/types';
import { ChevronLeft, FileText, History, Ban, ShieldCheck, UserRound, Calendar, MapPin, Search } from 'lucide-react';
import { apiClient } from '@/config/authenticatedApiClient';
import { ApplicationDetailsView } from '@/components/licenses/ApplicationDetailsView';
import { SectionCard, DetailItem, SummaryCard, DocumentTable, StatusBadge } from '@/app/application/components/RedesignedComponents';
import { getStatusStyle } from '@/utils/statusColors';
import { formatStatusLabel } from '@/utils/formatters';
import EnhancedApplicationTimeline from '@/components/EnhancedApplicationTimeline';
import { LazySection } from '@/components/LazySection';

type Tab = 'details' | 'fresh' | 'renewals' | 'cancellations';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

export default function LicenseDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { userRole } = useAuth();
  const role = useMemo(() => normalizeRole(userRole), [userRole]);
  const isZS = role === 'ZS';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  
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
        // Use the Licenses table PK (licenseId) for the audit call.
        // When a draft renewal is returned, licenseData.id is the renewal ID;
        // licenseData.licenseId is the actual Licenses record ID.
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
          if (license.freshApplicationId) {
            const freshRes: any = await apiClient.get(`/application-form/?applicationId=${license.freshApplicationId}`);
            const data = freshRes.data?.data || freshRes.data || freshRes;
            setFreshApp(Array.isArray(data) ? data[0] : data);
            freshFetched.current = true;
          } else if (license.sourceApplicationId) {
            const renewalRes: any = await apiClient.get(`/renewal-forms/${license.sourceApplicationId}`);
            const data = renewalRes.data?.data || renewalRes.data || renewalRes;
            setFreshApp(Array.isArray(data) ? data[0] : data);
            freshFetched.current = true;
          }
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
          const res: any = await apiClient.get(`/renewal-forms?licenseId=${license.id}`);
          const list = res.data?.data || res.data || [];
          setRenewals(list);
          renewalsFetched.current = true;
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
          const res: any = await apiClient.get(`/cancel-forms?licenseId=${license.id}`);
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

  if (loading) return <PageLayoutSkeleton />;
  if (!license) return <div className="p-8 text-center text-red-500">License not found</div>;

  return (
    <LayoutProvider>
      <LicenseDetailContent
        license={license}
        auditRows={auditRows}
        renewals={renewals}
        cancellations={cancellations}
        freshApp={freshApp}
        activeTab={activeTab}
        isZS={isZS}
        isAdmin={isAdmin}
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
  isAdmin,
  router,
  handleTabChange,
  isFetchingFresh,
  isFetchingRenewals,
  isFetchingCancel
}: any) {
  const { setShowSidebar, headerHeight } = useLayout();
  
  useEffect(() => {
    // This page renders its own <Sidebar /> and <Header /> inline,
    // so we only need to suppress the global sidebar — not the global header.
    setShowSidebar(false);
    return () => {
      setShowSidebar(true);
    };
  }, [setShowSidebar]);

  return (
    <div className='flex h-screen bg-[#F4F6F9] font-sans antialiased overflow-hidden selection:bg-[#0F2D52] selection:text-white'>
      <Sidebar />
      
      <Header
        showBackButton
        backHref="/licenses?tab=all"
        breadcrumbs={[
          { label: 'License Management', href: '/licenses?tab=all' },
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
              tabs={isAdmin ? ['License Details', 'Fresh Application'] : ['License Details', 'Fresh Application', 'Renewals', 'Cancellations']}
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
                <div className='bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6'>
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
                        ['License ID', license.id],
                        ['Name', getFullName(license)],
                        ['Father/Guardian', license.parentOrSpouseName],
                        ['Gender', license.sex],
                        ['Date of Birth', formatDate(license.dateOfBirth)],
                        ['Aadhar', license.aadharNumber],
                        ['PAN', license.panNumber],
                        ['License Number', license.licenseNumber],
                        ['Issue Date', formatDate(license.issueDate || license.validFrom)],
                        ['Expiry Date', formatDate(license.validTill)],
                        ['Purpose', license.needForLicense],
                        ['Created From', getLicenseSource(license).label],
                      ].map(([label, value]) => (
                        <DetailItem
                          key={label as string}
                          label={label as string}
                          value={value || '-'}
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
                        <div className='bg-slate-50/50 rounded-2xl border border-slate-100 p-6 overflow-hidden relative group mt-4'>
                          <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'></div>
                          <div className='relative z-10'>
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
                        ['Weapon Type', license.armsCategory],
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
                            value={value || '-'}
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
                  <div className="space-y-8">
                    {renewals.map((renewal: any) => {
                      const renewalLicenseId = renewal.licenseId ?? renewal.license?.id ?? null;
                      const renewalLicenseNumber = renewal.licenseNumber ?? renewal.license?.licenseNumber ?? null;
                      const isMatched =
                        renewalLicenseId != null
                          ? renewalLicenseId === license.id
                          : renewalLicenseNumber != null
                          ? renewalLicenseNumber === license.licenseNumber
                          : true; // can't determine, assume OK

                      return (
                        <div key={renewal.id} className={`rounded-xl border ${isMatched ? 'border-gray-200' : 'border-amber-300 bg-amber-50/40'}`}>
                          {/* Card header with license info */}
                          <div className={`flex flex-wrap items-center gap-3 px-5 py-3 rounded-t-xl border-b ${isMatched ? 'border-gray-200 bg-slate-50' : 'border-amber-200 bg-amber-50'}`}>
                            <span className="text-sm font-bold text-gray-800">Renewal Application #{renewal.id}</span>
                            <span className="h-4 w-px bg-gray-300" />
                            {renewalLicenseId != null && (
                              <span className="text-xs text-gray-500">
                                License ID: <span className="font-semibold text-gray-700">{renewalLicenseId}</span>
                              </span>
                            )}
                            {renewalLicenseNumber != null && (
                              <span className="text-xs text-gray-500">
                                License No: <span className="font-semibold text-gray-700">{renewalLicenseNumber}</span>
                              </span>
                            )}
                            {!isMatched && (
                              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-semibold">
                                ⚠ License mismatch
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            <ApplicationDetailsView application={renewal} hideLicenseDetails={true} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                      const isMatched = cancel.licenseId === license.id;
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
                              ['Application Type', cancel.applicationType],
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
  );
}
