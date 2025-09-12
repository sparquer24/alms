"use client";

import React from 'react';
import { LocationService, BasicItem, LocationSelection } from '../services/locations';

type Props = {
  value?: LocationSelection;
  onChange?: (sel: LocationSelection) => void;
  labels?: Partial<Record<'state' | 'district' | 'zone' | 'division' | 'station', string>>;
  requiredLevels?: Array<'state' | 'district' | 'zone' | 'division' | 'station'>;
  className?: string;
  disabled?: boolean;
  tooltipMessages?: Partial<Record<'state' | 'district' | 'zone' | 'division' | 'station', string>>;
  tooltipAutoHideMs?: number;
};

const defaultLabels = {
  state: 'State',
  district: 'District',
  zone: 'Zone',
  division: 'Division',
  station: 'Police Station',
};

export default function CascadingLocationSelect({
  value,
  onChange,
  labels,
  requiredLevels = ['state', 'district', 'zone', 'division', 'station'],
  className,
  disabled,
  tooltipMessages,
  tooltipAutoHideMs = 2200,
}: Props) {
  const lbl = { ...defaultLabels, ...(labels || {}) };

  const [states, setStates] = React.useState<BasicItem[]>([]);
  const [districts, setDistricts] = React.useState<BasicItem[]>([]);
  const [zones, setZones] = React.useState<BasicItem[]>([]);
  const [divisions, setDivisions] = React.useState<BasicItem[]>([]);
  const [stations, setStations] = React.useState<BasicItem[]>([]);

  const [sel, setSel] = React.useState<LocationSelection>(value || {});
  type Level = 'state'|'district'|'zone'|'division'|'station';
  const [tip, setTip] = React.useState<{ level: Level | null; message: string } | null>(null);
  const tipTimer = React.useRef<number | null>(null);

  const msgFor = (level: Level) => {
    if (tooltipMessages && tooltipMessages[level]) return tooltipMessages[level] as string;
    switch (level) {
      case 'district': return `Please select ${lbl.state} before ${lbl.district}.`;
      case 'zone': return `Please select ${lbl.district} before ${lbl.zone}.`;
      case 'division': return `Please select ${lbl.zone} before ${lbl.division}.`;
      case 'station': return `Please select ${lbl.division} before ${lbl.station}.`;
      case 'state':
      default: return `Start by selecting ${lbl.state}.`;
    }
  };

  const showTip = (level: Level, persist?: boolean) => {
    setTip({ level, message: msgFor(level) });
    if (tipTimer.current) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
    if (!persist) {
      tipTimer.current = window.setTimeout(() => setTip(null), tooltipAutoHideMs);
    }
  };

  const hideTip = () => {
    if (tipTimer.current) {
      window.clearTimeout(tipTimer.current);
      tipTimer.current = null;
    }
    setTip(null);
  };

  React.useEffect(() => () => {
    if (tipTimer.current) window.clearTimeout(tipTimer.current);
  }, []);

  // Keep internal selection in sync when parent supplies/updates a value
  React.useEffect(() => {
    if (!value) return;
    const same =
      sel.state?.id === value.state?.id &&
      sel.district?.id === value.district?.id &&
      sel.zone?.id === value.zone?.id &&
      sel.division?.id === value.division?.id &&
      sel.station?.id === value.station?.id;
    if (!same) setSel(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.state?.id, value?.district?.id, value?.zone?.id, value?.division?.id, value?.station?.id]);

  React.useEffect(() => {
    (async () => {
      const s = await LocationService.getStates();
      setStates(s);
    })();
  }, []);

  // load districts when state changes
  React.useEffect(() => {
    (async () => {
      if (!sel.state?.id) { setDistricts([]); return; }
      const d = await LocationService.getDistricts(sel.state.id);
      setDistricts(d);
    })();
  }, [sel.state?.id]);

  // load zones when district changes
  React.useEffect(() => {
    (async () => {
      if (!sel.district?.id) { setZones([]); return; }
      const z = await LocationService.getZones({ districtId: sel.district.id, stateId: sel.state?.id });
      setZones(z);
    })();
  }, [sel.district?.id, sel.state?.id]);

  // load divisions when zone changes
  React.useEffect(() => {
    (async () => {
      if (!sel.zone?.id) { setDivisions([]); return; }
      const dv = await LocationService.getDivisions({ zoneId: sel.zone.id, districtId: sel.district?.id });
      setDivisions(dv);
    })();
  }, [sel.zone?.id, sel.district?.id]);

  // load stations when division changes
  React.useEffect(() => {
    (async () => {
      if (!sel.division?.id && !sel.zone?.id) { setStations([]); return; }
      const st = await LocationService.getStations({ divisionId: sel.division?.id, zoneId: sel.zone?.id });
      setStations(st);
    })();
  }, [sel.division?.id, sel.zone?.id]);

  React.useEffect(() => {
    if (onChange) onChange(sel);
  }, [sel]);

  // Helpers
  const opt = (list: BasicItem[]) => list.map(i => (
    <option key={i.id} value={i.id}>{i.name}</option>
  ));

  const isReq = (k: string) => requiredLevels.includes(k as any);

  return (
    <div className={className}>
      {/* State */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">{lbl.state}{isReq('state') && ' *'}</label>
        <select
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          disabled={disabled}
          value={sel.state?.id ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value || 0);
            const item = states.find(s => s.id === id) || null;
            setSel({ state: item, district: null, zone: null, division: null, station: null });
          }}
        >
          <option value="">Select {lbl.state}</option>
          {opt(states)}
        </select>
      </div>

      {/* District */}
      <div className="mb-3 relative">
        <label className="block text-sm font-medium text-gray-700">{lbl.district}{isReq('district') && ' *'}</label>
        <select
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          disabled={disabled}
          value={sel.district?.id ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value || 0);
            const item = districts.find(s => s.id === id) || null;
            setSel(prev => ({ ...prev, district: item, zone: null, division: null, station: null }));
          }}
        >
          <option value="">Select {lbl.district}</option>
          {opt(districts)}
        </select>
    {(disabled || !sel.state) && (
          <div
            className="absolute inset-0 bg-transparent cursor-default"
            onMouseEnter={() => showTip('district', true)}
            onMouseLeave={hideTip}
            aria-hidden="true"
          />
        )}
        {tip?.level === 'district' && (
          <div className="absolute top-full left-0 mt-1 z-10 text-xs text-white bg-black/90 px-2 py-1 rounded shadow">
            {tip.message}
          </div>
        )}
      </div>

      {/* Zone */}
      <div className="mb-3 relative">
        <label className="block text-sm font-medium text-gray-700">{lbl.zone}{isReq('zone') && ' *'}</label>
        <select
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          disabled={disabled}
          value={sel.zone?.id ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value || 0);
            const item = zones.find(s => s.id === id) || null;
            setSel(prev => ({ ...prev, zone: item, division: null, station: null }));
          }}
        >
          <option value="">Select {lbl.zone}</option>
          {opt(zones)}
        </select>
    {(disabled || !sel.district) && (
          <div
            className="absolute inset-0 bg-transparent cursor-default"
            onMouseEnter={() => showTip('zone', true)}
            onMouseLeave={hideTip}
            aria-hidden="true"
          />
        )}
        {tip?.level === 'zone' && (
          <div className="absolute top-full left-0 mt-1 z-10 text-xs text-white bg-black/90 px-2 py-1 rounded shadow">
            {tip.message}
          </div>
        )}
      </div>

      {/* Division */}
      <div className="mb-3 relative">
        <label className="block text-sm font-medium text-gray-700">{lbl.division}{isReq('division') && ' *'}</label>
        <select
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          disabled={disabled}
          value={sel.division?.id ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value || 0);
            const item = divisions.find(s => s.id === id) || null;
            setSel(prev => ({ ...prev, division: item, station: null }));
          }}
        >
          <option value="">Select {lbl.division}</option>
          {opt(divisions)}
        </select>
    {(disabled || !sel.zone) && (
          <div
            className="absolute inset-0 bg-transparent cursor-default"
            onMouseEnter={() => showTip('division', true)}
            onMouseLeave={hideTip}
            aria-hidden="true"
          />
        )}
        {tip?.level === 'division' && (
          <div className="absolute top-full left-0 mt-1 z-10 text-xs text-white bg-black/90 px-2 py-1 rounded shadow">
            {tip.message}
          </div>
        )}
      </div>

      {/* Station */}
      <div className="mb-1 relative">
        <label className="block text-sm font-medium text-gray-700">{lbl.station}{isReq('station') && ' *'}</label>
        <select
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          disabled={disabled}
          value={sel.station?.id ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value || 0);
            const item = stations.find(s => s.id === id) || null;
            setSel(prev => ({ ...prev, station: item }));
          }}
        >
          <option value="">Select {lbl.station}</option>
          {opt(stations)}
        </select>
    {(disabled || !sel.division) && (
          <div
            className="absolute inset-0 bg-transparent cursor-default"
            onMouseEnter={() => showTip('station', true)}
            onMouseLeave={hideTip}
            aria-hidden="true"
          />
        )}
        {tip?.level === 'station' && (
          <div className="absolute top-full left-0 mt-1 z-10 text-xs text-white bg-black/90 px-2 py-1 rounded shadow">
            {tip.message}
          </div>
        )}
      </div>
    </div>
  );
}
