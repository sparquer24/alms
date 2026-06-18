import React from 'react';
import { getStatusStyle } from '../../../utils/statusColors';
import { formatStatusLabel, formatPhone } from '../../../utils/formatters';
import { openAttachment } from '../../../utils/attachmentViewer';
import {
  UserRound,
  FileText,
  Eye,
  Download,
  FolderOpen
} from 'lucide-react';

export function StatusBadge({ status, label }: { status: any; label?: string }) {
  const style = getStatusStyle(
    status?.name || status?.code || status
  );
  const text = label || formatStatusLabel(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border shadow-sm transition-all duration-200"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {text}
    </span>
  );
}

export function DetailItem({
  label,
  value,
  icon: Icon,
  className = '',
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  mono?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 transition-all duration-200 ${className}`}>
      {Icon && (
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5 flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <p className={`font-semibold text-slate-800 text-sm leading-snug break-words ${mono ? 'font-mono tracking-tight' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  icon: Icon,
  children,
  iconColorClass = 'text-blue-600 bg-blue-50 border-blue-100',
  className = '',
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  iconColorClass?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col h-full ${className}`}>
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2.5 rounded-lg border ${iconColorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <h3 className="font-bold text-slate-800 text-base tracking-tight">{title}</h3>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

export function SummaryCard({
  application,
  applicationId,
  applicantName,
}: {
  application: any;
  applicationId: string | null;
  applicantName: string;
}) {
  let displayPhotoUrl = application?.photoUrl;
  if (!displayPhotoUrl) {
    const files = application?.documents || application?.fileUploads || application?.renewalFileUploads || application?.uploads || [];
    const photoFile = files.find((f: any) => String(f?.fileType || f?.type || '').toUpperCase() === 'PHOTOGRAPH');
    if (photoFile) {
      displayPhotoUrl = photoFile.fileUrl || photoFile.url || photoFile.path;
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center">
      <div className="relative group mb-4">
        {displayPhotoUrl ? (
          <img
            src={displayPhotoUrl}
            alt="Applicant Photo"
            className="w-48 h-48 object-cover rounded-xl border-2 border-slate-200 shadow-inner group-hover:border-blue-400 transition-colors duration-300"
          />
        ) : (
          <div className="w-48 h-48 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <UserRound className="w-10 h-10 text-slate-300" />
            <span>No Photo Available</span>
          </div>
        )}
      </div>

      <div className="w-full space-y-2.5 border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Summary</h4>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Application ID</span>
          <span className="font-bold text-slate-800 font-mono text-xs">{application?.id || applicationId || '—'}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Full Name</span>
          <span className="font-semibold text-slate-800 text-right truncate max-w-[160px]" title={applicantName}>{applicantName}</span>
        </div>

        {application?.mobileNumber && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Mobile</span>
            <span className="font-semibold text-slate-800">{formatPhone(application.mobileNumber)}</span>
          </div>
        )}

        {application?.email && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Email</span>
            <span className="font-semibold text-slate-800 truncate max-w-[160px]" title={application.email}>{application.email}</span>
          </div>
        )}

        {application?.aadharNumber && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Aadhar</span>
            <span className="font-semibold text-slate-800 font-mono text-xs">{application.aadharNumber}</span>
          </div>
        )}

        {application?.panNumber && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">PAN</span>
            <span className="font-semibold text-slate-800 font-mono text-xs">{application.panNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentTable({ documents }: { documents: any[] }) {
  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500 text-sm font-semibold">No documents uploaded</p>
        <p className="text-slate-400 text-xs mt-1">Documents will appear here once uploaded</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4">Document Type</th>
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4 text-right print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {documents.map((doc, idx) => {
              const docType = String(doc.type || doc.fileType || '').toUpperCase() || 'DOCUMENT';
              const docName = String(doc.name || doc.fileName || 'file');
              const isPdf = String(doc.type || '').toLowerCase().includes('pdf') || docName.toLowerCase().endsWith('.pdf');
              const isImage = String(doc.type || '').toLowerCase().includes('image') || /\.(png|jpe?g|gif|svg|webp)$/.test(docName.toLowerCase());

              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isImage ? 'bg-emerald-50 text-emerald-600' : isPdf ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-700">{docType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500 truncate max-w-xs md:max-w-md" title={docName}>
                    {docName}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap print:hidden">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openAttachment(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 font-semibold text-xs border border-transparent hover:border-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = doc.url || doc.fileUrl || doc.path || doc.downloadUrl || '';
                          a.download = doc.name || doc.fileName || 'download';
                          a.rel = 'noopener';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold text-xs border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
