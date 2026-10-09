'use client';

import React from 'react';
import { GitCompare, CheckCircle2 } from 'lucide-react';
import { humanize } from '@/utils/formatters';
import { areaOfValidityLabel } from '@/utils/areaOfValidity';

type Row = { label: string; current: string; renewal: string };

const text = (v: unknown): string => (v == null ? '' : String(v).trim());
const same = (a: string, b: string) =>
  a.replace(/\s+/g, ' ').toLowerCase() === b.replace(/\s+/g, ' ').toLowerCase();

/**
 * Fields a renewal changes on the license when approved (see
 * updateLicenseFromRenewalApproval in the backend workflow service). Identity, weapons
 * and arms category are locked, so they never differ. A renewal value only counts
 * when it is filled in, matching how approval applies it.
 */
const buildRows = (renewal: any, license: any): Row[] => {
  const rows: Row[] = [];
  const add = (
    label: string,
    currentValue: unknown,
    renewalValue: unknown,
    format: (v: string) => string = v => v
  ) => {
    const r = text(renewalValue);
    if (!r) return;
    const c = text(currentValue);
    if (same(c, r)) return;
    rows.push({ label, current: c ? format(c) : '—', renewal: format(r) });
  };
  // Location changes are compared by id, but shown by name.
  const addLocation = (
    label: string,
    currentId: unknown,
    currentName: unknown,
    renewalId: unknown,
    renewalName: unknown
  ) => {
    if (renewalId == null || String(renewalId) === String(currentId ?? '')) return;
    rows.push({
      label,
      current: text(currentName) || (currentId != null ? `#${currentId}` : '—'),
      renewal: text(renewalName) || `#${renewalId}`,
    });
  };

  for (const kind of ['present', 'permanent'] as const) {
    const addr = renewal?.[`${kind}Address`];
    if (!addr) continue;
    const prefix = kind === 'present' ? 'Present' : 'Permanent';
    add(`${prefix} address`, license?.[`${kind}AddressLine`], addr.addressLine);
    addLocation(
      `${prefix} district`,
      license?.[`${kind}DistrictId`],
      license?.[`${kind}DistrictName`],
      addr.districtId,
      addr.district?.name
    );
    addLocation(
      `${prefix} police station`,
      license?.[`${kind}PoliceStationId`],
      license?.[`${kind}PoliceStationName`],
      addr.policeStationId,
      addr.policeStation?.name
    );
  }

  const occ = renewal?.occupationAndBusiness;
  add('Occupation', license?.occupation ?? license?.occupationAndBusiness?.occupation, occ?.occupation);
  add(
    'Office address',
    license?.officeAddress ?? license?.occupationAndBusiness?.officeAddress,
    occ?.officeAddress
  );

  const ld = Array.isArray(renewal?.licenseDetails) ? renewal.licenseDetails[0] : renewal?.licenseDetails;
  add('Need for license', license?.needForLicense, ld?.needForLicense, humanize);
  add('Area of validity', license?.areaOfValidity, ld?.areaOfValidity, (v: string) => areaOfValidityLabel(v) || v);
  add('Ammunition', license?.ammunitionDescription, ld?.ammunitionDescription);
  add('Place / area of license', license?.licencePlaceArea, ld?.licencePlaceArea);
  add('Special consideration', license?.specialConsiderationReason, ld?.specialConsiderationReason);

  return rows;
};

/**
 * What this renewal will change on the license, so the officer does not have to
 * compare the Renewal Info and Original License tabs by eye.
 */
export default function RenewalChangesCard({ renewal, license }: { renewal: any; license: any }) {
  const rows = React.useMemo(() => buildRows(renewal, license), [renewal, license]);

  if (rows.length === 0) {
    return (
      <div className='flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4'>
        <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600' />
        <div>
          <p className='text-sm font-semibold text-emerald-900'>No changes from the current license</p>
          <p className='text-xs text-emerald-800'>
            Approving this renewal only extends the license validity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm'>
      <div className='flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3'>
        <GitCompare className='h-5 w-5 text-amber-700' />
        <div>
          <h3 className='text-sm font-bold text-slate-900'>
            Changes from the current license ({rows.length})
          </h3>
          <p className='text-xs text-slate-600'>These values will replace the license record when approved.</p>
        </div>
      </div>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-left text-sm'>
          <thead className='bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500'>
            <tr>
              <th className='px-5 py-2'>Field</th>
              <th className='px-5 py-2'>Current license</th>
              <th className='px-5 py-2'>This renewal</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {rows.map(row => (
              <tr key={row.label} className='align-top'>
                <td className='whitespace-nowrap px-5 py-2.5 font-medium text-slate-700'>{row.label}</td>
                <td className='px-5 py-2.5 text-slate-500 line-through decoration-slate-300'>{row.current}</td>
                <td className='px-5 py-2.5 font-semibold text-slate-900'>{row.renewal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
