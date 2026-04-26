import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell, PieChart, Pie,
} from 'recharts';

const API = 'http://localhost:3001/api/analytics';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0e1a',
  surface:   '#111827',
  surfaceAlt:'#1a2235',
  border:    '#1e2d45',
  accent:    '#00d4ff',
  accentSoft:'rgba(0,212,255,0.12)',
  green:     '#00e5a0',
  greenSoft: 'rgba(0,229,160,0.12)',
  amber:     '#ffb800',
  amberSoft: 'rgba(255,184,0,0.12)',
  coral:     '#ff6b6b',
  coralSoft: 'rgba(255,107,107,0.12)',
  purple:    '#a78bfa',
  purpleSoft:'rgba(167,139,250,0.12)',
  textPrimary:  '#f0f4ff',
  textSecondary:'#6b7fa3',
  textMuted:    '#3d4f6e',
};

const PALETTE = [C.accent, C.green, C.amber, C.coral, C.purple,
  '#38bdf8','#fb923c','#4ade80','#f472b6','#facc15',
  '#a3e635','#34d399','#60a5fa','#e879f9'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v, d = 2) => (v == null ? '—' : Number(v).toFixed(d));
const pct = (v) => `${fmt(v, 1)}%`;

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'daily',      label: 'Day vs Day' },
  { id: 'hourly',     label: 'Hourly Averages' },
  { id: 'peak',       label: 'Peak Hours' },
  { id: 'appliance',  label: 'Appliances' },
  { id: 'solar',      label: 'Solar vs Consumption' },
  { id: 'weather',    label: 'Weather Impact' },
];

const APPLIANCE_KEYS = [
  'Dishwasher [kW]','Furnace 1 [kW]','Furnace 2 [kW]','Home office [kW]',
  'Fridge [kW]','Wine cellar [kW]','Garage door [kW]','Kitchen 12 [kW]',
  'Kitchen 14 [kW]','Kitchen 38 [kW]','Barn [kW]','Well [kW]',
  'Microwave [kW]','Living room [kW]',
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, unit = '', sub = '', color = C.accent }) {
  return (
    <div style={{
      background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '1rem 1.25rem',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.textPrimary, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
        {value}<span style={{ fontSize: 13, color: C.textSecondary, marginLeft: 4, fontWeight: 400 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
      {children}
    </div>
  );
}

function LoadingBar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '2rem 0' }}>
      {[100, 70, 85, 55].map((w, i) => (
        <div key={i} style={{
          height: 14, width: `${w}%`, borderRadius: 6,
          background: `linear-gradient(90deg, ${C.border} 25%, ${C.surfaceAlt} 50%, ${C.border} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{ background: C.coralSoft, border: `1px solid ${C.coral}`, borderRadius: 8, padding: '1rem', color: C.coral, fontSize: 14 }}>
      {msg}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textPrimary },
  labelStyle: { color: C.textSecondary },
};

// ─── Views ────────────────────────────────────────────────────────────────────

function OverviewView({ summary }) {
  if (!summary) return <LoadingBar />;
  return (
    <div>
      <SectionTitle>Dataset Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
        <StatCard label="Total Records"        value={summary.totalRecords?.toLocaleString()}  color={C.accent}  />
        <StatCard label="Total Consumption"    value={fmt(summary.totalUse)}   unit="kW"  color={C.coral}   />
        <StatCard label="Total Solar Gen"      value={fmt(summary.totalGen)}   unit="kW"  color={C.green}   />
        <StatCard label="Net from Grid"        value={fmt(summary.netFromGrid)} unit="kW" color={C.amber}   />
        <StatCard label="Self-sufficiency"     value={pct(summary.selfSufficiencyPct)}       color={C.green}   />
        <StatCard label="Avg Consumption"      value={fmt(summary.avgUse, 4)}  unit="kW"  color={C.accent}  />
        <StatCard label="Peak Consumption"     value={fmt(summary.maxUse)}     unit="kW"  color={C.coral}   />
        <StatCard label="Avg Temperature"      value={fmt(summary.avgTemp, 1)} unit="°F"  color={C.amber}   />
        <StatCard label="Avg Humidity"         value={pct(summary.avgHumidity)}             color={C.purple}  />
      </div>
    </div>
  );
}

function DailyView({ data }) {
  if (!data) return <LoadingBar />;
  return (
    <div>
      <SectionTitle>Day-by-Day Energy Comparison</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Total use vs generation per day</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="totalUse" name="Total Use (kW)" fill={C.coral} radius={[3,3,0,0]} />
              <Bar dataKey="totalGen" name="Solar Gen (kW)" fill={C.green} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Net load from grid per day</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="netLoad" name="Net Load (kW)" stroke={C.amber} fill={C.amberSoft} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Avg / Max consumption comparison</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
            <YAxis stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="avgUse" name="Avg Use (kW)" fill={C.accent} radius={[3,3,0,0]} />
            <Bar dataKey="maxUse" name="Max Use (kW)" fill={C.purple} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function HourlyView({ data, dates }) {
  const [selectedDate, setSelectedDate] = useState('all');

  const filtered = selectedDate === 'all'
    ? Object.values(
        data?.reduce((acc, r) => {
          const key = r.hour;
          if (!acc[key]) acc[key] = { hour: key, avgUse: 0, avgGen: 0, count: 0 };
          acc[key].avgUse += r.avgUse;
          acc[key].avgGen += r.avgGen;
          acc[key].count += 1;
          return acc;
        }, {}) || {}
      ).map((r) => ({ hour: r.hour, avgUse: +(r.avgUse / r.count).toFixed(4), avgGen: +(r.avgGen / r.count).toFixed(4) }))
      .sort((a, b) => a.hour - b.hour)
    : data?.filter((r) => r.date === selectedDate).sort((a, b) => a.hour - b.hour) || [];

  if (!data) return <LoadingBar />;
  return (
    <div>
      <SectionTitle>Hourly Averages</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedDate('all')}
          style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            background: selectedDate === 'all' ? C.accent : 'transparent',
            color: selectedDate === 'all' ? '#000' : C.textSecondary,
            border: `1px solid ${selectedDate === 'all' ? C.accent : C.border}`,
          }}
        >All days</button>
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              background: selectedDate === d ? C.accent : 'transparent',
              color: selectedDate === d ? '#000' : C.textSecondary,
              border: `1px solid ${selectedDate === d ? C.accent : C.border}`,
            }}
          >{d}</button>
        ))}
      </div>
      <Card>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Average energy use by hour of day</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="hour" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} tickFormatter={(h) => `${h}:00`} />
            <YAxis stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
            <Tooltip {...tooltipStyle} labelFormatter={(h) => `${h}:00`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="avgUse" name="Avg Use (kW)" stroke={C.accent} fill={C.accentSoft} strokeWidth={2} />
            <Area type="monotone" dataKey="avgGen" name="Avg Solar (kW)" stroke={C.green} fill={C.greenSoft} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function PeakView({ data }) {
  if (!data) return <LoadingBar />;
  const sorted = [...data].sort((a, b) => a.hour - b.hour);
  const top3 = [...data].sort((a, b) => b.avgUse - a.avgUse).slice(0, 3);
  return (
    <div>
      <SectionTitle>Peak Usage Hours</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: '1.5rem' }}>
        {top3.map((p, i) => (
          <StatCard key={i} label={`#${i+1} Peak Hour`} value={`${p.hour}:00`} sub={`Avg ${fmt(p.avgUse, 4)} kW · Max ${fmt(p.maxUse)} kW`} color={[C.coral, C.amber, C.purple][i]} />
        ))}
      </div>
      <Card>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Average and max consumption across all 24 hours</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sorted}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="hour" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} tickFormatter={(h) => `${h}h`} />
            <YAxis stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
            <Tooltip {...tooltipStyle} labelFormatter={(h) => `${h}:00`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="avgUse" name="Avg Use (kW)" radius={[3,3,0,0]}>
              {sorted.map((entry, i) => (
                <Cell key={i} fill={entry.avgUse === Math.max(...sorted.map(s => s.avgUse)) ? C.coral : C.accent} />
              ))}
            </Bar>
            <Bar dataKey="maxUse" name="Max Use (kW)" fill={C.purple} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function ApplianceView({ data }) {
  const [view, setView] = useState('avg');
  const [selectedDay, setSelectedDay] = useState(null);

  if (!data || data.length === 0) return <LoadingBar />;

  const days = data.map((d) => d.date);
  const displayDay = selectedDay || days[0];
  const rec = data.find((d) => d.date === displayDay) || data[0];

  const chartData = APPLIANCE_KEYS.map((k) => ({
    name: k.replace(' [kW]', '').replace('Kitchen ', 'Kit '),
    avg:  rec[`${k}_avg`] ?? 0,
    total: rec[`${k}_total`] ?? 0,
  })).sort((a, b) => b[view] - a[view]);

  return (
    <div>
      <SectionTitle>Appliance Breakdown by Day</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: C.textSecondary }}>Date:</span>
        {days.map((d) => (
          <button key={d} onClick={() => setSelectedDay(d)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            background: displayDay === d ? C.green : 'transparent',
            color: displayDay === d ? '#000' : C.textSecondary,
            border: `1px solid ${displayDay === d ? C.green : C.border}`,
          }}>{d}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.textSecondary }}>View:</span>
        {['avg','total'].map((v) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            background: view === v ? C.purple : 'transparent',
            color: view === v ? '#fff' : C.textSecondary,
            border: `1px solid ${view === v ? C.purple : C.border}`,
          }}>{v === 'avg' ? 'Average kW' : 'Total kW'}</button>
        ))}
      </div>
      <Card>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>
          {view === 'avg' ? 'Average' : 'Total'} appliance consumption — {displayDay}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
            <XAxis type="number" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
            <YAxis type="category" dataKey="name" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} width={90} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey={view} name={view === 'avg' ? 'Avg kW' : 'Total kW'} radius={[0,3,3,0]}>
              {chartData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function SolarView({ data }) {
  if (!data) return <LoadingBar />;
  return (
    <div>
      <SectionTitle>Solar Generation vs Consumption</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: '1.5rem' }}>
        <StatCard label="Avg Self-sufficiency" value={pct(data.reduce((s,d)=>s+d.selfSufficiencyPct,0)/data.length)} color={C.green} />
        <StatCard label="Best Day (solar)"     value={data.reduce((b,d)=>d.selfSufficiencyPct>b.selfSufficiencyPct?d:b,data[0])?.date || '—'} color={C.green} />
        <StatCard label="Total Solar"          value={fmt(data.reduce((s,d)=>s+d.totalSolar,0))} unit="kW" color={C.amber} />
        <StatCard label="Total Grid Draw"      value={fmt(data.reduce((s,d)=>s+Math.max(0,d.netFromGrid),0))} unit="kW" color={C.coral} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Card>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Consumption vs solar per day</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="totalConsumption" name="Consumption (kW)" fill={C.coral} radius={[3,3,0,0]} />
              <Bar dataKey="totalSolar"       name="Solar Gen (kW)"   fill={C.green} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Self-sufficiency % per day</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} tickFormatter={(v)=>`${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v)=>`${fmt(v,1)}%`} />
              <Area type="monotone" dataKey="selfSufficiencyPct" name="Self-sufficiency" stroke={C.green} fill={C.greenSoft} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function WeatherView({ data }) {
  if (!data) return <LoadingBar />;
  return (
    <div>
      <SectionTitle>Weather Impact on Energy Usage</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Temperature range vs avg consumption</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis yAxisId="left"  stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis yAxisId="right" orientation="right" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left"  type="monotone" dataKey="avgUse"  name="Avg Use (kW)"  stroke={C.coral}  strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgTemp" name="Avg Temp (°F)" stroke={C.amber}  strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="maxTemp" name="Max Temp (°F)" stroke={C.amber}  strokeWidth={1} dot={false} strokeDasharray="4 3" />
              <Line yAxisId="right" type="monotone" dataKey="minTemp" name="Min Temp (°F)" stroke={C.accent} strokeWidth={1} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Humidity & wind vs consumption</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis yAxisId="left"  stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <YAxis yAxisId="right" orientation="right" stroke={C.textMuted} tick={{ fontSize: 11, fill: C.textSecondary }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left"  type="monotone" dataKey="avgUse"      name="Avg Use (kW)"  stroke={C.coral}  strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgHumidity" name="Humidity (%)"  stroke={C.purple} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="avgWind"     name="Wind (mph)"    stroke={C.accent} strokeWidth={2} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 12 }}>Daily weather summary radar</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {data.map((day) => {
            const radarData = [
              { subject: 'Temp',     value: Math.min(100, (day.avgTemp / 120) * 100) },
              { subject: 'Humidity', value: day.avgHumidity },
              { subject: 'Wind',     value: Math.min(100, (day.avgWind / 30) * 100) },
              { subject: 'Cloud',    value: day.avgCloud },
              { subject: 'Use',      value: Math.min(100, (day.avgUse / 3) * 100) },
            ];
            return (
              <div key={day.date}>
                <div style={{ fontSize: 12, color: C.textSecondary, textAlign: 'center', marginBottom: 4 }}>{day.date}</div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={C.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: C.textSecondary }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke={C.accent} fill={C.accentSoft} strokeWidth={1.5} />
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

// ─── Main Component ───────────────────────────────────────────────────────────
function Analytical() {
  const [activeTab, setActiveTab] = useState('overview');
  const [state, setState] = useState({
    summary: null, daily: null, hourly: null,
    peak: null, appliance: null, solar: null, weather: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});

  const load = useCallback(async (key, url) => {
    if (state[key] !== null) return;
    setLoading((l) => ({ ...l, [key]: true }));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState((s) => ({ ...s, [key]: data }));
    } catch (e) {
      setErrors((err) => ({ ...err, [key]: e.message }));
    } finally {
      setLoading((l) => ({ ...l, [key]: false }));
    }
  }, [state]);

  useEffect(() => {
    load('summary',  `${API}/summary`);
    load('daily',    `${API}/daily-comparison`);
  }, []);

  useEffect(() => {
    if (activeTab === 'hourly')    load('hourly',    `${API}/hourly-averages`);
    if (activeTab === 'peak')      load('peak',      `${API}/peak-hours`);
    if (activeTab === 'appliance') load('appliance', `${API}/appliance-breakdown`);
    if (activeTab === 'solar')     load('solar',     `${API}/solar-vs-consumption`);
    if (activeTab === 'weather')   load('weather',   `${API}/weather-impact`);
  }, [activeTab]);

  const dates = state.daily?.map((d) => d.date) || [];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.textPrimary, fontFamily: "'DM Sans', sans-serif", padding: '1.5rem' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.textPrimary, margin: 0 }}>
          <span style={{ color: C.accent }}>◈</span> Smart Home Analytics
        </h1>
        <p style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
          7-day energy dataset · {state.summary?.totalRecords?.toLocaleString() || '—'} records
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, paddingBottom: '1rem' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              background: activeTab === t.id ? C.accentSoft : 'transparent',
              color: activeTab === t.id ? C.accent : C.textSecondary,
              border: `1px solid ${activeTab === t.id ? C.accent : 'transparent'}`,
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Error banner for active tab */}
      {errors[activeTab] && <ErrorMsg msg={`Failed to load: ${errors[activeTab]}`} />}

      {/* Views */}
      {activeTab === 'overview'  && <OverviewView summary={state.summary} />}
      {activeTab === 'daily'     && <DailyView    data={state.daily} />}
      {activeTab === 'hourly'    && <HourlyView   data={state.hourly} dates={dates} />}
      {activeTab === 'peak'      && <PeakView     data={state.peak} />}
      {activeTab === 'appliance' && <ApplianceView data={state.appliance} />}
      {activeTab === 'solar'     && <SolarView    data={state.solar} />}
      {activeTab === 'weather'   && <WeatherView  data={state.weather} />}
    </div>
  );
}

export default Analytical;