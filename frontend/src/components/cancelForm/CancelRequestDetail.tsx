'use client';

import React, { useState } from 'react';
import { 
  StatusBadge, 
  DetailItem, 
  SectionCard, 
  DocumentTable 
} from '@/app/application/components/RedesignedComponents';
import {
  UserRound,
  UserCheck,
  CalendarDays,
  CreditCard,
  Fingerprint,
  FileCheck,
  UserCog,
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
  Users,
  BriefcaseBusiness,
  AlertTriangle,
  FileSearch,
  Scale
} from 'lucide-react';
import { formatGender } from '@/utils/formatters';

interface CancelRequestDetailProps {
  request: any;
}

export function CancelTimeline({ histories }: { histories: any[] }) {
  if (!histories || histories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 w-full">
        <History className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-sm font-semibold text-slate-700">No history entries yet</p>
        <p className="text-xs text-slate-400 mt-1">Actions taken on this request will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-red-200 ml-4 pl-6 space-y-6 w-full">
      {histories.map((entry: any, index: number) => {
        const formattedDate = entry.createdAt
          ? new Date(entry.createdAt).toLocaleString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        return (
          <div key={entry.id || index} className="relative">
            {/* Timeline node icon */}
            <span className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600 ring-4 ring-white border border-red-200 shadow-sm">
              <UserCog className="h-3 w-3" />
            </span>
            <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <span className="font-bold text-slate-800 text-sm">
                  {entry.previousUser?.username || 'Initiator'} 
                  {entry.previousRole?.name && (
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      ({entry.previousRole.name})
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  {formattedDate}
                </span>
              </div>
              <div className="mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-red-50 text-red-700 border border-red-100 uppercase">
                  Action: {entry.actionTaken}
                </span>
              </div>
              {entry.remarks && (
                <p className="text-slate-600 text-xs mt-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg whitespace-pre-line leading-relaxed">
                  {entry.remarks}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CancelRequestDetail({ request }: CancelRequestDetailProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'original'>('request');
  if (!request) return null;

  const freshApp = request.freshLicense;
  const applicantName = freshApp
    ? [freshApp.firstName, freshApp.middleName, freshApp.lastName].filter(Boolean).join(' ')
    : 'N/A';

  return (
    <div className='space-y-6'>
      {/* Title Card */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div>
            <h2 className='text-3xl font-bold text-gray-900 tracking-tight'>
              Cancellation Request #{request.id}
            </h2>
            <p className='text-gray-500 mt-2 font-medium flex items-center gap-2 flex-wrap'>
              <span>For Application ID: <strong>#{request.freshLicenseId}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Ack No: <strong>{request.acknowledgementNo || freshApp?.acknowledgementNo || 'N/A'}</strong></span>
              <span className='inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200 font-semibold ml-2'>
                {request.applicationType === 'CancelFormRequest' ? 'Cancel Request' : request.applicationType}
              </span>
            </p>
          </div>
          <div>
            <span
              className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                request.status === 'APPROVED' || request.workflowStatus?.code === 'APPROVED'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : request.status === 'REJECTED' || request.workflowStatus?.code === 'REJECTED'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {request.status || request.workflowStatus?.name || 'PENDING'}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mt-8">
          <button
            onClick={() => setActiveTab('request')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
              activeTab === 'request'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cancellation Info
          </button>
          {freshApp && (
            <button
              onClick={() => setActiveTab('original')}
              className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
                activeTab === 'original'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Original Application Details
            </button>
          )}
        </div>
      </div>

      {activeTab === 'request' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Details Section */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2'>
              <div className='w-1 h-4 bg-red-600 rounded'></div>
              Request Details
            </h3>
            
            <div className='space-y-4'>
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                <p className='text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5'>Reason for Cancellation</p>
                <p className='text-gray-900 font-semibold text-sm leading-relaxed'>{request.cancellationReason}</p>
              </div>

              {request.remarks && (
                <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                  <p className='text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5'>Additional Remarks / Process History</p>
                  <p className='text-gray-800 text-xs bg-white p-3 border border-gray-200 rounded-lg whitespace-pre-line leading-relaxed font-mono'>
                    {request.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline & Metadata */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
            <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2'>
              <div className='w-1 h-4 bg-red-600 rounded'></div>
              Timeline & Metadata
            </h3>
            
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <DetailItem label="Requested By" value={request.requester?.username || 'Unknown'} icon={UserRound} />
              <DetailItem label="User Role" value={request.requester?.role?.name || 'N/A'} icon={UserCog} />
              
              <DetailItem 
                label="Requested Date" 
                value={request.requestedDate ? new Date(request.requestedDate).toLocaleString() : new Date(request.createdAt).toLocaleString()} 
                icon={CalendarDays} 
              />
              
              {request.status !== 'PENDING' && (request.actionedDate || request.updatedAt) && (
                <DetailItem 
                  label="Actioned Date" 
                  value={new Date(request.actionedDate || request.updatedAt).toLocaleString()} 
                  icon={CalendarDays} 
                />
              )}

              {request.actioner && (
                <DetailItem label="Actioned By" value={request.actioner.username} icon={UserRound} />
              )}

              {request.workflowStatus && (
                <DetailItem label="Current Stage" value={request.workflowStatus.name} icon={BadgeCheck} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Personal Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2'>
              <UserRound className="w-4 h-4 text-red-600" />
              Applicant Personal Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailItem label="Full Name" value={applicantName} icon={UserRound} />
              <DetailItem label="Parent/Spouse Name" value={freshApp.parentOrSpouseName} icon={Users} />
              <DetailItem label="Gender" value={formatGender(freshApp.sex)} icon={UserCheck} />
              
              {freshApp.dateOfBirth && (
                <DetailItem 
                  label="Date of Birth" 
                  value={new Date(freshApp.dateOfBirth).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} 
                  icon={CalendarDays} 
                />
              )}
              <DetailItem label="Place of Birth" value={freshApp.placeOfBirth} icon={MapPin} />
              <DetailItem label="Aadhar Number" value={freshApp.aadharNumber} icon={Fingerprint} mono />
              <DetailItem label="PAN Number" value={freshApp.panNumber} icon={CreditCard} mono />
              <DetailItem label="Acknowledgement No" value={freshApp.acknowledgementNo} icon={FileCheck} mono />
              <DetailItem label="Workflow Status" value={<StatusBadge status={freshApp.workflowStatus} />} icon={BadgeCheck} />
            </div>
          </div>

          {/* Present & Permanent Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freshApp.presentAddress && (
              <SectionCard title="Present Address" icon={MapPin} iconColorClass="text-purple-600 bg-purple-50 border-purple-100">
                <div className="space-y-3">
                  <p className="text-slate-800 font-medium text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{freshApp.presentAddress.addressLine}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">District</span>
                      <span className="font-semibold text-slate-700">{freshApp.presentAddress.district?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">State</span>
                      <span className="font-semibold text-slate-700">{freshApp.presentAddress.state?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">Police Station</span>
                      <span className="font-semibold text-slate-700">{freshApp.presentAddress.policeStation?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">Division</span>
                      <span className="font-semibold text-slate-700">{freshApp.presentAddress.division?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">Zone</span>
                      <span className="font-semibold text-slate-700">{freshApp.presentAddress.zone?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {freshApp.permanentAddress && (
              <SectionCard title="Permanent Address" icon={MapPin} iconColorClass="text-indigo-600 bg-indigo-50 border-indigo-100">
                <div className="space-y-3">
                  <p className="text-slate-800 font-medium text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{freshApp.permanentAddress.addressLine}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">District</span>
                      <span className="font-semibold text-slate-700">{freshApp.permanentAddress.district?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">State</span>
                      <span className="font-semibold text-slate-700">{freshApp.permanentAddress.state?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">Police Station</span>
                      <span className="font-semibold text-slate-700">{freshApp.permanentAddress.policeStation?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">Division</span>
                      <span className="font-semibold text-slate-700">{freshApp.permanentAddress.division?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[9px]">Zone</span>
                      <span className="font-semibold text-slate-700">{freshApp.permanentAddress.zone?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>

          {/* License & Occupation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freshApp.licenseDetails?.[0] && (
              <SectionCard title="License Specifications" icon={Shield} iconColorClass="text-blue-600 bg-blue-50 border-blue-100">
                <div className="space-y-3">
                  <DetailItem label="Need for License" value={freshApp.licenseDetails[0].needForLicense} icon={Target} />
                  <DetailItem label="Category of Arms" value={freshApp.licenseDetails[0].armsCategory} icon={ShieldCheck} />
                  <DetailItem label="Area of Validity" value={freshApp.licenseDetails[0].areaOfValidity} icon={MapPin} />
                  <DetailItem label="Ammunition Specification" value={freshApp.licenseDetails[0].ammunitionDescription} icon={Package} />
                  <DetailItem label="Special Consideration" value={freshApp.licenseDetails[0].specialConsiderationReason} icon={FileText} />
                </div>
              </SectionCard>
            )}

            {freshApp.occupationAndBusiness && (
              <SectionCard title="Occupation & Business" icon={BriefcaseBusiness} iconColorClass="text-teal-600 bg-teal-50 border-teal-100">
                <div className="space-y-3">
                  <DetailItem label="Occupation" value={freshApp.occupationAndBusiness.occupation} icon={BriefcaseBusiness} />
                  <DetailItem label="Office Address" value={freshApp.occupationAndBusiness.officeAddress} icon={MapPin} />
                  <DetailItem label="Crop Location" value={freshApp.occupationAndBusiness.cropLocation} icon={LocateFixed} />
                  {freshApp.occupationAndBusiness.areaUnderCultivation && (
                    <DetailItem label="Area Under Cultivation" value={`${freshApp.occupationAndBusiness.areaUnderCultivation} Acres`} icon={FileText} />
                  )}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Criminal History & License History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freshApp.criminalHistories?.[0] && (
              <SectionCard title="Criminal Verification" icon={AlertTriangle} iconColorClass="text-red-600 bg-red-50 border-red-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Convicted in Court:</span>
                    <span className={freshApp.criminalHistories[0].isConvicted ? 'text-red-600' : 'text-green-600'}>
                      {freshApp.criminalHistories[0].isConvicted ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Bond Executed:</span>
                    <span className={freshApp.criminalHistories[0].isBondExecuted ? 'text-red-600' : 'text-green-600'}>
                      {freshApp.criminalHistories[0].isBondExecuted ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>Prohibited:</span>
                    <span className={freshApp.criminalHistories[0].isProhibited ? 'text-red-600' : 'text-green-600'}>
                      {freshApp.criminalHistories[0].isProhibited ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </SectionCard>
            )}

            {freshApp.licenseHistories?.[0] && (
              <SectionCard title="Previous License History" icon={History} iconColorClass="text-amber-600 bg-amber-50 border-amber-100">
                <div className="space-y-3">
                  <DetailItem label="Has Applied Before" value={freshApp.licenseHistories[0].hasAppliedBefore ? 'YES' : 'NO'} icon={FileSearch} />
                  {freshApp.licenseHistories[0].hasAppliedBefore && (
                    <>
                      <DetailItem label="Previous Authority" value={freshApp.licenseHistories[0].previousAuthorityName} icon={FileText} />
                      <DetailItem label="Previous Result" value={freshApp.licenseHistories[0].previousResult} icon={Scale} />
                    </>
                  )}
                  <DetailItem label="License Suspended / Revoked" value={freshApp.licenseHistories[0].hasLicenceSuspended ? 'YES' : 'NO'} icon={AlertTriangle} />
                </div>
              </SectionCard>
            )}
          </div>

          {/* Document Section */}
          {freshApp.fileUploads && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2'>
                <FileText className="w-4 h-4 text-red-600" />
                Uploaded Documents
              </h3>
              <DocumentTable documents={freshApp.fileUploads} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
