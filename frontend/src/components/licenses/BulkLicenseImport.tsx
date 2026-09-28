'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import LicenseService, {
  LicenseImportPreview,
  LicenseImportResult,
  LicenseImportRow,
  LicenseImportRollbackResult,
} from '@/services/licenseService';

/**
 * Column contract for a bulk license import file. The header labels are what the
 * backend recognises (it also accepts "License Number", snake_case and the raw
 * id columns), and both a readable name and a numeric id are supported for every
 * level of the address hierarchy.
 */
export const LICENSE_IMPORT_COLUMNS: Array<{
  header: string;
  required?: boolean;
  guidance?: string;
  example?: string;
}> = [
  { header: 'licenseNumber', required: true, guidance: 'Unique license number. Numbers already on record are rejected (or skipped).', example: 'LUAN2026001' },
  { header: 'almsLicenseId', guidance: 'Legacy ALMS identifier, if the register has one.', example: 'ALMS-4471' },
  { header: 'firstName', required: true, guidance: 'License holder first name.', example: 'Ramesh' },
  { header: 'middleName', guidance: 'Optional middle name.', example: '' },
  { header: 'lastName', required: true, guidance: 'License holder last name.', example: 'Kumar' },
  { header: 'parentOrSpouseName', required: true, guidance: 'Father, guardian or spouse name.', example: 'Suresh Kumar' },
  { header: 'sex', required: true, guidance: 'MALE, FEMALE or OTHER (M / F also accepted).', example: 'MALE' },
  { header: 'dateOfBirth', guidance: 'YYYY-MM-DD or DD/MM/YYYY. Excel date cells work too.', example: '1980-04-12' },
  { header: 'placeOfBirth', guidance: 'Town/city of birth.', example: 'Hyderabad' },
  { header: 'aadharNumber', guidance: '12 digits. Used for duplicate warnings.', example: '123456789012' },
  { header: 'panNumber', guidance: '10 character PAN.', example: 'ABCDE1234F' },
  { header: 'issueDate', required: true, guidance: 'Date the license was issued.', example: '2021-06-01' },
  { header: 'validFrom', guidance: 'Blank defaults to the issue date.', example: '2021-06-01' },
  { header: 'validTill', guidance: 'Expiry date. Leave blank only when the license has no expiry.', example: '2026-05-31' },
  { header: 'armsCategory', guidance: 'RESTRICTED (prohibited bore) or PERMISSIBLE (non-prohibited bore).', example: 'PERMISSIBLE' },
  { header: 'areaOfValidity', guidance: 'Free text area of validity.', example: 'District' },
  { header: 'ammunitionDescription', guidance: 'Description of ammunition endorsed.', example: '12 bore cartridges' },
  { header: 'licencePlaceArea', guidance: 'Place area noted on the licence.', example: 'Hyderabad' },
  { header: 'specialConsiderationReason', guidance: 'Reason recorded for any special consideration.', example: '' },
  { header: 'needForLicense', guidance: 'SELF_PROTECTION, SPORTS, HEIRLOOM_POLICY or CROP_PROTECTION.', example: 'SELF_PROTECTION' },
  { header: 'endorsedWeapons', guidance: 'Comma-separated weapon names. Must exist in the weapon master; unknown names are reported and skipped.', example: 'DBSL Gun, .32 Revolver' },

  { header: 'presentAddressLine', guidance: 'Present/current address (multi-line values are fine).', example: 'Jubilee Hills Main Road, Yousufguda' },
  { header: 'presentState', guidance: 'State name. Blank is filled with your own state; a different state is rejected.', example: 'Telangana' },
  { header: 'presentStateId', guidance: 'Numeric state id, as an alternative to the name column.', example: '24' },
  { header: 'presentDistrict', guidance: 'District name — must belong to the state.', example: 'Hyderabad' },
  { header: 'presentDistrictId', guidance: 'Numeric district id.', example: '579' },
  { header: 'presentPoliceStation', guidance: 'Police station name.', example: 'Jubilee Hills' },
  { header: 'presentPoliceStationId', guidance: 'Numeric police station id.', example: '8' },
  { header: 'presentRangeOffice', guidance: 'Range office name — must belong to the district.', example: 'Hyderabad Range' },
  { header: 'presentRangeOfficeId', guidance: 'Numeric range office id.', example: '1' },
  { header: 'presentZone', guidance: 'Zone name — must belong to the range office.', example: 'Zone 1' },
  { header: 'presentZoneId', guidance: 'Numeric zone id.', example: '1' },
  { header: 'presentDivision', guidance: 'Division name — must belong to the zone.', example: 'Division 3' },
  { header: 'presentDivisionId', guidance: 'Numeric division id.', example: '3' },

  { header: 'permanentAddressLine', guidance: 'Permanent address. Left entirely blank, it is copied from the present address.', example: 'Jubilee Hills Main Road, Yousufguda' },
  { header: 'permanentState', guidance: 'Permanent state name.', example: 'Telangana' },
  { header: 'permanentStateId', guidance: 'Numeric permanent state id.', example: '24' },
  { header: 'permanentDistrict', guidance: 'Permanent district name.', example: 'Hyderabad' },
  { header: 'permanentDistrictId', guidance: 'Numeric permanent district id.', example: '579' },
  { header: 'permanentPoliceStation', guidance: 'Permanent police station name.', example: 'Jubilee Hills' },
  { header: 'permanentPoliceStationId', guidance: 'Numeric permanent police station id.', example: '8' },
  { header: 'permanentRangeOffice', guidance: 'Permanent range office name.', example: 'Hyderabad Range' },
  { header: 'permanentRangeOfficeId', guidance: 'Numeric permanent range office id.', example: '1' },
  { header: 'permanentZone', guidance: 'Permanent zone name.', example: 'Zone 1' },
  { header: 'permanentZoneId', guidance: 'Numeric permanent zone id.', example: '1' },
  { header: 'permanentDivision', guidance: 'Permanent division name.', example: 'Division 3' },
  { header: 'permanentDivisionId', guidance: 'Numeric permanent division id.', example: '3' },

  { header: 'occupation', guidance: 'Occupation of the license holder.', example: 'Business' },
  { header: 'officeAddress', guidance: 'Office/business address.', example: '' },
  { header: 'status', guidance: 'ACTIVE, EXPIRED, SUSPENDED, CANCELLED or REVOKED. Defaults to ACTIVE.', example: 'ACTIVE' },
];

/**
 * Required columns, with the header spellings the backend accepts for each.
 * Used for an instant client-side check so a mis-built file is flagged before it
 * is uploaded; the backend remains the enforcer either way.
 */
export const REQUIRED_IMPORT_FIELDS: Array<{ label: string; aliases: string[] }> = [
  { label: 'License Number', aliases: ['licensenumber', 'licenseno'] },
  // The app's own export only has a combined holder name, which the backend
  // splits — so it satisfies both name columns.
  {
    label: 'First / Last Name',
    aliases: ['firstname', 'lastname', 'licenseholdername', 'licenceholdername', 'nameoflicenseholder'],
  },
  {
    label: 'Father/Guardian/Spouse Name',
    aliases: [
      'parentorspousename',
      'father',
      'fathername',
      'fathersname',
      'fatherofapplicant',
      'fatherorguardianname',
      'fatherguardianname',
      'guardianname',
      'spouse',
      'spousename',
      'husband',
      'husbandname',
    ],
  },
  { label: 'Gender', aliases: ['sex', 'gender'] },
  { label: 'Issue Date', aliases: ['issuedate'] },
];

const normalizeHeaderKey = (header: string) => String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Returns the required field labels that the uploaded headers do not cover. */
const findMissingRequiredFields = (headers: string[]): string[] => {
  const present = new Set(headers.map(normalizeHeaderKey));
  return REQUIRED_IMPORT_FIELDS.filter(field => !field.aliases.some(alias => present.has(alias))).map(
    field => field.label,
  );
};

/**
 * Builds the two-sheet import template: an empty data sheet plus field guidance.
 * Required headers are suffixed with " *" in the data sheet so they are obvious
 * while filling the file in — the backend strips the marker when reading it back.
 */
export const downloadLicenseImportTemplate = () => {
  const headers = LICENSE_IMPORT_COLUMNS.map(column =>
    column.required ? `${column.header} *` : column.header,
  );

  const dataSheet = XLSX.utils.aoa_to_sheet([headers]);
  dataSheet['!cols'] = headers.map(header => ({ wch: Math.max(18, Math.min(30, header.length + 8)) }));

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ['Field', 'Required', 'Accepted values / format', 'Example'],
    ...LICENSE_IMPORT_COLUMNS.map(column => [
      column.required ? `${column.header} *` : column.header,
      column.required ? 'Yes' : 'No',
      column.guidance ?? '',
      column.example ?? '',
    ]),
  ]);
  instructionsSheet['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 68 }, { wch: 30 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Licenses');
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  XLSX.writeFile(workbook, 'license-bulk-import-template.xlsx');
};

const STATUS_STYLES: Record<string, { label: string; chip: string; icon: React.ComponentType<{ className?: string }> }> = {
  valid: { label: 'Ready', chip: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  warning: { label: 'Warning', chip: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  error: { label: 'Error', chip: 'bg-red-100 text-red-700', icon: XCircle },
  skipped: { label: 'Skipped', chip: 'bg-slate-100 text-slate-600', icon: AlertTriangle },
  imported: { label: 'Imported', chip: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { label: 'Failed', chip: 'bg-red-100 text-red-700', icon: XCircle },
  rejected: { label: 'Blocked', chip: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
};

const downloadCsv = (filename: string, header: string[], rows: Array<Array<string | number>>) => {
  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const PREVIEW_ROW_LIMIT = 200;

interface BulkLicenseImportProps {
  /** Called after a successful import or rollback so the license list can refresh. */
  onChanged?: () => void;
  /** Called when the user wants to jump to the imported records. */
  onViewLicenses?: () => void;
}

export default function BulkLicenseImport({ onChanged, onViewLicenses }: BulkLicenseImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<LicenseImportRow[]>([]);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [strict, setStrict] = useState(false);
  const [onDuplicate, setOnDuplicate] = useState<'fail' | 'skip'>('fail');

  const [preview, setPreview] = useState<LicenseImportPreview | null>(null);
  const [result, setResult] = useState<LicenseImportResult | null>(null);
  const [rollback, setRollback] = useState<LicenseImportRollbackResult | null>(null);

  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [problemsOnly, setProblemsOnly] = useState(false);

  const resetForNewFile = () => {
    setPreview(null);
    setResult(null);
    setRollback(null);
    setError(null);
    setProblemsOnly(false);
  };

  const validate = useCallback(
    async (rowsToValidate: LicenseImportRow[], options?: { strict?: boolean }) => {
      if (!rowsToValidate.length) return;
      setValidating(true);
      setError(null);
      try {
        const response = await LicenseService.previewLicenseImport(rowsToValidate, {
          strict: options?.strict ?? strict,
        });
        setPreview(response);
        setResult(null);
        setRollback(null);
      } catch (validationError: any) {
        setPreview(null);
        setError(validationError?.message || 'Could not validate the file.');
      } finally {
        setValidating(false);
      }
    },
    [strict],
  );

  const parseFile = useCallback(
    async (file: File) => {
      resetForNewFile();
      setValidating(true);
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) throw new Error('The file does not contain any sheet.');
        const sheet = workbook.Sheets[firstSheetName];
        const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        // Check the columns before looking at the data, so a file built from the
        // wrong template is called out immediately rather than row by row.
        const headers = parsed.length ? Object.keys(parsed[0]) : [];
        setMissingRequired(findMissingRequiredFields(headers));

        // Drop fully blank rows so trailing empty spreadsheet rows are not errors.
        const cleaned = parsed.filter(row =>
          Object.values(row).some(value => String(value ?? '').trim() !== ''),
        );

        if (!cleaned.length) {
          setRows([]);
          setFileName(file.name);
          setError(
            `No data rows found in "${firstSheetName}". Fill in the Licenses sheet of the template and try again.`,
          );
          return;
        }

        setRows(cleaned);
        setFileName(file.name);
        await validate(cleaned);
      } catch (parseError: any) {
        setRows([]);
        setPreview(null);
        setMissingRequired([]);
        setError(parseError?.message || 'Could not read the file. Upload a .csv, .xlsx or .xls file.');
      } finally {
        setValidating(false);
      }
    },
    [validate],
  );

  const handleStrictChange = async (next: boolean) => {
    setStrict(next);
    if (rows.length) await validate(rows, { strict: next });
  };

  const handleDuplicateChange = async (next: 'fail' | 'skip') => {
    setOnDuplicate(next);
    if (rows.length) await validate(rows);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    setError(null);
    try {
      const response = await LicenseService.importLicenses(rows, {
        strict,
        onDuplicate,
        fileName: fileName ?? undefined,
      });
      setResult(response);
      setPreview(null);
      if (response.summary.imported > 0) onChanged?.();
    } catch (importError: any) {
      setError(importError?.message || 'The import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleRollback = async () => {
    if (!result?.batchId) return;
    const confirmed =
      typeof window === 'undefined' ||
      window.confirm(
        `Remove every license created by batch ${result.batchId}?\n\nLicenses that have since been renewed or cancelled will be kept.`,
      );
    if (!confirmed) return;

    setRollingBack(true);
    setError(null);
    try {
      const response = await LicenseService.rollbackLicenseImportBatch(result.batchId);
      setRollback(response);
      if (response.removedCount > 0) onChanged?.();
    } catch (rollbackError: any) {
      setError(rollbackError?.message || 'The rollback failed.');
    } finally {
      setRollingBack(false);
    }
  };

  const clearFile = () => {
    setRows([]);
    setFileName(null);
    setMissingRequired([]);
    resetForNewFile();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const visiblePreviewRows = useMemo(() => {
    if (!preview) return [];
    const filtered = problemsOnly
      ? preview.rows.filter(row => row.status === 'error' || row.status === 'warning' || row.status === 'skipped')
      : preview.rows;
    return filtered.slice(0, PREVIEW_ROW_LIMIT);
  }, [preview, problemsOnly]);

  const downloadPreviewReport = () => {
    if (!preview) return;
    downloadCsv(
      `license-import-issues-${fileName ?? 'report'}.csv`,
      ['Row', 'Status', 'License Number', 'Holder', 'District', 'State', 'Errors', 'Warnings'],
      preview.rows.map(row => [
        row.rowNumber,
        row.status,
        row.display.licenseNumber ?? '',
        row.display.holderName ?? '',
        row.display.district ?? '',
        row.display.state ?? '',
        row.errors.join(' | '),
        row.warnings.join(' | '),
      ]),
    );
  };

  const downloadResultReport = () => {
    if (!result) return;
    downloadCsv(
      `license-import-result-${result.batchId}.csv`,
      ['Row', 'Status', 'License ID', 'License Number', 'Errors', 'Warnings'],
      result.results.map(row => [
        row.rowNumber,
        row.status,
        row.licenseId ?? '',
        row.licenseNumber ?? '',
        row.errors.join(' | '),
        row.warnings.join(' | '),
      ]),
    );
  };

  const hasResult = !!result;
  const importable = preview?.summary.importable ?? 0;

  return (
    <div className='flex-1 min-h-0 overflow-auto p-4 sm:p-6'>
      {/* Header / picker ---------------------------------------------------- */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3'>
          <div>
            <h2 className='flex items-center gap-2 text-base font-semibold text-gray-900'>
              <FileSpreadsheet className='h-4 w-4 text-[#001F54]' />
              Bulk License Import
            </h2>
            <p className='mt-1 max-w-3xl text-xs text-gray-500'>
              Upload a CSV or XLSX file to validate and import licenses in one go. Every row is checked
              server-side — required fields, dates, enum values, the state → district → range office → zone →
              division → police station hierarchy and duplicate license numbers — before anything is saved.
              Imports are scoped to your jurisdiction and recorded against your login.
            </p>
          </div>
          <button
            type='button'
            onClick={downloadLicenseImportTemplate}
            className='inline-flex items-center gap-2 rounded-md border border-[#001F54] px-3 py-2 text-xs font-medium text-[#001F54] hover:bg-[#001F54]/5'
          >
            <Download className='h-3.5 w-3.5' />
            Download Template
          </button>
        </div>

        <div className='p-4'>
          <div
            onDragOver={event => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={event => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void parseFile(file);
            }}
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragging ? 'border-[#001F54] bg-[#001F54]/5' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <Upload className='mx-auto h-8 w-8 text-gray-400' />
            <p className='mt-2 text-sm text-gray-600'>
              Drag and drop your file here, or{' '}
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='font-medium text-[#001F54] underline'
              >
                choose a file
              </button>
            </p>
            <p className='mt-1 text-xs text-gray-400'>Accepted formats: .csv, .xlsx, .xls</p>
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              className='hidden'
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) void parseFile(file);
              }}
            />

            {fileName && (
              <div className='mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-gray-700 shadow-sm'>
                <span className='font-medium'>{fileName}</span>
                <span className='text-gray-400'>{rows.length} row(s)</span>
                <button
                  type='button'
                  onClick={clearFile}
                  className='text-gray-400 hover:text-red-600'
                  title='Remove this file'
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Options -------------------------------------------------------- */}
          <div className='mt-3 flex flex-wrap items-center gap-4'>
            <label className='inline-flex items-center gap-2 text-xs text-gray-700'>
              <input
                type='checkbox'
                checked={strict}
                onChange={event => void handleStrictChange(event.target.checked)}
                className='h-3.5 w-3.5 rounded border-gray-300'
              />
              Block rows that only have warnings
            </label>

            <label className='inline-flex items-center gap-2 text-xs text-gray-700'>
              If a license number already exists:
              <select
                value={onDuplicate}
                onChange={event => void handleDuplicateChange(event.target.value as 'fail' | 'skip')}
                className='rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700'
              >
                <option value='fail'>Report as an error</option>
                <option value='skip'>Skip the row</option>
              </select>
            </label>

            {rows.length > 0 && (
              <button
                type='button'
                onClick={() => void validate(rows)}
                disabled={validating}
                className='inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                <RefreshCw className={`h-3.5 w-3.5 ${validating ? 'animate-spin' : ''}`} />
                Re-validate
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className='mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
          <AlertTriangle className='mt-0.5 h-4 w-4 flex-none' />
          <span>{error}</span>
        </div>
      )}

      {missingRequired.length > 0 && !hasResult && (
        <div className='mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
          <AlertTriangle className='mt-0.5 h-4 w-4 flex-none' />
          <span>
            This file is missing required column(s):{' '}
            <span className='font-semibold'>{missingRequired.join(', ')}</span>. Rows without them will be
            rejected during validation — download the template to get the expected headers.
          </span>
        </div>
      )}

      {/* Validation summary + preview --------------------------------------- */}
      {validating && !preview && (
        <div className='mt-3 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm'>
          <div className='mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-b-2 border-[#001F54]' />
          Validating {rows.length} row(s)…
        </div>
      )}

      {preview && !hasResult && (
        <div className='mt-3 rounded-xl border border-gray-200 bg-white shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3'>
            <div className='flex flex-wrap items-center gap-2 text-xs'>
              <span className='font-semibold text-gray-800'>Validation result</span>
              <span className='rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700'>
                {preview.summary.valid} ready
              </span>
              <span className='rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700'>
                {preview.summary.warnings} with warnings
              </span>
              <span className='rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700'>
                {preview.summary.errors} with errors
              </span>
              {preview.summary.skipped > 0 && (
                <span className='rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600'>
                  {preview.summary.skipped} skipped
                </span>
              )}
              {preview.scope.stateName && (
                <span className='inline-flex items-center gap-1 rounded-full bg-[#001F54]/10 px-2 py-0.5 font-medium text-[#001F54]'>
                  <ShieldCheck className='h-3 w-3' />
                  Scoped to {preview.scope.stateName}
                </span>
              )}
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <label className='inline-flex items-center gap-1.5 text-xs text-gray-600'>
                <input
                  type='checkbox'
                  checked={problemsOnly}
                  onChange={event => setProblemsOnly(event.target.checked)}
                  className='h-3.5 w-3.5 rounded border-gray-300'
                />
                Show only problems
              </label>
              <button
                type='button'
                onClick={downloadPreviewReport}
                className='inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50'
              >
                <Download className='h-3.5 w-3.5' />
                Issue report
              </button>
              <button
                type='button'
                onClick={() => void handleImport()}
                disabled={importing || importable === 0}
                className='inline-flex items-center gap-2 rounded-md bg-[#001F54] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#012a73] disabled:opacity-50'
              >
                {importing ? (
                  <>
                    <RefreshCw className='h-3.5 w-3.5 animate-spin' />
                    Importing…
                  </>
                ) : (
                  <>
                    <Upload className='h-3.5 w-3.5' />
                    Import {importable} row(s)
                  </>
                )}
              </button>
            </div>
          </div>

          <div className='max-h-[420px] overflow-auto'>
            <table className='w-full min-w-[900px] border-separate border-spacing-0 text-sm'>
              <thead className='sticky top-0 z-10 bg-[#001F54] text-left text-xs uppercase tracking-wide text-white'>
                <tr>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>Row</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>License Number</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>Holder</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>District</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>State</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>Status</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>Issues</th>
                </tr>
              </thead>
              <tbody>
                {visiblePreviewRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='px-3 py-8 text-center text-gray-500'>
                      No rows match the current filter.
                    </td>
                  </tr>
                ) : (
                  visiblePreviewRows.map(row => {
                    const style = STATUS_STYLES[row.status] ?? STATUS_STYLES.warning;
                    const Icon = style.icon;
                    return (
                      <tr key={row.rowNumber} className='align-top odd:bg-white even:bg-gray-50'>
                        <td className='border-b border-gray-100 px-3 py-2 text-gray-500'>{row.rowNumber}</td>
                        <td className='border-b border-gray-100 px-3 py-2 text-gray-800'>
                          {row.display.licenseNumber ?? '-'}
                        </td>
                        <td className='border-b border-gray-100 px-3 py-2 text-gray-700'>
                          {row.display.holderName ?? '-'}
                        </td>
                        <td className='border-b border-gray-100 px-3 py-2 text-gray-700'>
                          {row.display.district ?? '-'}
                        </td>
                        <td className='border-b border-gray-100 px-3 py-2 text-gray-700'>
                          {row.display.state ?? '-'}
                        </td>
                        <td className='border-b border-gray-100 px-3 py-2'>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style.chip}`}
                          >
                            <Icon className='h-3 w-3' />
                            {style.label}
                          </span>
                        </td>
                        <td className='border-b border-gray-100 px-3 py-2'>
                          <ul className='space-y-1'>
                            {row.errors.map(message => (
                              <li key={message} className='text-xs text-red-700'>
                                • {message}
                              </li>
                            ))}
                            {row.warnings.map(message => (
                              <li key={message} className='text-xs text-amber-700'>
                                • {message}
                              </li>
                            ))}
                            {!row.errors.length && !row.warnings.length && (
                              <li className='text-xs text-gray-400'>No issues</li>
                            )}
                          </ul>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className='border-t border-gray-100 px-4 py-2 text-xs text-gray-500'>
            Showing {visiblePreviewRows.length} of {preview.summary.total} row(s)
            {visiblePreviewRows.length === PREVIEW_ROW_LIMIT ? ' — refine the filter or use the issue report for the full list.' : '.'}
            {strict && ' Strict mode is on: rows with warnings will not be imported.'}
          </div>
        </div>
      )}

      {/* Import result ------------------------------------------------------ */}
      {hasResult && result && (
        <div className='mt-3 rounded-xl border border-gray-200 bg-white shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3'>
            <div className='flex flex-wrap items-center gap-2 text-xs'>
              <span className='font-semibold text-gray-800'>Import result</span>
              <span className='rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700'>
                {result.summary.imported} imported
              </span>
              <span className='rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700'>
                {result.summary.failed} failed
              </span>
              {result.summary.skipped > 0 && (
                <span className='rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600'>
                  {result.summary.skipped} skipped
                </span>
              )}
              {result.summary.rejectedByStrictMode > 0 && (
                <span className='rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700'>
                  {result.summary.rejectedByStrictMode} blocked
                </span>
              )}
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                onClick={downloadResultReport}
                className='inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50'
              >
                <Download className='h-3.5 w-3.5' />
                Result report
              </button>
              {onViewLicenses && (
                <button
                  type='button'
                  onClick={onViewLicenses}
                  className='inline-flex items-center gap-1.5 rounded-md border border-[#001F54] px-2.5 py-1.5 text-xs font-medium text-[#001F54] hover:bg-[#001F54]/5'
                >
                  View licenses
                </button>
              )}
              {result.summary.imported > 0 && !rollback && (
                <button
                  type='button'
                  onClick={() => void handleRollback()}
                  disabled={rollingBack}
                  className='inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50'
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${rollingBack ? 'animate-spin' : ''}`} />
                  {rollingBack ? 'Rolling back…' : 'Roll back this batch'}
                </button>
              )}
            </div>
          </div>

          <div className='px-4 py-2 text-xs text-gray-500'>
            Batch <span className='font-mono text-gray-700'>{result.batchId}</span>
            {result.fileName ? ` from ${result.fileName}` : ''} · imported{' '}
            {new Date(result.importedAt).toLocaleString('en-IN')}
            {result.scope.stateName ? ` · scoped to ${result.scope.stateName}` : ''}
          </div>

          {rollback && (
            <div className='mx-4 mb-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700'>
              <p className='font-medium text-gray-800'>{rollback.message}</p>
              {rollback.removed.length > 0 && (
                <p className='mt-1'>
                  Removed: {rollback.removed.map(item => item.licenseNumber).join(', ')}
                </p>
              )}
              {rollback.skipped.length > 0 && (
                <ul className='mt-1 space-y-0.5'>
                  {rollback.skipped.map(item => (
                    <li key={item.id} className='text-amber-700'>
                      Kept {item.licenseNumber} — {item.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className='max-h-[360px] overflow-auto border-t border-gray-100'>
            <table className='w-full min-w-[760px] border-separate border-spacing-0 text-sm'>
              <thead className='sticky top-0 z-10 bg-[#001F54] text-left text-xs uppercase tracking-wide text-white'>
                <tr>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>Row</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>Status</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>License</th>
                  <th className='border-b border-[#001F54] px-3 py-2 font-semibold'>Details</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map(row => {
                  const style = STATUS_STYLES[row.status] ?? STATUS_STYLES.warning;
                  const Icon = style.icon;
                  return (
                    <tr key={row.rowNumber} className='align-top odd:bg-white even:bg-gray-50'>
                      <td className='border-b border-gray-100 px-3 py-2 text-gray-500'>{row.rowNumber}</td>
                      <td className='border-b border-gray-100 px-3 py-2'>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style.chip}`}
                        >
                          <Icon className='h-3 w-3' />
                          {style.label}
                        </span>
                      </td>
                      <td className='border-b border-gray-100 px-3 py-2 text-gray-800'>
                        {row.licenseNumber ?? '-'}
                        {row.licenseId ? <span className='text-gray-400'> (#{row.licenseId})</span> : null}
                      </td>
                      <td className='border-b border-gray-100 px-3 py-2'>
                        <ul className='space-y-1'>
                          {row.errors.map(message => (
                            <li key={message} className='text-xs text-red-700'>
                              • {message}
                            </li>
                          ))}
                          {row.warnings.map(message => (
                            <li key={message} className='text-xs text-amber-700'>
                              • {message}
                            </li>
                          ))}
                          {!row.errors.length && !row.warnings.length && (
                            <li className='text-xs text-gray-400'>Saved successfully</li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state -------------------------------------------------------- */}
      {!preview && !hasResult && !validating && !error && (
        <div className='mt-3 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 shadow-sm'>
          <FileSpreadsheet className='mx-auto h-8 w-8 text-gray-300' />
          <p className='mt-2'>
            Download the template, fill in the <span className='font-medium'>Licenses</span> sheet, then upload it
            here. See the <span className='font-medium'>Instructions</span> sheet for accepted values.
          </p>
        </div>
      )}
    </div>
  );
}
