import React, { useState, useEffect, useRef } from 'react';
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

// ── Appliance keys (matches your backend) ─────────────────────────────────────
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
      background: `${color}14`,
      border: `1px solid ${color}33`,
      borderRadius: 40,
      padding: '5px 14px',
      fontSize: 11, fontWeight: 700,
      color, letterSpacing: '.08em',
      marginBottom: '1rem',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
      {children}
    </div>
  );
}

function StatPill({ label, value, color = T.teal }) {
  return (
    <div style={{
      background: T.surfaceAlt,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: '14px 20px',
      borderLeft: `3px solid ${color}`,
      minWidth: 130,
    }}>
      <div style={{ fontSize: 10, color: T.textSub, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: T.mono, color: T.text }}>{value}</div>
    </div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surfaceAlt,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      fontFamily: T.font,
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
// SECTION 1 — HERO
// ════════════════════════════════════════════════════════════════════════════════
function HeroSection({ summary, navigate }) {
  const [hov, setHov] = useState(null);

  const CARDS = [
    { label: 'Dashboard',  desc: 'Live panels',   path: '/dashboard',  color: T.teal,   icon: '◈' },
    { label: 'Analytics',  desc: '7-day deep dive', path: '/analytical', color: T.amber,  icon: '⌁' },
    { label: 'AI Chat',    desc: 'Ask anything',   path: '/chatbot',    color: T.coral,  icon: '◉' },
  ];

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

      {/* Background image layer */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.18) saturate(0.6)',
        zIndex: 0,
      }} />

      {/* Teal gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(0,200,160,0.08) 0%, transparent 60%, rgba(255,185,50,0.05) 100%)',
        zIndex: 1,
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(0deg, #00c8a0 0, #00c8a0 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #00c8a0 0, #00c8a0 1px, transparent 1px, transparent 60px)',
      }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1100, margin: '0 auto', padding: '2rem 2rem 6rem' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,200,160,0.1)', border: '1px solid rgba(0,200,160,0.25)',
          borderRadius: 40, padding: '6px 16px', marginBottom: '1.5rem',
          fontSize: 11, color: T.teal, fontWeight: 700, letterSpacing: '.08em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.teal, animation: 'pulse-dot 1.8s infinite' }} />
          SMART HOME ENERGY PLATFORM
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
          fontWeight: 800, lineHeight: 1.08, letterSpacing: '-2px',
          color: T.text, marginBottom: '1.25rem', maxWidth: 700,
        }}>
          Your Home.<br />
          <span style={{ color: T.teal }}>Smarter Energy.</span><br />
          <span style={{ color: T.amber }}>Real Savings.</span>
        </h1>

        <p style={{ fontSize: 16, color: T.textSub, maxWidth: 500, lineHeight: 1.75, marginBottom: '2.5rem' }}>
          Monitor every watt, track solar generation, and get AI-powered insights — all from one intelligent dashboard built on {summary?.totalRecords?.toLocaleString() || '500K+'} real energy records.
        </p>

        {/* CTA + stats row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '3rem', alignItems: 'center' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{
              padding: '13px 28px', borderRadius: 40, border: 'none', cursor: 'pointer',
              background: T.teal, color: '#060d14', fontFamily: T.font, fontWeight: 700, fontSize: 14,
              boxShadow: '0 0 28px rgba(0,200,160,0.38)', transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(0,200,160,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(0,200,160,0.38)'; }}
          >Open Dashboard →</button>

          <button onClick={() => navigate('/analytical')}
            style={{
              padding: '13px 28px', borderRadius: 40, cursor: 'pointer', fontFamily: T.font, fontWeight: 600, fontSize: 14,
              background: 'transparent', color: T.text, border: '1px solid rgba(0,200,160,0.28)',
              transition: 'border-color .15s, color .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.color = T.teal; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,200,160,0.28)'; e.currentTarget.style.color = T.text; }}
          >View Analytics</button>
        </div>

        {/* Live summary stats */}
        {summary && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatPill label="Total Consumption" value={`${summary.totalUse?.toLocaleString()} kW`} color={T.coral} />
            <StatPill label="Solar Generated"   value={`${summary.totalGen?.toLocaleString()} kW`} color={T.amber} />
            <StatPill label="Self-sufficiency"  value={`${summary.selfSufficiencyPct}%`}           color={T.teal}  />
            <StatPill label="Avg Temperature"   value={`${summary.avgTemp}°F`}                     color={T.purple}/>
          </div>
        )}

        {/* Nav cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: '2.5rem', maxWidth: 600 }}>
          {CARDS.map((c, i) => (
            <div key={i} onClick={() => navigate(c.path)}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{
                background: hov === i ? `${c.color}12` : 'rgba(12,26,39,0.7)',
                border: `1px solid ${hov === i ? c.color + '44' : T.border}`,
                borderRadius: 14, padding: '16px', cursor: 'pointer',
                transform: hov === i ? 'translateY(-3px)' : 'none',
                transition: 'all .2s ease', backdropFilter: 'blur(8px)',
              }}>
              <div style={{ fontSize: 20, color: c.color, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.label}</div>
              <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 2 — ABOUT
// ════════════════════════════════════════════════════════════════════════════════
function AboutSection() {
  const FEATURES = [
    { icon: '◈', title: 'Real-time Monitoring',  desc: 'Every appliance tracked minute-by-minute across 503,910 data points spanning 7 days of continuous recording.',  color: T.teal  },
    { icon: '☀', title: 'Solar Intelligence',    desc: 'Track your solar generation vs grid consumption and maximise self-sufficiency with intelligent forecasting.',        color: T.amber },
    { icon: '◉', title: 'AI-Powered Insights',   desc: 'Natural language queries powered by Claude AI — ask about peak hours, efficiency, or appliance anomalies.',      color: T.coral },
    { icon: '⚡', title: 'Cost Calculator',       desc: 'Convert kWh readings to real electricity costs. Set your local tariff and see exactly what each device costs.',  color: T.purple },
    { icon: '⌁', title: 'Weather Correlation',   desc: 'Understand how temperature, humidity and cloud cover drive energy spikes so you can plan ahead.',               color: '#38bdf8'},
    { icon: '▦', title: 'Appliance Breakdown',   desc: '14 individual appliances monitored simultaneously — from the furnace to the wine cellar — ranked by consumption.',color: '#4ade80'},
  ];

  return (
    <section style={{ background: T.surface, padding: '5rem 2rem', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '4rem' }}>

          {/* Left: text */}
          <div>
            <SectionLabel>About the Platform</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 800, letterSpacing: '-1px', color: T.text, lineHeight: 1.15, marginBottom: '1.25rem' }}>
              Built for homes that<br /><span style={{ color: T.teal }}>think smarter</span>
            </h2>
            <p style={{ fontSize: 15, color: T.textSub, lineHeight: 1.8, marginBottom: '1rem' }}>
              This platform ingests raw sensor data from a real Canadian household, processes it through a MongoDB pipeline, and surfaces patterns that would take hours to find manually.
            </p>
            <p style={{ fontSize: 15, color: T.textSub, lineHeight: 1.8 }}>
              Whether you want to cut your electricity bill, optimise solar usage, or just understand your home better — the data is here and the AI is ready to help.
            </p>

            <div style={{ display: 'flex', gap: 20, marginTop: '2rem', flexWrap: 'wrap' }}>
              {[['503,910', 'Data Records'],['7', 'Days Tracked'],['14', 'Appliances'],['23%', 'Solar Coverage']].map(([v, l], i) => (
                <div key={i}>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: T.mono, color: [T.teal,T.amber,T.coral,T.purple][i] }}>{v}</div>
                  <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: image */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              border: `1px solid ${T.border}`,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}>
              <img
                src="https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80"
                alt="Smart home energy monitoring"
                style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block', filter: 'brightness(0.85) saturate(0.8)' }}
              />
              {/* Overlay badge */}
              <div style={{
                position: 'absolute', bottom: 20, left: 20,
                background: 'rgba(6,13,20,0.85)', backdropFilter: 'blur(12px)',
                border: `1px solid ${T.border}`, borderRadius: 12,
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.teal, animation: 'pulse-dot 1.8s infinite' }} />
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>System Online · Live Data</span>
              </div>
            </div>
            {/* Decorative glow */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,160,0.12) 0%, transparent 70%)', zIndex: -1 }} />
          </div>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 14, padding: '1.25rem',
              borderLeft: `3px solid ${f.color}`,
              transition: 'transform .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ fontSize: 18, color: f.color, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 3 — ENERGY CALCULATOR
// ════════════════════════════════════════════════════════════════════════════════
function CalculatorSection() {
  const [mode, setMode] = useState('kwh-to-cost');
  const [kwh, setKwh] = useState('');
  const [units, setUnits] = useState('');
  const [rate, setRate] = useState('0.15');
  const [unitsPerKwh, setUnitsPerKwh] = useState('1');
  const [currency, setCurrency] = useState('USD');
  const [result, setResult] = useState(null);

  const CURRENCIES = ['USD','EUR','GBP','LKR','AUD','CAD','INR'];
  const CURRENCY_SYMBOLS = { USD:'$', EUR:'€', GBP:'£', LKR:'Rs', AUD:'A$', CAD:'C$', INR:'₹' };

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
      const k = parseFloat(kwh);
      if (isNaN(k)) return;
      const cost = k * r;
      const unitsUsed = k * upk;
      setResult({
        primary: `${sym}${cost.toFixed(2)}`,
        primaryLabel: 'Total Cost',
        rows: [
          ['Energy Input', `${k.toFixed(2)} kWh`],
          ['Rate',         `${sym}${r.toFixed(4)} / kWh`],
          ['Units Used',   `${unitsUsed.toFixed(2)} units`],
          ['Daily Cost',   `${sym}${(cost / 30).toFixed(2)} / day (if monthly)`],
          ['Yearly Cost',  `${sym}${(cost * 12).toFixed(2)} (×12)`],
        ],
      });
    } else if (mode === 'units-to-kwh') {
      const u = parseFloat(units);
      if (isNaN(u)) return;
      const kwhResult = u / upk;
      setResult({
        primary: `${kwhResult.toFixed(3)} kWh`,
        primaryLabel: 'Energy in kWh',
        rows: [
          ['Units Input',       `${u.toFixed(2)} units`],
          ['Conversion Factor', `${upk} units / kWh`],
          ['Result',            `${kwhResult.toFixed(4)} kWh`],
          ['Watt-hours',        `${(kwhResult * 1000).toFixed(1)} Wh`],
          ['Joules',            `${(kwhResult * 3_600_000).toLocaleString()} J`],
        ],
      });
    } else if (mode === 'units-to-cost') {
      const u = parseFloat(units);
      if (isNaN(u)) return;
      const kwhResult = u / upk;
      const cost = kwhResult * r;
      setResult({
        primary: `${sym}${cost.toFixed(2)}`,
        primaryLabel: 'Total Cost',
        rows: [
          ['Units Input', `${u.toFixed(2)} units`],
          ['kWh',         `${kwhResult.toFixed(3)} kWh`],
          ['Rate',        `${sym}${r.toFixed(4)} / kWh`],
          ['Total Cost',  `${sym}${cost.toFixed(2)}`],
          ['Per Unit',    `${sym}${(cost / u).toFixed(4)} / unit`],
        ],
      });
    } else if (mode === 'cost-to-kwh') {
      const c = parseFloat(kwh); // reuse kwh field for cost input
      if (isNaN(c) || r === 0) return;
      const kwhResult = c / r;
      setResult({
        primary: `${kwhResult.toFixed(3)} kWh`,
        primaryLabel: 'Energy Equivalent',
        rows: [
          ['Budget Input', `${sym}${c.toFixed(2)}`],
          ['Rate',         `${sym}${r.toFixed(4)} / kWh`],
          ['kWh Afforded', `${kwhResult.toFixed(3)} kWh`],
          ['Units',        `${(kwhResult * upk).toFixed(2)} units`],
          ['Watt-hours',   `${(kwhResult * 1000).toFixed(1)} Wh`],
        ],
      });
    }
  };

  const inputStyle = (focused) => ({
    width: '100%', background: T.surfaceAlt,
    border: `1px solid ${focused ? 'rgba(0,200,160,0.4)' : T.border}`,
    borderRadius: 10, padding: '11px 14px',
    color: T.text, fontFamily: T.mono, fontSize: 15,
    outline: 'none', transition: 'border-color .15s',
  });

  const [focused, setFocused] = useState({});

  return (
    <section style={{ padding: '5rem 2rem', background: T.bg }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <SectionLabel color={T.amber}>Energy Calculator</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-1px', color: T.text, marginBottom: '0.75rem' }}>
            Convert & Calculate Energy Costs
          </h2>
          <p style={{ fontSize: 14, color: T.textSub, maxWidth: 480, margin: '0 auto' }}>
            Convert between kWh, units, and real electricity costs using your local tariff rate.
          </p>
        </div>

        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20, padding: '2rem',
        }}>
          {/* Mode selector */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.75rem', background: T.surfaceAlt, borderRadius: 12, padding: 6 }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setResult(null); }}
                style={{
                  flex: '1 1 auto', padding: '9px 14px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', fontFamily: T.font, fontWeight: 600, fontSize: 12,
                  background: mode === m.id ? T.teal : 'transparent',
                  color: mode === m.id ? '#060d14' : T.textSub,
                  transition: 'all .15s',
                }}>{m.label}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Left: inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Primary value input */}
              {(mode === 'kwh-to-cost' || mode === 'cost-to-kwh') && (
                <div>
                  <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 6, letterSpacing: '.06em' }}>
                    {mode === 'kwh-to-cost' ? 'ENERGY (kWh)' : 'BUDGET (cost amount)'}
                  </label>
                  <input type="number" min="0" step="any" placeholder={mode === 'kwh-to-cost' ? 'e.g. 150' : 'e.g. 25.00'}
                    value={kwh} onChange={e => setKwh(e.target.value)}
                    onFocus={() => setFocused(f => ({...f, kwh: true}))}
                    onBlur={() => setFocused(f => ({...f, kwh: false}))}
                    style={inputStyle(focused.kwh)}
                  />
                </div>
              )}

              {(mode === 'units-to-kwh' || mode === 'units-to-cost') && (
                <div>
                  <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 6, letterSpacing: '.06em' }}>ELECTRICITY UNITS</label>
                  <input type="number" min="0" step="any" placeholder="e.g. 150"
                    value={units} onChange={e => setUnits(e.target.value)}
                    onFocus={() => setFocused(f => ({...f, units: true}))}
                    onBlur={() => setFocused(f => ({...f, units: false}))}
                    style={inputStyle(focused.units)}
                  />
                </div>
              )}

              {/* Units per kWh */}
              <div>
                <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 6, letterSpacing: '.06em' }}>UNITS PER kWh</label>
                <input type="number" min="0.01" step="0.01" placeholder="1.00"
                  value={unitsPerKwh} onChange={e => setUnitsPerKwh(e.target.value)}
                  onFocus={() => setFocused(f => ({...f, upk: true}))}
                  onBlur={() => setFocused(f => ({...f, upk: false}))}
                  style={inputStyle(focused.upk)}
                />
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>Usually 1 unit = 1 kWh. Some regions differ.</div>
              </div>

              {/* Rate */}
              {mode !== 'units-to-kwh' && (
                <div>
                  <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 6, letterSpacing: '.06em' }}>RATE (per kWh)</label>
                  <input type="number" min="0" step="0.001" placeholder="0.15"
                    value={rate} onChange={e => setRate(e.target.value)}
                    onFocus={() => setFocused(f => ({...f, rate: true}))}
                    onBlur={() => setFocused(f => ({...f, rate: false}))}
                    style={inputStyle(focused.rate)}
                  />
                </div>
              )}

              {/* Currency */}
              <div>
                <label style={{ fontSize: 11, color: T.textSub, display: 'block', marginBottom: 6, letterSpacing: '.06em' }}>CURRENCY</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  style={{ ...inputStyle(false), cursor: 'pointer' }}>
                  {CURRENCIES.map(c => <option key={c} value={c} style={{ background: T.surfaceAlt }}>{c}</option>)}
                </select>
              </div>

              <button onClick={calculate}
                style={{
                  marginTop: 4, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: T.teal, color: '#060d14', fontFamily: T.font, fontWeight: 700, fontSize: 14,
                  transition: 'box-shadow .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(0,200,160,0.4)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >Calculate →</button>
            </div>

            {/* Right: result */}
            <div style={{
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 14, padding: '1.5rem',
              display: 'flex', flexDirection: 'column', justifyContent: result ? 'flex-start' : 'center', alignItems: result ? 'flex-start' : 'center',
              minHeight: 280,
            }}>
              {result ? (
                <>
                  <div style={{ fontSize: 11, color: T.textSub, letterSpacing: '.08em', marginBottom: 8 }}>{result.primaryLabel.toUpperCase()}</div>
                  <div style={{ fontSize: 38, fontWeight: 800, fontFamily: T.mono, color: T.teal, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
                    {result.primary}
                  </div>
                  <div style={{ width: '100%', borderTop: `1px solid ${T.border}`, paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.rows.map(([label, value], i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: T.textSub }}>{label}</span>
                        <span style={{ fontSize: 12, fontFamily: T.mono, color: T.text, fontWeight: 700 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>⚡</div>
                  <div style={{ fontSize: 13, color: T.textMuted }}>Enter values and click Calculate to see the breakdown.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 4 — APPLIANCE CONSUMPTION GRAPH
// ════════════════════════════════════════════════════════════════════════════════
function ConsumptionGraph() {
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('avg');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovBar, setHovBar] = useState(null);

  useEffect(() => {
    fetch(`${API}/appliance-breakdown`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        setData(d);
        setSelectedDate(d[0]?.date || null);
        setLoading(false);
      })
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
    <section style={{ padding: '5rem 2rem', background: T.surface, borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <SectionLabel color={T.coral}>Consumption Breakdown</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-1px', color: T.text, marginBottom: '0.5rem' }}>
              Appliance Energy Usage
            </h2>
            <p style={{ fontSize: 14, color: T.textSub }}>See exactly which device is costing you the most — by day.</p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: T.surfaceAlt, borderRadius: 8, padding: 3, border: `1px solid ${T.border}` }}>
              {[['avg','Avg kW'],['total','Total kW']].map(([v, l]) => (
                <button key={v} onClick={() => setView(v)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontFamily: T.font, fontWeight: 600, fontSize: 12,
                    background: view === v ? T.coral : 'transparent',
                    color: view === v ? '#fff' : T.textSub,
                    transition: 'all .15s',
                  }}>{l}</button>
              ))}
            </div>

            {/* Date picker */}
            {dates.map(d => (
              <button key={d} onClick={() => setSelectedDate(d)}
                style={{
                  padding: '7px 14px', borderRadius: 20, border: `1px solid ${selectedDate === d ? T.teal : T.border}`,
                  background: selectedDate === d ? T.tealSoft : 'transparent',
                  color: selectedDate === d ? T.teal : T.textSub,
                  cursor: 'pointer', fontFamily: T.font, fontWeight: 600, fontSize: 12,
                  transition: 'all .15s',
                }}>{d}</button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[100,70,85,55,90].map((w,i) => (
              <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 6, background: `linear-gradient(90deg, ${T.border} 25%, ${T.surfaceAlt} 50%, ${T.border} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', animationDelay: `${i*0.12}s` }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: T.coralSoft, border: `1px solid ${T.coral}`, borderRadius: 10, padding: '1rem', color: T.coral, fontSize: 14 }}>
            Failed to load: {error}
          </div>
        )}

        {!loading && !error && rec && (
          <>
            {/* Top stat highlight */}
            {topAppliance && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
                <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', borderLeft: `3px solid ${topAppliance.color}` }}>
                  <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 4 }}>TOP CONSUMER</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: topAppliance.color }}>{topAppliance.name}</div>
                  <div style={{ fontSize: 18, fontFamily: T.mono, fontWeight: 700, color: T.text, marginTop: 2 }}>{topAppliance.value} kW</div>
                </div>
                <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', borderLeft: `3px solid ${T.teal}` }}>
                  <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 4 }}>TOTAL ({view === 'avg' ? 'AVG' : 'SUM'})</div>
                  <div style={{ fontSize: 18, fontFamily: T.mono, fontWeight: 700, color: T.text, marginTop: 2 }}>
                    {chartData.reduce((s, d) => s + d.value, 0).toFixed(2)} kW
                  </div>
                </div>
                <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', borderLeft: `3px solid ${T.amber}` }}>
                  <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 4 }}>APPLIANCES</div>
                  <div style={{ fontSize: 18, fontFamily: T.mono, fontWeight: 700, color: T.text, marginTop: 2 }}>{chartData.length}</div>
                </div>
                <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', borderLeft: `3px solid ${T.purple}` }}>
                  <div style={{ fontSize: 10, color: T.textSub, letterSpacing: '.07em', marginBottom: 4 }}>DATE</div>
                  <div style={{ fontSize: 15, fontFamily: T.mono, fontWeight: 700, color: T.text, marginTop: 2 }}>{selectedDate}</div>
                </div>
              </div>
            )}

            {/* Bar chart */}
            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 16, padding: '1.5rem' }}>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
                  onMouseLeave={() => setHovBar(null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.textMuted} vertical={false} />
                  <XAxis dataKey="name" stroke={T.textMuted}
                    tick={{ fontSize: 11, fill: T.textSub, fontFamily: T.font }}
                    angle={-35} textAnchor="end" interval={0}
                  />
                  <YAxis stroke={T.textMuted} tick={{ fontSize: 11, fill: T.textSub, fontFamily: T.mono }}
                    tickFormatter={v => `${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,200,160,0.05)' }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}
                    onMouseEnter={(_, i) => setHovBar(i)}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i}
                        fill={entry.color}
                        opacity={hovBar === null || hovBar === i ? 1 : 0.35}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: '1rem' }}>
              {chartData.map((d, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: T.surfaceAlt, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.textSub, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontFamily: T.mono, fontWeight: 700, color: T.text }}>{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

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

      <div style={{ background: T.bg, color: T.text, fontFamily: T.font, minHeight: '100vh', paddingBottom: '5rem' }}>
        <HeroSection summary={summary} navigate={navigate} />
        <AboutSection />
        <CalculatorSection />
        <ConsumptionGraph />
      </div>
    </>
  );
}