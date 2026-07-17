'use client';

import React, { useState, useEffect } from 'react';
import {
  StatusBadge,
  DetailItem,
  SectionCard,
} from '@/app/application/components/RedesignedComponents';
import EnhancedApplicationTimeline from '@/components/EnhancedApplicationTimeline';
import {
  UserRound,
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
  Building
} from 'lucide-react';
import { ApplicationService } from '@/api/applicationService';
import RenewalApplicationDetailsHeader from '@/components/renewal/renewalapplicationdetailsheader';
import { getStatusStyle } from '@/utils/statusColors';
import { RichTextDisplay } from '@/components/RichTextDisplay';

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

  // Lazily fetch the License GET API (GET /api/licenses/:licenseId) ONLY when:
  //  - the Original License Details tab is opened (loadOriginal), and
  //  - we have a licenseId from the Cancellation GET API response, and
  //  - it has not already been fetched (prevents duplicate calls on re-renders).
  // No Fresh Application API is used here.
  const licenseFetchedFor = React.useRef<string | null>(null);
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

  if (licenseLoading) {
    return (
      <div className='rounded-3xl bg-white shadow-xl border border-slate-200 flex items-center justify-center gap-3 py-20 text-slate-500'>
        <Loader2 className='w-5 h-5 animate-spin' />
        <span className='text-sm font-medium'>Loading license details…</span>
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
    <div data-printable='application-card' className='space-y-6'>
      <RenewalApplicationDetailsHeader
        applicationId={request.id}
        licenseId={request.licenseId}
        acknowledgementNo={request.acknowledgementNo}
        imageSrc='/file.svg'
        activeTab={activeTab === 'original' ? 'License Details' : 'Cancellation Info'}
        tabs={["Cancellation Info", "License Details"]}
        onTabChange={onTabChange}
        accentColorClass='bg-gradient-to-b from-red-500 to-red-400'
        smallLabel='CANCELLATION REQUEST'
        title='Cancellation Request'
      />

        {/* Cancellation Info tab: only data from the Cancellation GET API response. */}
        {activeTab === 'info' && (
          <>
            {loading && (
              <div className='rounded-3xl bg-white shadow-xl border border-slate-200 flex items-center justify-center gap-3 py-20 text-slate-500'>
                <Loader2 className='w-5 h-5 animate-spin' />
                <span className='text-sm font-medium'>Loading cancellation info…</span>
              </div>
            )}

            {!loading && (
              <>
                {/* Key identifiers from the Cancellation API */}
                <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
                  <div className='grid gap-6 p-6 md:grid-cols-3'>
                    <DetailItem label='Acknowledgement Number' value={request.acknowledgementNo} icon={FileText} mono />
                    <DetailItem label='License ID' value={request.licenseId} icon={Fingerprint} mono />
                    <DetailItem label='License Number' value={license.licenseNumber || request.licenseNumber} icon={ShieldCheck} mono />
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
                  {/* Left 2 columns: Applicant & Cancellation Details */}
                  <div className='lg:col-span-2 space-y-6'>
                    <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
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
                    <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
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
                  <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
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

                {/* Workflow History */}
                {request.cancelWorkflowHistories && request.cancelWorkflowHistories.length > 0 && (
                  <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
                    <div className='flex items-center gap-3 px-6 py-5 border-b border-slate-100'>
                      <div className='p-2.5 rounded-lg border border-amber-100 bg-amber-50 text-amber-600'>
                        <History className='w-5 h-5' />
                      </div>
                      <h3 className='font-bold text-slate-800 text-lg tracking-tight'>
                        Workflow History
                      </h3>
                    </div>
                    <div className='p-6 space-y-5'>
                      {request.cancelWorkflowHistories.map((h: any, idx: number) => {
                        const actionTaken = h?.actionTaken || 'Processed';
                        const statusStyle = getStatusStyle(actionTaken);
                        const borderColor = statusStyle.border;
                        const backgroundColor = hexToRgba(borderColor, 0.05);
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
                                {nextUserName && (
                                  <p className='text-xs text-gray-600 mt-1'>
                                    → Forwarded to: <span className='font-medium'>{nextUserName}</span> ({nextRoleName})
                                  </p>
                                )}
                                <p className='text-xs text-gray-500 mt-1 flex items-center'>
                                  <Clock3 className='w-3 h-3 mr-1' />
                                  {formattedDate} {formattedTime}
                                </p>
                              </div>
                            </div>
                            {h.remarks && (
                              <div className='mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm'>
                                <div className='text-base font-semibold text-gray-800 mb-3'>Remarks</div>
                                <div className='flex text-sm text-gray-700 leading-relaxed whitespace-pre-line'>
                                  <RichTextDisplay content={h.remarks} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Original License Details tab: data from the License GET API (lazy loaded). */}
        {activeTab === 'original' && (
          <OriginalLicenseDetails
            licenseData={licenseData}
            licenseId={request.licenseId}
            licenseNumber={request.Licenses?.licenseNumber || request.licenseNumber}
          />
        )}
    </div>
  );
}

/**
 * Original License Details tab content.
 * Renders only data returned by the License GET API (GET /api/licenses/:licenseId).
 * No Fresh Application API is used.
 */
function OriginalLicenseDetails({ licenseData, licenseId, licenseNumber }: {
  licenseData: any;
  licenseId?: number | string | null;
  licenseNumber?: string | null;
}) {
  const license = licenseData || {};
  const applicantName = [license.firstName, license.middleName, license.lastName]
    .filter(Boolean)
    .join(' ') || 'N/A';
  const weapons = Array.isArray(license.requestedWeapons)
    ? license.requestedWeapons.map((w: any) => w.name || w).join(', ')
    : '';

  return (
    <>
      {/* Key identifiers from the License API */}
      <div className='rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden'>
        <div className='grid gap-6 p-6 md:grid-cols-3'>
          <DetailItem label='License ID' value={license.id ?? licenseId} icon={Fingerprint} mono />
          <DetailItem label='License Number' value={license.licenseNumber ?? licenseNumber} icon={ShieldCheck} mono />
          <DetailItem label='Applicant Name' value={applicantName} icon={UserRound} />
          <DetailItem label='License Status' value={license.status ? <StatusBadge status={license.status} /> : 'N/A'} icon={BadgeCheck} />
          <DetailItem label='License Type' value={license.licenseType || 'Weapon'} icon={Target} />
          <DetailItem label='Issue Date' value={fmtDate(license.issueDate)} icon={CalendarDays} />
          <DetailItem label='Expiry Date' value={fmtDate(license.expiryDate)} icon={CalendarDays} />
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch'>
        <SectionCard title='License Details' icon={Shield} iconColorClass='text-blue-600 bg-blue-50 border-blue-100'>
          <div className='space-y-4 flex-1'>
            <DetailItem label='Need for License' value={license.needForLicense} icon={Target} />
            <DetailItem label='Arms Category' value={license.armsCategory} icon={ShieldCheck} />
            <DetailItem label='Requested Weapons' value={weapons} icon={Crosshair} />
            <DetailItem label='Area of Validity' value={license.areaOfValidity} icon={MapPin} />
            <DetailItem label='Place / Area' value={license.licencedPlaceArea} icon={LocateFixed} />
            <DetailItem label='Ammunition' value={license.ammunitionDescription} icon={Package} />
          </div>
        </SectionCard>

        <SectionCard title='License History' icon={History} iconColorClass='text-amber-600 bg-amber-50 border-amber-100'>
          <div className='space-y-4 flex-1'>
            <DetailItem label='Previously Applied' value={yn(license.hasAppliedBefore)} icon={ClipboardCheck} />
            <DetailItem label='Previous Result' value={license.previousResult} icon={BadgeCheck} />
            <DetailItem label='Previous Authority' value={license.previousAuthorityName} icon={Building2} />
            <DetailItem label='License Suspended' value={yn(license.hasLicenceSuspended)} icon={ShieldAlert} />
            <DetailItem label='Suspension Reason' value={license.suspensionReason} icon={AlertTriangle} />
            <DetailItem label='Family License' value={yn(license.hasFamilyLicence)} icon={Users} />
          </div>
        </SectionCard>

        <SectionCard title='Criminal History' icon={TriangleAlert} iconColorClass='text-red-600 bg-red-50 border-red-100'>
          <div className='space-y-4 flex-1'>
            <DetailItem label='Convicted' value={yn(license.isConvicted)} icon={Ban} />
            <DetailItem label='Bond Executed' value={yn(license.isBondExecuted)} icon={FileWarning} />
            <DetailItem label='Prohibited' value={yn(license.isProhibited)} icon={Scale} />
            {Array.isArray(license.firDetails) && license.firDetails.length > 0 && (
              <div className='mt-4 pt-4 border-t border-slate-100'>
                <p className='text-xs font-bold uppercase tracking-wide text-slate-400 mb-2'>FIR Details</p>
                {license.firDetails.map((fir: any, i: number) => (
                  <div key={i} className='bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs mb-2 break-words'>
                    {typeof fir === 'string' ? fir : JSON.stringify(fir)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch'>
        {(() => {
          const present = license.presentAddress || {};
          return (
            <SectionCard title='Present Address' icon={MapPin} iconColorClass='text-purple-600 bg-purple-50 border-purple-100'>
              <div className='space-y-4 flex-1'>
                <p className='text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3'>{present.addressLine}</p>
                <DetailItem label='District' value={present.district?.name} icon={MapPin} />
                <DetailItem label='State' value={present.state?.name} icon={MapPin} />
                <DetailItem label='Police Station' value={present.policeStation?.name} icon={Building} />
                <DetailItem label='Since Residing' value={fmtDate(present.sinceResiding)} icon={CalendarDays} />
                <DetailItem label='Mobile' value={present.officeMobileNumber} icon={FileText} />
              </div>
            </SectionCard>
          );
        })()}
        {(() => {
          const permanent = license.permanentAddress || {};
          return (
            <SectionCard title='Permanent Address' icon={MapPin} iconColorClass='text-indigo-600 bg-indigo-50 border-indigo-100'>
              <div className='space-y-4 flex-1'>
                <p className='text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3'>{permanent.addressLine}</p>
                <DetailItem label='District' value={permanent.district?.name} icon={MapPin} />
                <DetailItem label='State' value={permanent.state?.name} icon={MapPin} />
                <DetailItem label='Police Station' value={permanent.policeStation?.name} icon={Building} />
                <DetailItem label='Since Residing' value={fmtDate(permanent.sinceResiding)} icon={CalendarDays} />
                <DetailItem label='Mobile' value={permanent.officeMobileNumber} icon={FileText} />
              </div>
            </SectionCard>
          );
        })()}
        {(() => {
          const occ = license.occupationAndBusiness || {};
          return (
            <SectionCard title='Occupation & Business' icon={BriefcaseBusiness} iconColorClass='text-teal-600 bg-teal-50 border-teal-100'>
              <div className='space-y-4 flex-1'>
                <DetailItem label='Occupation' value={occ.occupation} icon={BriefcaseBusiness} />
                <DetailItem label='Office Address' value={occ.officeAddress} icon={Building2} />
                <DetailItem label='Crop Location' value={occ.cropLocation} icon={LocateFixed} />
                {occ.areaUnderCultivation && (
                  <DetailItem label='Area Under Cultivation' value={`${occ.areaUnderCultivation} Acres`} icon={FileText} />
                )}
                <DetailItem label='State' value={occ.state?.name} icon={MapPin} />
                <DetailItem label='District' value={occ.district?.name} icon={MapPin} />
              </div>
            </SectionCard>
          );
        })()}
      </div>
    </>
  );
}
