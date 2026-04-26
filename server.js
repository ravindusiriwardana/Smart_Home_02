import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';

const API_BASE = 'http://localhost:3001/api/analytics';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:           '#06090f',
  surface:      '#0c1119',
  surfaceAlt:   '#101620',
  panel:        '#141d2c',
  border:       '#18253a',
  borderLight:  '#1e2f47',
  accent:       '#00c8f0',
  accentSoft:   'rgba(0,200,240,0.09)',
  green:        '#05d89c',
  greenSoft:    'rgba(5,216,156,0.09)',
  amber:        '#f5a623',
  amberSoft:    'rgba(245,166,35,0.09)',
  coral:        '#f06060',
  coralSoft:    'rgba(240,96,96,0.09)',
  purple:       '#9b7ff4',
  purpleSoft:   'rgba(155,127,244,0.09)',
  pink:         '#e879a8',
  pinkSoft:     'rgba(232,121,168,0.09)',
  teal:         '#2dd4bf',
  tealSoft:     'rgba(45,212,191,0.09)',
  txt:          '#dde6f5',
  txtSub:       '#4a6080',
  txtMuted:     '#253040',
};

const PALETTE = [
  C.accent, C.green, C.amber, C.coral, C.purple,
  C.pink, C.teal, '#f97316', '#a3e635', '#facc15',
  '#34d399', '#60a5fa', '#e879f9', '#fb923c',
];

// ─── Tab + area config ──────────────────────────────────────────────────────
const AREA_TABS = [
  { id: 'living_room',  label: 'Living Room',  icon: '🛋',  color: C.accent,  keys: ['Living room [kW]'] },
  { id: 'kitchen',      label: 'Kitchen',      icon: '🍳',  color: C.amber,   keys: ['Kitchen 12 [kW]', 'Kitchen 14 [kW]', 'Kitchen 38 [kW]'] },
  { id: 'garage',       label: 'Garage',       icon: '🚗',  color: C.green,   keys: ['Garage door [kW]'] },
  { id: 'home_office',  label: 'Home Office',  icon: '💻',  color: C.purple,  keys: ['Home office [kW]'] },
  { id: 'furnace',      label: 'Furnace',      icon: '🔥',  color: C.coral,   keys: ['Furnace 1 [kW]', 'Furnace 2 [kW]'] },
  { id: 'fridge',       label: 'Fridge',       icon: '🧊',  color: C.teal,    keys: ['Fridge [kW]'] },
  { id: 'microwave',    label: 'Microwave',    icon: '📡',  color: C.pink,    keys: ['Microwave [kW]'] },
];

const TOP_TABS = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  ...AREA_TABS,
  { id: 'solar',    label: 'Solar',    icon: '☀',  color: C.amber  },
  { id: 'weather',  label: 'Weather',  icon: '🌡',  color: C.purple },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const f2   = (v)    => v == null ? '—' : Number(v).toFixed(2);
const f4   = (v)    => v == null ? '—' : Number(v).toFixed(4);
const f1   = (v)    => v == null ? '—' : Number(v).toFixed(1);
const pct  = (v)    => `${f1(v)}%`;
const num  = (v)    => v == null ? '—' : Number(v).toLocaleString();
const hFmt = (h)    => `${String(h).padStart(2,'0')}:00`;

// ─── Shared UI ─────────────────────────────────────────────────────────────────
const tt = {
  contentStyle: {
    background: C.panel,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 8,
    fontSize: 12,
    color: C.txt,
    padding: '9px 13px',
  },
  labelStyle: { color: C.txtSub, marginBottom: 3 },
  cursor: { fill: 'rgba(255,255,255,0.025)' },
};

function Card({ children, style = {}, accent = null }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '1.2rem',
      ...(accent ? { borderTop: `2px solid ${accent}` } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, unit = '', sub = '', color = C.accent, icon }) {
  return (
    <div style={{
      background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '0.95rem 1.1rem',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
        <span style={{ fontSize: 9.5, color: C.txtSub, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: C.txt, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 11, color: C.txtSub, marginLeft: 4, fontWeight: 400 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.txtSub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SecTitle({ children, color = C.accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
      <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: C.txtSub, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {children}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: 13 }}>
      {[95, 70, 85, 55, 75].map((w, i) => (
        <div key={i} style={{
          height: 12, width: `${w}%`, borderRadius: 6,
          background: `linear-gradient(90deg,${C.border} 25%,${C.panel} 50%,${C.border} 75%)`,
          backgroundSize: '200% 100%',
          animation: `shimmer 1.4s infinite ${i * 0.1}s`,
        }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

function Err({ msg }) {
  return (
    <div style={{ background: C.coralSoft, border: `1px solid ${C.coral}44`, borderRadius: 10, padding: '0.9rem 1.1rem', color: C.coral, fontSize: 13 }}>
      ⚠ {msg}
    </div>
  );
}

// ─── Date filter pill row ────────────────────────────────────────────────────
function DatePills({ dates, selected, onChange, color = C.accent }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.15rem', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: C.txtSub, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 2 }}>Filter</span>
      {['all', ...dates].map((d) => {
        const active = selected === d;
        return (
          <button key={d} onClick={() => onChange(d)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            fontWeight: active ? 600 : 400,
            background: active ? `${color}1a` : 'transparent',
            color:  active ? color : C.txtSub,
            border: `1px solid ${active ? `${color}55` : C.border}`,
            transition: 'all 0.14s',
          }}>
            {d === 'all' ? 'All dates' : d}
          </button>
        );
      })}
    </div>
  );
}

// gradient defs reused by area charts
function AreaGradDef({ id, color }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
        <stop offset="95%" stopColor={color} stopOpacity={0.01} />
      </linearGradient>
    </defs>
  );
}

// ─── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewView({ data, loading, error }) {
  if (loading) return <Skeleton />;
  if (error)   return <Err msg={error} />;
  if (!data)   return null;

  const { summary, daily, applianceTotals, areaSummary } = data;
  const maxApp = applianceTotals?.[0]?.total || 1;

  // Merge areaSummary totals into AREA_TABS for the area cards
  const areaCards = AREA_TABS.map((tab) => {
    const found = areaSummary?.find((a) => a.areaId === tab.id);
    return { ...tab, total: found?.total ?? 0 };
  }).sort((a, b) => b.total - a.total);

  return (
    <div>
      {/* KPI strip */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 9, marginBottom: '1.4rem' }}>
          <KpiCard label="Total Records"    value={num(summary.totalRecords)}          icon="📊" color={C.accent} />
          <KpiCard label="Consumption"      value={f2(summary.totalUse)}   unit="kW"   icon="⚡" color={C.coral}  />
          <KpiCard label="Solar Generated"  value={f2(summary.totalGen)}   unit="kW"   icon="☀" color={C.amber}  />
          <KpiCard label="Net from Grid"    value={f2(summary.netFromGrid)} unit="kW"  icon="🔌" color={C.green}  />
          <KpiCard label="Self-sufficiency" value={pct(summary.selfSufficiencyPct)}    icon="♻" color={C.green}  />
          <KpiCard label="Peak Use"         value={f2(summary.maxUse)}     unit="kW"   icon="▲" color={C.coral}  />
          <KpiCard label="Avg Temp"         value={f1(summary.avgTemp)}    unit="°F"   icon="🌡" color={C.amber}  />
          <KpiCard label="Avg Humidity"     value={pct(summary.avgHumidity)}           icon="💧" color={C.purple} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '1.2rem', marginBottom: '1.2rem' }}>
        {/* Daily consumption chart */}
        <Card>
          <SecTitle>Overall Home Consumption — Daily</SecTitle>
          {daily?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={daily}>
                <AreaGradDef id="ov_use" color={C.coral} />
                <AreaGradDef id="ov_gen" color={C.green} />
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
                <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="totalUse" name="Use (kW)"   stroke={C.coral} fill="url(#ov_use)" strokeWidth={2} />
                <Area type="monotone" dataKey="totalGen" name="Solar (kW)" stroke={C.green} fill="url(#ov_gen)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Skeleton />}
        </Card>

        {/* Top 10 appliances */}
        <Card>
          <SecTitle color={C.amber}>Top 10 Appliances</SecTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {applianceTotals?.map((a, i) => (
              <div key={a.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: i < 3 ? C.txt : C.txtSub, fontWeight: i < 3 ? 600 : 400 }}>
                    <span style={{ color: PALETTE[i], marginRight: 6, fontSize: 10 }}>#{i + 1}</span>
                    {a.name}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "'Space Mono',monospace", color: PALETTE[i] }}>
                    {f2(a.total)}
                  </span>
                </div>
                <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(a.total / maxApp) * 100}%`,
                    background: PALETTE[i],
                    borderRadius: 2,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Area summary cards */}
      <SecTitle color={C.purple}>Usage by Area</SecTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 9 }}>
        {areaCards.map((a) => (
          <div key={a.id} style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '0.9rem 1.1rem',
            borderTop: `2px solid ${a.color}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 26 }}>{a.icon}</span>
            <div>
              <div style={{ fontSize: 10, color: C.txtSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                {a.label}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "'Space Mono',monospace", color: a.color }}>
                {f2(a.total)}<span style={{ fontSize: 11, color: C.txtSub, marginLeft: 3, fontWeight: 400 }}>kW</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AREA VIEW (Living Room, Kitchen, Garage, etc.) ───────────────────────────
function AreaView({ tab, data, loading, error, onDateChange, selectedDate, availableDates }) {
  if (loading) return <Skeleton />;
  if (error)   return <Err msg={error} />;
  if (!data)   return null;

  const { kpi, daily, hourly } = data;
  const isMultiKey = tab.keys.length > 1;
  const subKeyNames = tab.keys.map((k) => k.replace(' [kW]', ''));

  return (
    <div>
      {/* Date filter */}
      <DatePills dates={availableDates} selected={selectedDate} onChange={onDateChange} color={tab.color} />

      {/* KPI strip */}
      {kpi && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: '1.25rem' }}>
          <KpiCard label="Total Consumption" value={f2(kpi.total)}        unit="kW" color={tab.color} icon={tab.icon} />
          <KpiCard label="Avg per Record"    value={f4(kpi.avgPerRecord)} unit="kW" color={tab.color} />
          <KpiCard label="Peak Value"        value={f4(kpi.max)}          unit="kW" color={tab.color} />
          <KpiCard label="Share of House"    value={pct(kpi.shareOfHouse)}          color={tab.color} icon="🏠" sub="of total consumption" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
        {/* Daily total chart */}
        <Card accent={tab.color}>
          <SecTitle color={tab.color}>{tab.label} — Daily Total</SecTitle>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={daily}>
              <AreaGradDef id={`ag_${tab.id}`} color={tab.color} />
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <Tooltip {...tt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="total" name="Total (kW)" stroke={tab.color} fill={`url(#ag_${tab.id})`} strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Share of house per day */}
        <Card>
          <SecTitle color={tab.color}>Share of House (%)</SecTitle>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={daily} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 9, fill: C.txtSub }} />
              <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...tt} formatter={(v) => `${f1(v)}%`} />
              <Bar dataKey="shareOfHouse" name="Share %" radius={[3,3,0,0]}>
                {daily.map((_, i) => <Cell key={i} fill={tab.color} fillOpacity={0.7 + (i % 3) * 0.1} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Hourly pattern */}
      <Card style={{ marginBottom: '1.2rem' }}>
        <SecTitle color={tab.color}>Hourly Average Pattern</SecTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hourly}>
            <AreaGradDef id={`hg_${tab.id}`} color={tab.color} />
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="hour" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} tickFormatter={hFmt} />
            <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
            <Tooltip {...tt} labelFormatter={hFmt} />
            <Area type="monotone" dataKey="avg" name="Avg (kW)" stroke={tab.color} fill={`url(#hg_${tab.id})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Sub-appliance breakdown for multi-key areas (Kitchen, Furnace) */}
      {isMultiKey && (
        <Card>
          <SecTitle color={tab.color}>Sub-appliance Breakdown</SecTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Daily sub-key totals */}
            <div>
              <div style={{ fontSize: 11, color: C.txtSub, marginBottom: 10 }}>Daily totals per unit</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={daily} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 9, fill: C.txtSub }} />
                  <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
                  <Tooltip {...tt} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {subKeyNames.map((name, i) => (
                    <Bar key={name} dataKey={`sub_${name}`} name={name} fill={PALETTE[i]} radius={[3,3,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Hourly sub-key averages */}
            <div>
              <div style={{ fontSize: 11, color: C.txtSub, marginBottom: 10 }}>Hourly avg per unit</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="hour" stroke={C.txtMuted} tick={{ fontSize: 9, fill: C.txtSub }} tickFormatter={hFmt} />
                  <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
                  <Tooltip {...tt} labelFormatter={hFmt} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {subKeyNames.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={`sub_${name}`} name={name} stroke={PALETTE[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── SOLAR VIEW ───────────────────────────────────────────────────────────────
function SolarView({ data, loading, error, onDateChange, selectedDate, availableDates }) {
  if (loading) return <Skeleton />;
  if (error)   return <Err msg={error} />;
  if (!data)   return null;

  const best = [...data].sort((a, b) => b.selfSufficiencyPct - a.selfSufficiencyPct)[0];

  return (
    <div>
      <DatePills dates={availableDates} selected={selectedDate} onChange={onDateChange} color={C.amber} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, marginBottom: '1.25rem' }}>
        <KpiCard label="Avg Self-sufficiency" value={pct(data.reduce((s,d)=>s+d.selfSufficiencyPct,0)/(data.length||1))} color={C.green} icon="♻" />
        <KpiCard label="Best Day"             value={best?.date || '—'}       color={C.green}  icon="🏆" sub={`${pct(best?.selfSufficiencyPct)} sufficient`} />
        <KpiCard label="Total Solar"          value={f2(data.reduce((s,d)=>s+d.totalSolar,0))}          unit="kW" color={C.amber} icon="☀" />
        <KpiCard label="Total Grid Draw"      value={f2(data.reduce((s,d)=>s+Math.max(0,d.netFromGrid),0))} unit="kW" color={C.coral} icon="🔌" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
        <Card>
          <SecTitle color={C.amber}>Consumption vs Solar — Daily</SecTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <Tooltip {...tt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="totalConsumption" name="Consumption (kW)" fill={C.coral} radius={[3,3,0,0]} />
              <Bar dataKey="totalSolar"       name="Solar Gen (kW)"   fill={C.amber} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SecTitle color={C.green}>Self-sufficiency %</SecTitle>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <AreaGradDef id="ss_grad" color={C.green} />
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <YAxis stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} tickFormatter={(v) => `${v}%`} />
              <Tooltip {...tt} formatter={(v) => `${f1(v)}%`} />
              <Area type="monotone" dataKey="selfSufficiencyPct" name="Self-sufficiency" stroke={C.green} fill="url(#ss_grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ─── WEATHER VIEW ─────────────────────────────────────────────────────────────
function WeatherView({ data, loading, error, onDateChange, selectedDate, availableDates }) {
  if (loading) return <Skeleton />;
  if (error)   return <Err msg={error} />;
  if (!data)   return null;

  return (
    <div>
      <DatePills dates={availableDates} selected={selectedDate} onChange={onDateChange} color={C.purple} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <Card>
          <SecTitle color={C.amber}>Temperature vs Consumption</SecTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <YAxis yAxisId="l" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <YAxis yAxisId="r" orientation="right" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <Tooltip {...tt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="l" type="monotone" dataKey="avgUse"  name="Avg Use (kW)"  stroke={C.coral}  strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="avgTemp" name="Avg Temp (°F)" stroke={C.amber}  strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="maxTemp" name="Max Temp"      stroke={C.amber}  strokeWidth={1} dot={false} strokeDasharray="4 3" />
              <Line yAxisId="r" type="monotone" dataKey="minTemp" name="Min Temp"      stroke={C.accent} strokeWidth={1} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SecTitle color={C.purple}>Humidity & Wind vs Consumption</SecTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <YAxis yAxisId="l" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <YAxis yAxisId="r" orientation="right" stroke={C.txtMuted} tick={{ fontSize: 10, fill: C.txtSub }} />
              <Tooltip {...tt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="l" type="monotone" dataKey="avgUse"      name="Avg Use (kW)" stroke={C.coral}  strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="avgHumidity" name="Humidity (%)" stroke={C.purple} strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="avgWind"     name="Wind (mph)"   stroke={C.accent} strokeWidth={2} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <SecTitle color={C.teal}>Daily Weather Radar</SecTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '1rem' }}>
          {data.map((day) => {
            const rd = [
              { subject: 'Temp',     value: Math.min(100, (day.avgTemp / 120) * 100) },
              { subject: 'Humidity', value: day.avgHumidity },
              { subject: 'Wind',     value: Math.min(100, (day.avgWind / 30) * 100) },
              { subject: 'Cloud',    value: day.avgCloud },
              { subject: 'Use',      value: Math.min(100, (day.avgUse / 3) * 100) },
            ];
            return (
              <div key={day.date}>
                <div style={{ fontSize: 11, color: C.txtSub, textAlign: 'center', marginBottom: 3 }}>{day.date}</div>
                <ResponsiveContainer width="100%" height={170}>
                  <RadarChart data={rd}>
                    <PolarGrid stroke={C.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: C.txtSub }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke={C.teal} fill={C.tealSoft} strokeWidth={1.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Analytical() {
  const [activeTab, setActiveTab] = useState('overview');

  // overview data (fetched once)
  const [overview, setOverview]         = useState(null);
  const [overviewLoading, setOvLoading] = useState(false);
  const [overviewError, setOvError]     = useState(null);

  // per-tab state: { data, loading, error, selectedDate, availableDates }
  const [tabState, setTabState] = useState({});
  const fetched = useRef({});   // prevents duplicate fetches

  // ── fetch overview once ──────────────────────────────────────────────────
  useEffect(() => {
    if (fetched.current['overview']) return;
    fetched.current['overview'] = true;
    setOvLoading(true);
    fetch(`${API_BASE}/overview`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => setOverview(d))
      .catch((e) => setOvError(e.message))
      .finally(() => setOvLoading(false));
  }, []);

  // ── fetch for current tab ────────────────────────────────────────────────
  const fetchTab = useCallback((tabId, date = 'all') => {
    const cacheKey = `${tabId}__${date}`;
    if (fetched.current[cacheKey]) return;
    fetched.current[cacheKey] = true;

    setTabState((prev) => ({
      ...prev,
      [tabId]: { ...(prev[tabId] || {}), loading: true, error: null, selectedDate: date },
    }));

    let url;
    const qs = date !== 'all' ? `?date=${date}` : '';
    if (tabId === 'solar')   url = `${API_BASE}/solar${qs}`;
    else if (tabId === 'weather') url = `${API_BASE}/weather${qs}`;
    else                     url = `${API_BASE}/area/${tabId}${qs}`;

    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        // solar & weather return arrays; area returns an object with availableDates
        const availableDates = d.availableDates
          ?? (Array.isArray(d) ? d.map((x) => x.date) : []);

        setTabState((prev) => ({
          ...prev,
          [tabId]: {
            data: d,
            loading: false,
            error: null,
            selectedDate: date,
            availableDates,
          },
        }));
      })
      .catch((e) => {
        fetched.current[cacheKey] = false; // allow retry
        setTabState((prev) => ({
          ...prev,
          [tabId]: { ...(prev[tabId] || {}), loading: false, error: e.message },
        }));
      });
  }, []);

  // fetch on tab change (always fetch 'all' initially)
  useEffect(() => {
    if (activeTab === 'overview') return;
    const ts = tabState[activeTab];
    if (!ts) fetchTab(activeTab, 'all');
  }, [activeTab]);

  // handle date filter change from child
  const handleDateChange = useCallback((tabId, date) => {
    setTabState((prev) => ({ ...prev, [tabId]: { ...(prev[tabId] || {}), selectedDate: date } }));
    fetchTab(tabId, date);
  }, [fetchTab]);

  const ts = tabState[activeTab] || {};

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, fontFamily: "'DM Sans', sans-serif", padding: '1.5rem' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.4rem' }}>
        <div>
          <div style={{ fontSize: 10, color: C.txtMuted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 5 }}>
            Smart Home
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.txt, display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ color: C.accent, fontFamily: "'Space Mono',monospace" }}>◈</span>
            Energy Analytics
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 16, color: C.txt }}>
            {overview?.summary ? num(overview.summary.totalRecords) : '—'}
          </div>
          <div style={{ fontSize: 11, color: C.txtSub }}>total records</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 3, flexWrap: 'wrap',
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: '0.9rem', marginBottom: '1.4rem',
      }}>
        {TOP_TABS.map((t) => {
          const active = activeTab === t.id;
          const col    = t.color || C.accent;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: active ? 600 : 400,
              background: active ? `${col}14` : 'transparent',
              color:      active ? col : C.txtSub,
              border: `1px solid ${active ? `${col}44` : 'transparent'}`,
              transition: 'all 0.14s',
            }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {activeTab === 'overview' && (
        <OverviewView data={overview} loading={overviewLoading} error={overviewError} />
      )}

      {AREA_TABS.map((tab) =>
        activeTab === tab.id ? (
          <AreaView
            key={tab.id}
            tab={tab}
            data={ts.data}
            loading={!!ts.loading}
            error={ts.error}
            selectedDate={ts.selectedDate || 'all'}
            availableDates={ts.availableDates || []}
            onDateChange={(d) => handleDateChange(tab.id, d)}
          />
        ) : null
      )}

      {activeTab === 'solar' && (
        <SolarView
          data={Array.isArray(ts.data) ? ts.data : null}
          loading={!!ts.loading}
          error={ts.error}
          selectedDate={ts.selectedDate || 'all'}
          availableDates={ts.availableDates || []}
          onDateChange={(d) => handleDateChange('solar', d)}
        />
      )}

      {activeTab === 'weather' && (
        <WeatherView
          data={Array.isArray(ts.data) ? ts.data : null}
          loading={!!ts.loading}
          error={ts.error}
          selectedDate={ts.selectedDate || 'all'}
          availableDates={ts.availableDates || []}
          onDateChange={(d) => handleDateChange('weather', d)}
        />
      )}
    </div>
  );
}