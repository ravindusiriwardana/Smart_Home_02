import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:         '#060d14',
  surface:    '#0c1a27',
  surfaceAlt: '#0f2030',
  border:     'rgba(0,200,160,0.13)',
  borderHov:  'rgba(0,200,160,0.32)',
  teal:       '#00c8a0',
  tealSoft:   'rgba(0,200,160,0.10)',
  tealGlow:   'rgba(0,200,160,0.22)',
  amber:      '#ffb932',
  amberSoft:  'rgba(255,185,50,0.10)',
  coral:      '#ff6b6b',
  coralSoft:  'rgba(255,107,107,0.10)',
  purple:     '#a78bfa',
  text:       '#e8f4f8',
  textSub:    '#4a7a8a',
  textMuted:  '#1e3a4a',
  font:       "'Syne', sans-serif",
  mono:       "'Space Mono', monospace",
};

const APPLIANCE_KEYS = [
  'Dishwasher [kW]','Furnace 1 [kW]','Furnace 2 [kW]','Home office [kW]',
  'Fridge [kW]','Wine cellar [kW]','Garage door [kW]','Kitchen 12 [kW]',
  'Kitchen 14 [kW]','Kitchen 38 [kW]','Barn [kW]','Well [kW]',
  'Microwave [kW]','Living room [kW]',
];

const APPLIANCE_COLORS = [
  T.teal, T.amber, T.coral, T.purple,
  '#38bdf8','#fb923c','#4ade80','#f472b6',
  '#facc15','#a3e635','#34d399','#60a5fa','#e879f9','#fbbf24',
];

const API = 'http://localhost:3001/api/analytics';

// ── Reusable components ───────────────────────────────────────────────────────
function SectionLabel({ children, color = T.teal }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: `${color}14`, border: `1px solid ${color}33`,
      borderRadius: 40, padding: '5px 14px',
      fontSize: 11, fontWeight: 700, color, letterSpacing: '.08em',
      marginBottom: '0.75rem',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {children}
    </div>
  );
}

function StatPill({ label, value, color = T.teal }) {
  return (
    <div style={{
      background: T.surfaceAlt, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '10px 16px', borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 10, color: T.textSub, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.mono, color: T.text }}>{value}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surfaceAlt, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: '10px 14px', fontFamily: T.font,
    }}>
      <div style={{ fontSize: 12, color: T.textSub, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, color: p.fill, fontFamily: T.mono, fontWeight: 700 }}>
          {p.value.toFixed(2)} kW
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// COMPACT HERO (no more minHeight: 100vh)
// ════════════════════════════════════════════════════════════════════════════════
function HeroSection({ summary, navigate }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '3rem 2rem 2.5rem' }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.15) saturate(0.5)', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(135deg, rgba(0,200,160,0.07) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(0deg, #00c8a0 0, #00c8a0 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #00c8a0 0, #00c8a0 1px, transparent 1px, transparent 60px)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,200,160,0.1)', border: '1px solid rgba(0,200,160,0.25)',
          borderRadius: 40, padding: '5px 14px', marginBottom: '1rem',
          fontSize: 11, color: T.teal, fontWeight: 700, letterSpacing: '.08em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.teal, animation: 'pulse-dot 1.8s infinite' }} />
          SMART HOME ENERGY PLATFORM
        </div>

        {/* Two-column: heading + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800,
              lineHeight: 1.1, letterSpacing: '-1.5px', color: T.text, marginBottom: '0.75rem',
            }}>
              Your Home.{' '}
              <span style={{ color: T.teal }}>Smarter Energy.</span>{' '}
              <span style={{ color: T.amber }}>Real Savings.</span>
            </h1>
            <p style={{ fontSize: 14, color: T.textSub, maxWidth: 480, lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Monitor every watt, track solar generation, and get AI-powered insights — built on{' '}
              {summary?.totalRecords?.toLocaleString() || '500K+'} real energy records.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/analytical')}
                style={{
                  padding: '11px 24px', borderRadius: 40, cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 600, fontSize: 13,
                  background: 'transparent', color: T.text,
                  border: '1px solid rgba(0,200,160,0.28)', transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,200,160,0.28)'}
              >View Analytics</button>
            </div>
          </div>

          {/* Live stats — vertical stack on the right */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, minWidth: 320 }}>
              <StatPill label="Total Consumption" value={`${summary.totalUse?.toLocaleString()} kW`} color={T.coral} />
              <StatPill label="Solar Generated"   value={`${summary.totalGen?.toLocaleString()} kW`} color={T.amber} />
              <StatPill label="Self-sufficiency"  value={`${summary.selfSufficiencyPct}%`}           color={T.teal} />
              <StatPill label="Avg Temperature"   value={`${summary.avgTemp}°F`}                     color={T.purple} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// TAB BAR
// ════════════════════════════════════════════════════════════════════════════════
function TabBar({ activeTab, setActiveTab }) {
  const TABS = [
    { id: 'about',      label: 'About',      icon: '◈', color: T.teal  },
    { id: 'calculator', label: 'Calculator', icon: '⚡', color: T.amber },
    { id: 'usage',      label: 'Usage',      icon: '▦', color: T.coral },
  ];
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: T.surface,
      borderBottom: `1px solid ${T.border}`,
      borderTop: `1px solid ${T.border}`,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'flex', gap: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 24px', border: 'none', cursor: 'pointer',
              fontFamily: T.font, fontWeight: 700, fontSize: 13,
              background: 'transparent',
              color: activeTab === tab.id ? tab.color : T.textSub,
              borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = T.textSub; }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ABOUT PANEL (condensed, 2-col)
// ════════════════════════════════════════════════════════════════════════════════
function AboutPanel() {
  const FEATURES = [
    { icon: '◈', title: 'Real-time Monitoring',  desc: 'Every appliance tracked minute-by-minute across 503,910 data points over 7 days.',  color: T.teal  },
    { icon: '☀', title: 'Solar Intelligence',    desc: 'Track solar generation vs grid consumption and maximise self-sufficiency.',           color: T.amber },
    { icon: '◉', title: 'AI-Powered Insights',   desc: 'Ask peak hours, efficiency scores, or appliance anomalies in plain English.',        color: T.coral },
    { icon: '⚡', title: 'Cost Calculator',       desc: 'Set your local tariff and see exactly what each appliance costs.',                   color: T.purple},
    { icon: '⌁', title: 'Weather Correlation',   desc: 'Understand how temperature and cloud cover drive energy spikes.',                    color: '#38bdf8'},
    { icon: '▦', title: 'Appliance Breakdown',   desc: '14 appliances ranked simultaneously — from furnace to wine cellar.',                 color: '#4ade80'},
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>

        {/* Left */}
        <div>
          <SectionLabel>About the Platform</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)', fontWeight: 800, letterSpacing: '-1px', color: T.text, lineHeight: 1.2, marginBottom: '1rem' }}>
            Built for homes that<br /><span style={{ color: T.teal }}>think smarter</span>
          </h2>
          <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.8, marginBottom: '0.75rem' }}>
            This platform ingests raw sensor data from a real Canadian household, processes it through a MongoDB pipeline, and surfaces patterns that would take hours to find manually.
          </p>
          <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.8 }}>
            Cut your electricity bill, optimise solar usage, or just understand your home better — the data is here and the AI is ready.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: '1.75rem', flexWrap: 'wrap' }}>
            {[['503,910','Data Records'],['7','Days Tracked'],['14','Appliances'],['23%','Solar Coverage']].map(([v, l], i) => (
              <div key={i}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: T.mono, color: [T.teal,T.amber,T.coral,T.purple][i] }}>{v}</div>
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '1rem', borderLeft: `3px solid ${f.color}`,
              transition: 'transform .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: 16, color: f.color, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// CALCULATOR PANEL
// ════════════════════════════════════════════════════════════════════════════════
function CalculatorPanel() {
  const [mode, setMode] = useState('kwh-to-cost');
  const [kwh, setKwh] = useState('');
  const [units, setUnits] = useState('');
  const [rate, setRate] = useState('0.15');
  const [unitsPerKwh, setUnitsPerKwh] = useState('1');
  const [currency, setCurrency] = useState('USD');
  const [result, setResult] = useState(null);
  const [focused, setFocused] = useState({});

  const CURRENCIES = ['USD','LKR'];
  const CURRENCY_SYMBOLS = { USD:'$', LKR:'Rs' };
  const MODES = [
    { id: 'kwh-to-cost',   label: 'kWh → Cost'   },
    { id: 'units-to-kwh',  label: 'Units → kWh'  },
    { id: 'units-to-cost', label: 'Units → Cost'  },
    { id: 'cost-to-kwh',   label: 'Cost → kWh'   },
  ];

  const calculate = () => {
    const sym = CURRENCY_SYMBOLS[currency];
    const r = parseFloat(rate) || 0;
    const upk = parseFloat(unitsPerKwh) || 1;
    if (mode === 'kwh-to-cost') {
      const k = parseFloat(kwh); if (isNaN(k)) return;
      const cost = k * r; const unitsUsed = k * upk;
      setResult({ primary: `${sym}${cost.toFixed(2)}`, primaryLabel: 'Total Cost', rows: [['Energy Input',`${k.toFixed(2)} kWh`],['Rate',`${sym}${r.toFixed(4)}/kWh`],['Units Used',`${unitsUsed.toFixed(2)} units`],['Daily Cost',`${sym}${(cost/30).toFixed(2)}/day`],['Yearly Cost',`${sym}${(cost*12).toFixed(2)}`]] });
    } else if (mode === 'units-to-kwh') {
      const u = parseFloat(units); if (isNaN(u)) return;
      const kwhResult = u / upk;
      setResult({ primary: `${kwhResult.toFixed(3)} kWh`, primaryLabel: 'Energy in kWh', rows: [['Units Input',`${u.toFixed(2)} units`],['Conversion',`${upk} units/kWh`],['Result',`${kwhResult.toFixed(4)} kWh`],['Watt-hours',`${(kwhResult*1000).toFixed(1)} Wh`],['Joules',`${(kwhResult*3_600_000).toLocaleString()} J`]] });
    } else if (mode === 'units-to-cost') {
      const u = parseFloat(units); if (isNaN(u)) return;
      const kwhResult = u / upk; const cost = kwhResult * r;
      setResult({ primary: `${sym}${cost.toFixed(2)}`, primaryLabel: 'Total Cost', rows: [['Units Input',`${u.toFixed(2)} units`],['kWh',`${kwhResult.toFixed(3)} kWh`],['Rate',`${sym}${r.toFixed(4)}/kWh`],['Total Cost',`${sym}${cost.toFixed(2)}`],['Per Unit',`${sym}${(cost/u).toFixed(4)}/unit`]] });
    } else if (mode === 'cost-to-kwh') {
      const c = parseFloat(kwh); if (isNaN(c) || r === 0) return;
      const kwhResult = c / r;
      setResult({ primary: `${kwhResult.toFixed(3)} kWh`, primaryLabel: 'Energy Equivalent', rows: [['Budget',`${sym}${c.toFixed(2)}`],['Rate',`${sym}${r.toFixed(4)}/kWh`],['kWh Afforded',`${kwhResult.toFixed(3)} kWh`],['Units',`${(kwhResult*upk).toFixed(2)} units`],['Watt-hours',`${(kwhResult*1000).toFixed(1)} Wh`]] });
    }
  };

  const inputStyle = (f) => ({
    width: '100%', background: T.surfaceAlt,
    border: `1px solid ${f ? 'rgba(0,200,160,0.4)' : T.border}`,
    borderRadius: 10, padding: '10px 14px',
    color: T.text, fontFamily: T.mono, fontSize: 14,
    outline: 'none', transition: 'border-color .15s',
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <SectionLabel color={T.amber}>Energy Calculator</SectionLabel>
        <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, letterSpacing: '-1px', color: T.text, marginBottom: '0.5rem' }}>
          Convert & Calculate Energy Costs
        </h2>
        <p style={{ fontSize: 13, color: T.textSub }}>Convert between kWh, units, and real electricity costs using your local tariff rate.</p>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '1.75rem', maxWidth: 860, margin: '0 auto' }}>
        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '1.5rem', background: T.surfaceAlt, borderRadius: 12, padding: 5 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setResult(null); }}
              style={{
                flex: '1 1 auto', padding: '8px 12px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontFamily: T.font, fontWeight: 600, fontSize: 12,
                background: mode === m.id ? T.amber : 'transparent',
                color: mode === m.id ? '#060d14' : T.textSub, transition: 'all .15s',
              }}>{m.label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(mode === 'kwh-to-cost' || mode === 'cost-to-kwh') && (
              <div>
                <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 5, letterSpacing: '.06em' }}>
                  {mode === 'kwh-to-cost' ? 'ENERGY (kWh)' : 'BUDGET (amount)'}
                </label>
                <input type="number" min="0" step="any"
                  placeholder={mode === 'kwh-to-cost' ? 'e.g. 150' : 'e.g. 25.00'}
                  value={kwh} onChange={e => setKwh(e.target.value)}
                  onFocus={() => setFocused(f => ({...f, kwh: true}))}
                  onBlur={() => setFocused(f => ({...f, kwh: false}))}
                  style={inputStyle(focused.kwh)} />
              </div>
            )}
            {(mode === 'units-to-kwh' || mode === 'units-to-cost') && (
              <div>
                <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 5, letterSpacing: '.06em' }}>ELECTRICITY UNITS</label>
                <input type="number" min="0" step="any" placeholder="e.g. 150"
                  value={units} onChange={e => setUnits(e.target.value)}
                  onFocus={() => setFocused(f => ({...f, units: true}))}
                  onBlur={() => setFocused(f => ({...f, units: false}))}
                  style={inputStyle(focused.units)} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 5, letterSpacing: '.06em' }}>UNITS PER kWh</label>
              <input type="number" min="0.01" step="0.01" placeholder="1.00"
                value={unitsPerKwh} onChange={e => setUnitsPerKwh(e.target.value)}
                onFocus={() => setFocused(f => ({...f, upk: true}))}
                onBlur={() => setFocused(f => ({...f, upk: false}))}
                style={inputStyle(focused.upk)} />
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>Usually 1 unit = 1 kWh.</div>
            </div>
            {mode !== 'units-to-kwh' && (
              <div>
                <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 5, letterSpacing: '.06em' }}>RATE (per kWh)</label>
                <input type="number" min="0" step="0.001" placeholder="0.15"
                  value={rate} onChange={e => setRate(e.target.value)}
                  onFocus={() => setFocused(f => ({...f, rate: true}))}
                  onBlur={() => setFocused(f => ({...f, rate: false}))}
                  style={inputStyle(focused.rate)} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 5, letterSpacing: '.06em' }}>CURRENCY</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle(false), cursor: 'pointer' }}>
                {CURRENCIES.map(c => <option key={c} value={c} style={{ background: T.surfaceAlt }}>{c}</option>)}
              </select>
            </div>
            <button onClick={calculate}
              style={{
                padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: T.amber, color: '#060d14', fontFamily: T.font, fontWeight: 700, fontSize: 14,
                transition: 'box-shadow .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(255,185,50,0.35)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >Calculate →</button>
          </div>

          {/* Result */}
          <div style={{
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: '1.25rem',
            display: 'flex', flexDirection: 'column',
            justifyContent: result ? 'flex-start' : 'center',
            alignItems: result ? 'flex-start' : 'center', minHeight: 240,
          }}>
            {result ? (
              <>
                <div style={{ fontSize: 11, color: T.textSub, letterSpacing: '.08em', marginBottom: 6 }}>{result.primaryLabel.toUpperCase()}</div>
                <div style={{ fontSize: 34, fontWeight: 800, fontFamily: T.mono, color: T.amber, marginBottom: '1.25rem', letterSpacing: '-1px' }}>{result.primary}</div>
                <div style={{ width: '100%', borderTop: `1px solid ${T.border}`, paddingTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {result.rows.map(([label, value], i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: T.textSub }}>{label}</span>
                      <span style={{ fontSize: 11, fontFamily: T.mono, color: T.text, fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: .35 }}>⚡</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>Enter values and click Calculate.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// USAGE (CONSUMPTION GRAPH) PANEL
// ════════════════════════════════════════════════════════════════════════════════
function UsagePanel() {
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('avg');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovBar, setHovBar] = useState(null);

  useEffect(() => {
    fetch(`${API}/appliance-breakdown`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setSelectedDate(d[0]?.date || null); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const dates = data?.map(d => d.date) || [];
  const rec = data?.find(d => d.date === selectedDate) || data?.[0];
  const chartData = rec
    ? APPLIANCE_KEYS.map((k, i) => ({
        name: k.replace(' [kW]', '').replace('Kitchen ', 'Kit.'),
        value: parseFloat((rec[view === 'avg' ? `${k}_avg` : `${k}_total`] || 0).toFixed(3)),
        color: APPLIANCE_COLORS[i],
      })).sort((a, b) => b.value - a.value)
    : [];
  const topAppliance = chartData[0];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <SectionLabel color={T.coral}>Consumption Breakdown</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, letterSpacing: '-1px', color: T.text, marginBottom: '0.25rem' }}>
            Appliance Energy Usage
          </h2>
          <p style={{ fontSize: 13, color: T.textSub }}>Which device costs you the most — by day.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: T.surfaceAlt, borderRadius: 8, padding: 3, border: `1px solid ${T.border}` }}>
            {[['avg','Avg kW'],['total','Total kW']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: T.font, fontWeight: 600, fontSize: 11,
                  background: view === v ? T.coral : 'transparent',
                  color: view === v ? '#fff' : T.textSub, transition: 'all .15s',
                }}>{l}</button>
            ))}
          </div>
          {dates.map(d => (
            <button key={d} onClick={() => setSelectedDate(d)}
              style={{
                padding: '6px 12px', borderRadius: 20,
                border: `1px solid ${selectedDate === d ? T.teal : T.border}`,
                background: selectedDate === d ? T.tealSoft : 'transparent',
                color: selectedDate === d ? T.teal : T.textSub,
                cursor: 'pointer', fontFamily: T.font, fontWeight: 600, fontSize: 11, transition: 'all .15s',
              }}>{d}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[100,70,85,55,90].map((w,i) => (
            <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 6, background: `linear-gradient(90deg, ${T.border} 25%, ${T.surfaceAlt} 50%, ${T.border} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', animationDelay: `${i*0.12}s` }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: T.coralSoft, border: `1px solid ${T.coral}`, borderRadius: 10, padding: '1rem', color: T.coral, fontSize: 13 }}>
          Failed to load: {error}
        </div>
      )}

      {!loading && !error && rec && (
        <>
          {/* Summary pills */}
          {topAppliance && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
              <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${topAppliance.color}` }}>
                <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 3 }}>TOP CONSUMER</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: topAppliance.color }}>{topAppliance.name}</div>
                <div style={{ fontSize: 16, fontFamily: T.mono, fontWeight: 700, color: T.text }}>{topAppliance.value} kW</div>
              </div>
              <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${T.teal}` }}>
                <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 3 }}>TOTAL ({view === 'avg' ? 'AVG' : 'SUM'})</div>
                <div style={{ fontSize: 16, fontFamily: T.mono, fontWeight: 700, color: T.text }}>{chartData.reduce((s, d) => s + d.value, 0).toFixed(2)} kW</div>
              </div>
              <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${T.amber}` }}>
                <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 3 }}>APPLIANCES</div>
                <div style={{ fontSize: 16, fontFamily: T.mono, fontWeight: 700, color: T.text }}>{chartData.length}</div>
              </div>
              <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', borderLeft: `3px solid ${T.purple}` }}>
                <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 3 }}>DATE</div>
                <div style={{ fontSize: 14, fontFamily: T.mono, fontWeight: 700, color: T.text }}>{selectedDate}</div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 14, padding: '1.25rem' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 55 }} onMouseLeave={() => setHovBar(null)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.textMuted} vertical={false} />
                <XAxis dataKey="name" stroke={T.textMuted} tick={{ fontSize: 10, fill: T.textSub, fontFamily: T.font }} angle={-35} textAnchor="end" interval={0} />
                <YAxis stroke={T.textMuted} tick={{ fontSize: 10, fill: T.textSub, fontFamily: T.mono }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,200,160,0.05)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} onMouseEnter={(_, i) => setHovBar(i)}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={hovBar === null || hovBar === i ? 1 : 0.35} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6, marginTop: '0.875rem' }}>
            {chartData.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                borderRadius: 7, padding: '7px 10px',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: T.textSub, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: T.text }}>{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    fetch(`${API}/summary`)
      .then(r => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060d14; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        select option { background: #0f2030; }
      `}</style>

      <div style={{ background: T.bg, color: T.text, fontFamily: T.font, minHeight: '100vh' }}>
        <HeroSection summary={summary} navigate={navigate} />
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab content */}
        <div style={{ background: activeTab === 'calculator' ? T.bg : T.surface }}>
          {activeTab === 'about'      && <AboutPanel />}
          {activeTab === 'calculator' && <CalculatorPanel />}
          {activeTab === 'usage'      && <UsagePanel />}
        </div>
      </div>
    </>
  );
}