import React from 'react';
import {
  StatusBadge,
  DetailItem,
  SectionCard,
  SummaryCard,
  DocumentTable,
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
  ClipboardCheck,
  Building2,
  ShieldAlert,
  AlertTriangle,
  Users,
  TriangleAlert,
  FileWarning,
  Calendar,
  Ban,
  Scale,
  FileSearch,
  Building,
  Landmark,
  BriefcaseBusiness,
} from 'lucide-react';
import { formatGender, formatStatusLabel, formatApplicationType } from '@/utils/formatters';
import { LazySection } from '@/components/LazySection';
import { ApplicationHistoryCards } from './ApplicationHistoryCards';

export function ApplicationDetailsView({ application, hideLicenseDetails }: { application: any, hideLicenseDetails?: boolean }) {
  if (!application) return null;

  const applicantName =
    [application?.firstName, application?.middleName, application?.lastName]
      .filter(Boolean)
      .join(' ') ||
    application?.applicantName ||
    '-';

  const licenseDetails = application?.licenseDetails || application?.licenseDetail;
  const license = Array.isArray(licenseDetails) ? licenseDetails[0] : licenseDetails;

  const history = application?.licenseHistories?.[0] || {};
  const criminal = application?.criminalHistories?.[0] || {};
  const present = application?.presentAddress || {};
  const permanent = application?.permanentAddress || {};
  const occupation = application?.occupationDetails || {};

  return (
    <div className="space-y-8">
      {/* 1. Application Information Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
              <UserRound className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">
              Application Information
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 columns: Applicant Details */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem
              label="Full Name"
              value={applicantName}
              icon={UserRound}
              className="md:col-span-2"
            />
            {application?.parentOrSpouseName && (
              <DetailItem
                label="Parent / Spouse Name"
                value={application.parentOrSpouseName}
                icon={Users}
              />
            )}
            {application?.sex && (
              <DetailItem
                label="Gender"
                value={formatGender(application.sex)}
                icon={UserCheck}
              />
            )}
            {application?.placeOfBirth && (
              <DetailItem
                label="Place of Birth"
                value={application.placeOfBirth}
                icon={MapPin}
              />
            )}
            {(application?.dateOfBirth || application?.dob) && (
              <DetailItem
                label="Date of Birth"
                value={
                  application?.dateOfBirth
                    ? new Date(application.dateOfBirth).toLocaleDateString('en-IN')
                    : application?.dob
                    ? new Date(application.dob).toLocaleDateString('en-IN')
                    : null
                }
                icon={CalendarDays}
              />
            )}
            {application?.panNumber && (
              <DetailItem
                label="PAN Number"
                value={application.panNumber}
                icon={CreditCard}
                mono
              />
            )}
            {application?.aadharNumber && (
              <DetailItem
                label="Aadhar Number"
                value={application.aadharNumber}
                icon={Fingerprint}
                mono
              />
            )}
            {application?.acknowledgementNo && (
              <DetailItem
                label="Acknowledgement Number"
                value={application.acknowledgementNo}
                icon={FileCheck}
                mono
              />
            )}
            {application?.workflowStatus && (
              <DetailItem
                label="Workflow Status"
                value={<StatusBadge status={application.workflowStatus} />}
                icon={BadgeCheck}
              />
            )}
            <DetailItem
              label="Application Type"
              value={
                <StatusBadge
                  status={application?.applicationType || 'N/A'}
                  label={formatApplicationType(application?.applicationType)}
                />
              }
              icon={Clock3}
            />
            {application?.applicationDate && (
              <DetailItem
                label="Date & Time of Submission"
                value={new Date(application.applicationDate).toLocaleString('en-IN')}
                icon={CalendarDays}
                className="md:col-span-2"
              />
            )}
          </div>

          {/* Right column: Quick Summary & Timeline */}
          <div>
            <SummaryCard
              application={application}
              applicationId={application.id}
              applicantName={applicantName}
            />
          </div>
        </div>
      </div>

      {/* 2. License Details & History */}
      {!hideLicenseDetails && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {license && (
          <SectionCard
            title="License Details"
            icon={Shield}
            iconColorClass="text-blue-600 bg-blue-50 border-blue-100"
          >
            <div className="space-y-4 flex-1">
              <DetailItem label="Need for License" value={license.needForLicense} icon={Target} />
              <DetailItem label="Arms Category" value={license.armsCategory} icon={ShieldCheck} />
              <DetailItem label="Area of Validity" value={license.areaOfValidity} icon={MapPin} />
              <DetailItem label="Licence Place / Area" value={license.licencePlaceArea} icon={LocateFixed} />
              <DetailItem label="Ammunition Description" value={license.ammunitionDescription} icon={Package} />
            </div>
          </SectionCard>
        )}

        {Object.keys(history).length > 0 && (
          <SectionCard
            title="License History"
            icon={History}
            iconColorClass="text-amber-600 bg-amber-50 border-amber-100"
          >
            <div className="space-y-4 flex-1">
              <DetailItem label="Previously Applied" value={history.hasAppliedBefore ? 'Yes' : 'No'} icon={ClipboardCheck} />
              <DetailItem label="Previous Result" value={history.previousResult} icon={BadgeCheck} />
              <DetailItem label="Previous Authority" value={history.previousAuthorityName} icon={Building2} />
              <DetailItem label="License Suspended" value={history.hasLicenceSuspended ? 'Yes' : 'No'} icon={ShieldAlert} />
            </div>
          </SectionCard>
        )}

        {Object.keys(criminal).length > 0 && (
          <SectionCard
            title="Criminal History"
            icon={TriangleAlert}
            iconColorClass="text-red-600 bg-red-50 border-red-100"
          >
            <div className="space-y-4 flex-1">
              <DetailItem label="Convicted" value={criminal.isConvicted ? 'Yes' : 'No'} icon={Ban} />
              <DetailItem label="Bond Executed" value={criminal.isBondExecuted ? 'Yes' : 'No'} icon={FileWarning} />
              <DetailItem label="Prohibited" value={criminal.isProhibited ? 'Yes' : 'No'} icon={Scale} />
            </div>
          </SectionCard>
        )}
      </div>

      {/* 3. Address Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {Object.keys(present).length > 0 && (
          <SectionCard
            title="Present Address Details"
            icon={MapPin}
            iconColorClass="text-purple-600 bg-purple-50 border-purple-100"
          >
            <div className="space-y-4 flex-1">
              <DetailItem label="Address" value={present.addressLine} icon={Building} />
              <DetailItem label="State" value={typeof present.state === 'object' ? present.state?.name : present.state} icon={Landmark} />
              <DetailItem label="District" value={typeof present.district === 'object' ? present.district?.name : present.district} icon={Building2} />
              <DetailItem label="Police Station" value={present.policeStation?.name} icon={Building2} />
            </div>
          </SectionCard>
        )}

        {Object.keys(permanent).length > 0 && (
          <SectionCard
            title="Permanent Address Details"
            icon={MapPin}
            iconColorClass="text-indigo-600 bg-indigo-50 border-indigo-100"
          >
            <div className="space-y-4 flex-1">
              <DetailItem label="Address" value={permanent.addressLine} icon={Building} />
              <DetailItem label="State" value={typeof permanent.state === 'object' ? permanent.state?.name : permanent.state} icon={Landmark} />
              <DetailItem label="District" value={typeof permanent.district === 'object' ? permanent.district?.name : permanent.district} icon={Building2} />
              <DetailItem label="Police Station" value={permanent.policeStation?.name} icon={Building2} />
            </div>
          </SectionCard>
        )}

        {Object.keys(occupation).length > 0 && (
          <SectionCard
            title="Occupation Details"
            icon={BriefcaseBusiness}
            iconColorClass="text-emerald-600 bg-emerald-50 border-emerald-100"
          >
            <div className="space-y-4 flex-1">
              <DetailItem label="Occupation" value={occupation.occupation} icon={BriefcaseBusiness} />
              <DetailItem label="Designation" value={occupation.designation} icon={UserCheck} />
              <DetailItem label="Organization" value={occupation.organizationName} icon={Building2} />
            </div>
          </SectionCard>
        )}
      </div>
      </>
      )}

      {/* 4. Uploaded Documents */}
      {application?.fileUploads && application.fileUploads.length > 0 && (
        <SectionCard
          title="Uploaded Documents"
          icon={FileText}
          iconColorClass="text-indigo-600 bg-indigo-50 border-indigo-100"
        >
          <div className="w-full">
            <DocumentTable documents={application.fileUploads} />
          </div>
        </SectionCard>
      )}

      {/* 5. Application History (New Vertical Layout) */}
      <ApplicationHistoryCards 
        workflowHistory={application?.workflowHistories || application?.workflowHistory || []} 
      />
    </div>
  );
}
