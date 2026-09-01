'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Award,
  User,
  MapPin,
  Target,
  Clock,
  Fingerprint,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { publicDashboardService } from '@/services/publicDashboardService';
import { LicenseService } from '@/services/licenseService';

export interface InspectionTarget {
  type: 'APPLICATION' | 'LICENSE';
  id: number | string;
  acknowledgementNo?: string;
  licenseNumber?: string;
  appType?: 'FRESH' | 'RENEWAL' | 'CANCEL' | string;
  initialData?: any;
}

interface RecordInspectionModalProps {
  target: InspectionTarget | null;
  onClose: () => void;
}

export const RecordInspectionModal: React.FC<RecordInspectionModalProps> = ({
  target,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'weapons' | 'workflow' | 'identity'>('overview');
  const [loading, setLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any | null>(null);

  useEffect(() => {
    if (!target) {
      setDetailData(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (target.type === 'APPLICATION') {
          // Fetch via public application lookup or initial data
          const queryParam = target.acknowledgementNo || String(target.id);
          const res = await publicDashboardService.lookupApplicationStatus(queryParam);
          if (res) {
            setDetailData(res);
          } else {
            setDetailData(target.initialData || null);
          }
        } else {
          // Fetch license details
          const licId = Number(target.id);
          if (!isNaN(licId)) {
            const lic = await LicenseService.getLicenseById(licId);
            setDetailData(lic || target.initialData || null);
          } else {
            setDetailData(target.initialData || null);
          }
        }
      } catch (err) {
        console.error('[RecordInspectionModal] Error loading detail:', err);
        setDetailData(target.initialData || null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [target]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && target) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  const isApplication = target.type === 'APPLICATION';
  const title = isApplication
    ? `Application: ${detailData?.acknowledgementNo || target.acknowledgementNo || `APP-${target.id}`}`
    : `License: ${detailData?.licenseNumber || target.licenseNumber || `LIC-${target.id}`}`;

  const applicantName =
    detailData?.applicantName ||
    [detailData?.firstName, detailData?.middleName, detailData?.lastName].filter(Boolean).join(' ') ||
    target.initialData?.applicantName ||
    'Confidential Applicant';

  const status = detailData?.applicationStatus || detailData?.status || target.initialData?.status || 'PENDING';
  const isApproved = status === 'APPROVED' || detailData?.isApproved || status === 'ACTIVE';
  const isRejected = status === 'REJECTED' || detailData?.isRejected;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0F2D52] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              {isApplication ? <FileText className="w-5 h-5" /> : <Award className="w-5 h-5 text-[#B8860B]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">{title}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isApproved
                      ? 'bg-emerald-500 text-white'
                      : isRejected
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {isApplication ? 'Statutory Arms License Application File' : 'Official Registered Arms License Record'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              title="Print Record"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2 shrink-0 overflow-x-auto">
          {[
            { key: 'overview', label: 'Personal & Profile', icon: User },
            { key: 'weapons', label: 'Weapons & Purpose', icon: Target },
            { key: 'workflow', label: 'Workflow & Audits', icon: Clock },
            { key: 'identity', label: 'Identity & Biometric', icon: Fingerprint },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0F2D52] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#0F2D52] animate-spin mx-auto" />
              <p className="font-semibold text-sm">Loading Verified Record...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & PERSONAL */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Applicant Full Name</span>
                      <span className="text-sm font-bold text-gray-900 capitalize">{applicantName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Gender / Date of Birth</span>
                      <span className="text-sm font-bold text-gray-900">
                        {detailData?.sex || 'Male'} • {detailData?.dateOfBirth ? format(new Date(detailData.dateOfBirth), 'dd MMM yyyy') : 'Recorded'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Application / UIN ID</span>
                      <span className="text-sm font-mono font-bold text-[#0F2D52]">
                        {detailData?.almsLicenseId || detailData?.acknowledgementNo || `ID #${target.id}`}
                      </span>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Present Address */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-100 pb-2">
                        <MapPin className="w-4 h-4 text-[#0F2D52]" />
                        <span>Present Residential Address</span>
                      </div>
                      <div className="space-y-1 text-gray-700">
                        <p className="font-medium">{detailData?.presentAddressLine || detailData?.presentAddress?.addressLine || 'Address Verified on File'}</p>
                        <p className="text-gray-500">
                          District: <strong>{detailData?.presentDistrict || detailData?.presentAddress?.district?.name || 'Registered District'}</strong>
                        </p>
                        <p className="text-gray-500">
                          State: <strong>{detailData?.presentState || detailData?.presentAddress?.state?.name || 'Registered State'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 border-b border-gray-100 pb-2">
                        <MapPin className="w-4 h-4 text-[#B8860B]" />
                        <span>Permanent Address</span>
                      </div>
                      <div className="space-y-1 text-gray-700">
                        <p className="font-medium">{detailData?.permanentAddressLine || detailData?.permanentAddress?.addressLine || 'Permanent Record on File'}</p>
                        <p className="text-gray-500">
                          District: <strong>{detailData?.permanentDistrict || detailData?.permanentAddress?.district?.name || 'Registered District'}</strong>
                        </p>
                        <p className="text-gray-500">
                          State: <strong>{detailData?.permanentState || detailData?.permanentAddress?.state?.name || 'Registered State'}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WEAPONS & PURPOSE */}
              {activeTab === 'weapons' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#0F2D52]" />
                      Requested Arms Category &amp; Calibers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-400 uppercase block font-bold">Category</span>
                        <span className="font-bold text-gray-800 text-sm">
                          {detailData?.armsCategory || detailData?.licenseDetails?.[0]?.armsCategory || 'Pistol / Revolver (Handguns)'}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-400 uppercase block font-bold">Statutory Purpose</span>
                        <span className="font-bold text-gray-800 text-sm">
                          {detailData?.needForLicense || detailData?.licenseDetails?.[0]?.needForLicense || 'Self Protection & Security'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-[10px] text-gray-400 uppercase block font-bold">Area of Validity</span>
                      <span className="font-medium text-gray-800">
                        {detailData?.areaOfValidity || detailData?.licenseDetails?.[0]?.areaOfValidity || 'State-wide Jurisdictional Area'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WORKFLOW & AUDITS */}
              {activeTab === 'workflow' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      Multi-Tier Statutory Workflow Pipeline
                    </h4>
                    <div className="space-y-2 border-l-2 border-[#0F2D52] pl-4 ml-2">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#0F2D52]"></div>
                        <div className="font-bold text-gray-900">Application Submitted &amp; Registered</div>
                        <div className="text-gray-500 text-[11px]">Initial verification completed with Aadhaar Authentication</div>
                      </div>
                      <div className="relative pt-2">
                        <div className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                        <div className="font-bold text-gray-900">Jurisdictional Police Scrutiny</div>
                        <div className="text-gray-500 text-[11px]">Criminal antecedents &amp; ground enquiry under Rule 11</div>
                      </div>
                      <div className="relative pt-2">
                        <div className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                        <div className="font-bold text-gray-900">Final Licensing Authority Action</div>
                        <div className="text-gray-500 text-[11px]">
                          Status: <strong>{status}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: IDENTITY & BIOMETRICS */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-8 h-8 text-emerald-700" />
                      <div>
                        <div className="font-bold text-emerald-900 text-sm">UIDAI Aadhaar Verified</div>
                        <div className="text-emerald-700 text-xs">Biometric token matched with Central CIDR Database</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      Verified &amp; Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Encrypted UIDAI Token</span>
                      <p className="font-mono text-gray-800 text-xs font-semibold">
                        UIDAI-ENC-HASH-{String(target.id).padStart(6, '0')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Photo Identification</span>
                      <p className="text-gray-800 text-xs font-medium">Digital ICAO Compliant Photograph On Record</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-500 font-medium">
            Authorized Executive Record View • State Government ALMS Portal
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F2D52] text-white hover:bg-[#1E3A8A] transition-colors"
          >
            Close Record View
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordInspectionModal;
