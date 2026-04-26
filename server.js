import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const PORT = Number(process.env.PORT || 3001);
const DB_NAME = process.env.MONGO_DB || 'smartHomeDB';
const COLLECTION_NAME = process.env.MONGO_COLLECTION || 'sensorData';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 60_000);
const MAX_DOCS = Number(process.env.MAX_DOCS || 10_000);
const MAX_DAYS = Number(process.env.MAX_DAYS || 7);
const MONGO_URI = process.env.MONGO_URI;

const APPLIANCE_KEYS = [
  'Dishwasher [kW]',
  'Furnace 1 [kW]',
  'Furnace 2 [kW]',
  'Home office [kW]',
  'Fridge [kW]',
  'Wine cellar [kW]',
  'Garage door [kW]',
  'Kitchen 12 [kW]',
  'Kitchen 14 [kW]',
  'Kitchen 38 [kW]',
  'Barn [kW]',
  'Well [kW]',
  'Microwave [kW]',
  'Living room [kW]',
];

const AREAS = [
  { id: 'living_room', keys: ['Living room [kW]'] },
  { id: 'kitchen', keys: ['Kitchen 12 [kW]', 'Kitchen 14 [kW]', 'Kitchen 38 [kW]'] },
  { id: 'garage', keys: ['Garage door [kW]'] },
  { id: 'home_office', keys: ['Home office [kW]'] },
  { id: 'furnace', keys: ['Furnace 1 [kW]', 'Furnace 2 [kW]'] },
  { id: 'fridge', keys: ['Fridge [kW]'] },
  { id: 'microwave', keys: ['Microwave [kW]'] },
];

function toNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pickFirst(doc, candidates) {
  for (const k of candidates) if (doc && doc[k] != null) return doc[k];
  return undefined;
}

function getDate(doc) {
  // Many smart-home datasets store timestamp as a single field like `localminute`.
  // We support both split date/time fields and combined timestamp fields.
  const direct = pickFirst(doc, ['date', 'Date', 'DATE']);
  if (direct != null) return direct;

  // Some datasets store `time` as unix epoch seconds (e.g. 1451624400)
  const epoch = pickFirst(doc, ['time', 'Time', 'TIME']);
  if (epoch != null) {
    const n = Number(epoch);
    if (Number.isFinite(n) && n > 0) {
      const d = new Date(n * 1000);
      // YYYY-MM-DD (UTC)
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  const ts = pickFirst(doc, ['localminute', 'Localminute', 'LocalMinute', 'localMinute', 'timestamp', 'Timestamp']);
  if (ts == null) return null;

  const s = String(ts);
  // "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T]/);
  return m ? m[1] : s.slice(0, 10);
}

function getTime(doc) {
  const direct = pickFirst(doc, ['time', 'Time', 'TIME']);
  if (direct != null) {
    // If it's epoch seconds, convert to HH:mm (UTC) so hourly charts work.
    const n = Number(direct);
    if (Number.isFinite(n) && n > 0) {
      const d = new Date(n * 1000);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return direct;
  }

  const ts = pickFirst(doc, ['localminute', 'Localminute', 'LocalMinute', 'localMinute', 'timestamp', 'Timestamp']);
  if (ts == null) return null;

  const s = String(ts);
  const m = s.match(/^[\d-]{10}[ T](\d{1,2}:\d{2})(?::\d{2})?/);
  return m ? m[1] : null;
}

function hourFromTime(t) {
  if (t == null) return null;
  const m = String(t).match(/^(\d{1,2})/);
  if (!m) return null;
  const h = Number(m[1]);
  return Number.isFinite(h) && h >= 0 && h <= 23 ? h : null;
}

function totalAppliances(doc, keys = APPLIANCE_KEYS) {
  // If the dataset provides an overall usage field, prefer it for "whole house"
  // calculations (it's typically more accurate than summing appliance sub-meters).
  if (keys === APPLIANCE_KEYS) {
    const overall = pickFirst(doc, ['use [kW]', 'House overall [kW]']);
    if (overall != null) return toNum(overall);
  }
  let sum = 0;
  for (const k of keys) sum += toNum(doc?.[k]);
  return sum;
}

function solarGen(doc) {
  const v = pickFirst(doc, ['gen [kW]', 'Solar [kW]', 'Solar [kW/h]', 'Solar (kW)', 'solar', 'solar_kw', 'SolarGen [kW]']);
  return toNum(v);
}

function tempF(doc) {
  const v = pickFirst(doc, ['Temperature [°F]', 'Temperature (°F)', 'Temp [°F]', 'temp', 'Temp', 'temperature', 'Temperature']);
  return v == null ? null : Number(v);
}

function humidityPct(doc) {
  const v = pickFirst(doc, ['Humidity [%]', 'Humidity', 'humidity', 'RH', 'rh']);
  return v == null ? null : Number(v);
}

function windMph(doc) {
  const v = pickFirst(doc, ['Wind [mph]', 'Wind (mph)', 'wind', 'Wind', 'windSpeed', 'WindSpeed']);
  return v == null ? null : Number(v);
}

function cloudPct(doc) {
  const v = pickFirst(doc, ['Cloud [%]', 'Cloud', 'cloud', 'CloudCover', 'cloudCover']);
  return v == null ? null : Number(v);
}

async function loadAllDocs() {
  if (!MONGO_URI) {
    throw new Error('Missing MONGO_URI in environment');
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGO_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 15_000,
    });
  }

  const projection = Object.fromEntries(
    [
      ...APPLIANCE_KEYS,
      'date', 'Date', 'DATE',
      'time', 'Time', 'TIME',
      'use [kW]', 'House overall [kW]',
      'localminute', 'Localminute', 'LocalMinute', 'localMinute',
      'timestamp', 'Timestamp',
      'Solar [kW]', 'Solar [kW/h]', 'Solar (kW)', 'solar', 'solar_kw', 'SolarGen [kW]',
      'gen [kW]',
      'Temperature [°F]', 'Temperature (°F)', 'Temp [°F]', 'temp', 'Temp', 'temperature', 'Temperature',
      'Humidity [%]', 'Humidity', 'humidity', 'RH', 'rh',
      'Wind [mph]', 'Wind (mph)', 'wind', 'Wind', 'windSpeed', 'WindSpeed',
      'Cloud [%]', 'Cloud', 'cloud', 'CloudCover', 'cloudCover',
    ].map((k) => [k, 1]),
  );

  // With 500k+ rows, pulling everything is slow. We limit by time range (last N
  // days) so charts include multiple dates, and still cap by MAX_DOCS.
  const latestArr = await SensorData.aggregate([
    { $match: { time: { $exists: true, $ne: null } } },
    { $sort: { time: -1, _id: -1 } },
    { $limit: 1 },
    { $project: { time: 1 } },
  ]).allowDiskUse(true).exec();
  const latest = latestArr?.[0] || null;

  const latestTime = latest?.time != null ? Number(latest.time) : null;
  const days = Number.isFinite(MAX_DAYS) && MAX_DAYS > 0 ? MAX_DAYS : 7;
  const threshold = Number.isFinite(latestTime) ? (latestTime - days * 86400) : null;

  const limit = Number.isFinite(MAX_DOCS) && MAX_DOCS > 0 ? MAX_DOCS : 10_000;

  const match = Number.isFinite(threshold)
    ? { time: { $gte: threshold } }
    : {};

  // Use aggregation with allowDiskUse so large sorts don't fail even if the
  // Atlas user can't create indexes.
  const pipeline = [
    { $match: match },
    { $sort: { time: 1, _id: 1 } },
    { $limit: limit },
    { $project: projection },
  ];

  return await SensorData.aggregate(pipeline).allowDiskUse(true).exec();
}

function groupBy(arr, keyFn) {
  const m = new Map();
  for (const it of arr) {
    const k = keyFn(it);
    if (k == null) continue;
    const bucket = m.get(k);
    if (bucket) bucket.push(it);
    else m.set(k, [it]);
  }
  return m;
}

function mapBy(arr, keyFn) {
  const m = new Map();
  for (const it of arr) {
    const k = keyFn(it);
    if (k == null) continue;
    m.set(k, it);
  }
  return m;
}

function summarizeDocs(docs) {
  const totalRecords = docs.length;
  let totalUse = 0;
  let totalGen = 0;
  let maxUse = 0;
  let tempSum = 0;
  let tempN = 0;
  let humSum = 0;
  let humN = 0;

  for (const d of docs) {
    const use = totalAppliances(d);
    totalUse += use;
    totalGen += solarGen(d);
    if (use > maxUse) maxUse = use;
    const t = tempF(d);
    if (Number.isFinite(t)) { tempSum += t; tempN += 1; }
    const h = humidityPct(d);
    if (Number.isFinite(h)) { humSum += h; humN += 1; }
  }

  const netFromGrid = totalUse - totalGen;
  const selfSufficiencyPct = totalUse > 0 ? (Math.min(totalGen, totalUse) / totalUse) * 100 : 0;
  return {
    totalRecords,
    totalUse,
    totalGen,
    netFromGrid,
    selfSufficiencyPct,
    maxUse,
    avgTemp: tempN ? tempSum / tempN : null,
    avgHumidity: humN ? humSum / humN : null,
  };
}

function dailyRollup(docs) {
  const byDate = groupBy(docs, getDate);
  const out = [];
  for (const [date, recs] of byDate.entries()) {
    let totalUse = 0;
    let totalGen = 0;
    let maxUse = 0;
    let tempSum = 0; let tempN = 0;
    let humSum = 0; let humN = 0;
    let windSum = 0; let windN = 0;
    let cloudSum = 0; let cloudN = 0;

    for (const d of recs) {
      const use = totalAppliances(d);
      totalUse += use;
      totalGen += solarGen(d);
      if (use > maxUse) maxUse = use;
      const t = tempF(d);
      if (Number.isFinite(t)) { tempSum += t; tempN += 1; }
      const h = humidityPct(d);
      if (Number.isFinite(h)) { humSum += h; humN += 1; }
      const w = windMph(d);
      if (Number.isFinite(w)) { windSum += w; windN += 1; }
      const c = cloudPct(d);
      if (Number.isFinite(c)) { cloudSum += c; cloudN += 1; }
    }

    const avgUse = recs.length ? totalUse / recs.length : 0;
    const netFromGrid = totalUse - totalGen;
    const selfSufficiencyPct = totalUse > 0 ? (Math.min(totalGen, totalUse) / totalUse) * 100 : 0;
    const temps = recs.map((d) => tempF(d)).filter((x) => Number.isFinite(x));

    out.push({
      date,
      totalUse,
      totalGen,
      avgUse,
      maxUse,
      netFromGrid,
      selfSufficiencyPct,
      avgTemp: tempN ? tempSum / tempN : null,
      maxTemp: temps.length ? Math.max(...temps) : null,
      minTemp: temps.length ? Math.min(...temps) : null,
      avgHumidity: humN ? humSum / humN : null,
      avgWind: windN ? windSum / windN : null,
      avgCloud: cloudN ? cloudSum / cloudN : null,
    });
  }
  out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}

function topAppliances(docs, limit = 10) {
  const totals = new Map(APPLIANCE_KEYS.map((k) => [k, 0]));
  for (const d of docs) for (const k of APPLIANCE_KEYS) totals.set(k, (totals.get(k) || 0) + toNum(d?.[k]));
  return [...totals.entries()]
    .map(([name, total]) => ({ name: name.replace(' [kW]', ''), total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

function areaSummary(docs) {
  return AREAS
    .map((a) => ({ areaId: a.id, total: docs.reduce((s, d) => s + totalAppliances(d, a.keys), 0) }))
    .sort((x, y) => y.total - x.total);
}

function areaDaily(docs, keys) {
  const byDate = groupBy(docs, getDate);
  const out = [];
  for (const [date, recs] of byDate.entries()) {
    const totals = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const d of recs) for (const k of keys) totals[k] += toNum(d?.[k]);
    const total = keys.reduce((s, k) => s + totals[k], 0);
    const row = { date, total };
    for (const k of keys) row[`sub_${k.replace(' [kW]', '')}`] = totals[k];
    out.push(row);
  }
  out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}

function areaHourly(docs, keys) {
  const buckets = new Map();
  for (const d of docs) {
    const h = hourFromTime(getTime(d));
    if (h == null) continue;
    const b = buckets.get(h) || { n: 0, sums: Object.fromEntries(keys.map((k) => [k, 0])) };
    b.n += 1;
    for (const k of keys) b.sums[k] += toNum(d?.[k]);
    buckets.set(h, b);
  }
  const out = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const b = buckets.get(hour);
    if (!b) continue;
    const avgByKey = Object.fromEntries(keys.map((k) => [k, b.sums[k] / b.n]));
    const avg = keys.reduce((s, k) => s + avgByKey[k], 0);
    const row = { hour, avg };
    for (const k of keys) row[`sub_${k.replace(' [kW]', '')}`] = avgByKey[k];
    out.push(row);
  }
  return out;
}

function overallHourlyConsumption(docs) {
  const buckets = new Map(); // hour -> { n, sumUse }
  for (const d of docs) {
    const h = hourFromTime(getTime(d));
    if (h == null) continue;
    const b = buckets.get(h) || { n: 0, sumUse: 0 };
    b.n += 1;
    b.sumUse += totalAppliances(d);
    buckets.set(h, b);
  }
  const out = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const b = buckets.get(hour);
    if (!b) continue;
    out.push({ hour, avgUse: b.sumUse / b.n });
  }
  return out;
}

function overallHourlyByLastDays(docs, lastDates) {
  const byDate = groupBy(docs, getDate);
  const dates = (lastDates || []).filter(Boolean);
  const perDate = new Map();
  for (const date of dates) {
    const recs = byDate.get(date) || [];
    const buckets = new Map(); // hour -> { n, sumUse }
    for (const d of recs) {
      const h = hourFromTime(getTime(d));
      if (h == null) continue;
      const b = buckets.get(h) || { n: 0, sumUse: 0 };
      b.n += 1;
      b.sumUse += totalAppliances(d);
      buckets.set(h, b);
    }
    const hourly = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const b = buckets.get(hour);
      hourly.push({ hour, avgUse: b ? b.sumUse / b.n : 0 });
    }
    perDate.set(date, hourly);
  }

  // shape for recharts: [{hour, "2026-...": val, "2026-...": val}]
  const rows = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const row = { hour };
    for (const date of dates) {
      const arr = perDate.get(date) || [];
      row[date] = arr[hour]?.avgUse ?? 0;
    }
    rows.push(row);
  }
  return { dates, data: rows };
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => {
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - t0}ms)`);
  });
  next();
});

// Flexible schema: keys like "Dishwasher [kW]" contain spaces/brackets, so we
// store documents as-is (strict: false) and query via projections.
const sensorDataSchema = new mongoose.Schema({}, { strict: false, collection: COLLECTION_NAME });
const SensorData = mongoose.models.SensorData || mongoose.model('SensorData', sensorDataSchema);

// NOTE: We intentionally do not require creating indexes in Atlas, because
// many shared/free Atlas users don't have permissions to manage indexes.

// ──────────────────────────────────────────────────────────────────────────────
// Cache + precomputed aggregates
// ──────────────────────────────────────────────────────────────────────────────
let cache = {
  builtAt: 0,
  docsCount: 0,
  summary: null,
  dailyRollup: null, // full daily rollups
  overview: null,
  dailyComparison: null,
  applianceBreakdown: null,
  solar: null,
  weather: null,
  areaById: null, // Map(areaId -> { availableDates, dailyAllDates, hourlyByDate, kpiByDate })
};

async function buildCache() {
  const docs = await loadAllDocs();
  // eslint-disable-next-line no-console
  console.log(`[cache] building from ${docs.length.toLocaleString()} docs (MAX_DOCS=${MAX_DOCS.toLocaleString()})`);
  const summary = summarizeDocs(docs);
  const daily = dailyRollup(docs);
  const hourlyComparison = overallHourlyConsumption(docs);
  const last3Dates = daily.map((d) => d.date).filter(Boolean).slice(-3);
  const hourlyComparisonByDay = overallHourlyByLastDays(docs, last3Dates);

  // overview needs a smaller daily shape
  const overviewDaily = daily.map((d) => ({ date: d.date, totalUse: d.totalUse, totalGen: d.totalGen }));
  const overview = {
    summary,
    daily: overviewDaily,
    hourlyComparison,
    hourlyComparisonByDay,
    applianceTotals: topAppliances(docs, 10),
    areaSummary: areaSummary(docs),
  };

  const dailyComparison = daily.map((d) => ({ date: d.date, avgUse: d.avgUse, maxUse: d.maxUse }));

  // appliance breakdown (per day)
  const byDate = groupBy(docs, getDate);
  const applianceBreakdown = [];
  for (const [date, recs] of byDate.entries()) {
    const row = { date };
    for (const k of APPLIANCE_KEYS) {
      const sum = recs.reduce((s, d) => s + toNum(d?.[k]), 0);
      row[`${k}_total`] = sum;
      row[`${k}_avg`] = recs.length ? sum / recs.length : 0;
    }
    applianceBreakdown.push(row);
  }
  applianceBreakdown.sort((a, b) => String(a.date).localeCompare(String(b.date)));

  // solar + weather are just daily rollups reshaped
  const solar = daily.map((d) => ({
    date: d.date,
    totalConsumption: d.totalUse,
    totalSolar: d.totalGen,
    netFromGrid: d.netFromGrid,
    selfSufficiencyPct: d.selfSufficiencyPct,
  }));

  const weather = daily.map((d) => ({
    date: d.date,
    avgUse: d.avgUse,
    avgTemp: d.avgTemp,
    maxTemp: d.maxTemp,
    minTemp: d.minTemp,
    avgHumidity: d.avgHumidity,
    avgWind: d.avgWind,
    avgCloud: d.avgCloud,
  }));

  // precompute area views
  const availableDates = [...new Set(docs.map(getDate).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  const totalUseByDate = new Map();
  for (const d of docs) {
    const date = getDate(d);
    if (!date) continue;
    totalUseByDate.set(date, (totalUseByDate.get(date) || 0) + totalAppliances(d));
  }

  const areaById = new Map();
  for (const area of AREAS) {
    const dailyAllDates = areaDaily(docs, area.keys).map((row) => {
      const house = totalUseByDate.get(row.date) || 0;
      const shareOfHouse = house > 0 ? (row.total / house) * 100 : 0;
      return { ...row, shareOfHouse };
    });
    const dailyByDate = mapBy(dailyAllDates, (r) => r.date);

    const hourlyByDate = new Map();
    const kpiByDate = new Map();

    // build per-date hourly + kpi only once
    for (const date of ['all', ...availableDates]) {
      const filtered = date === 'all' ? docs : docs.filter((d) => String(getDate(d)) === String(date));

      hourlyByDate.set(date, areaHourly(filtered, area.keys));

      const total = filtered.reduce((s, d) => s + totalAppliances(d, area.keys), 0);
      const max = filtered.reduce((m, d) => Math.max(m, totalAppliances(d, area.keys)), 0);
      const avgPerRecord = filtered.length ? total / filtered.length : 0;
      const totalHouseFiltered = filtered.reduce((s, d) => s + totalAppliances(d), 0);
      const shareOfHouse = totalHouseFiltered > 0 ? (total / totalHouseFiltered) * 100 : 0;
      kpiByDate.set(date, { total, avgPerRecord, max, shareOfHouse });
    }

    areaById.set(area.id, {
      availableDates,
      dailyAllDates,
      dailyByDate,
      hourlyByDate,
      kpiByDate,
    });
  }

  cache = {
    builtAt: Date.now(),
    docsCount: docs.length,
    summary,
    dailyRollup: daily,
    overview,
    dailyComparison,
    applianceBreakdown,
    solar,
    weather,
    areaById,
  };
}

async function ensureCacheFresh() {
  if (cache.builtAt && Date.now() - cache.builtAt < CACHE_TTL_MS) return;
  await buildCache();
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/analytics/debug/sample-fields', async (_req, res) => {
  try {
    await ensureCacheFresh();
    const doc = await SensorData.findOne({}).lean().exec();
    if (!doc) return res.json({ ok: false, error: 'No documents found' });

    const keys = Object.keys(doc).sort();
    res.json({
      ok: true,
      totalKeys: keys.length,
      keys: keys.slice(0, 120),
      detected: {
        date: getDate(doc),
        time: getTime(doc),
      },
    });
  } catch (e) {
    console.error('[/api/analytics/debug/sample-fields] failed', e);
    res.status(500).json({ error: e?.message || 'debug failed' });
  }
});

app.get('/api/analytics/summary', async (_req, res) => {
  try {
    await ensureCacheFresh();
    res.json(cache.summary);
  } catch (e) {
    console.error('[/api/analytics/summary] failed', e);
    res.status(500).json({ error: e?.message || 'Failed to compute summary' });
  }
});

app.get('/api/analytics/overview', async (_req, res) => {
  try {
    await ensureCacheFresh();
    res.json(cache.overview);
  } catch (e) {
    console.error('[/api/analytics/overview] failed', e);
    res.status(500).json({ error: e?.message || 'Failed to compute overview' });
  }
});

app.get('/api/analytics/daily-comparison', async (_req, res) => {
  try {
    await ensureCacheFresh();
    res.json(cache.dailyComparison);
  } catch (e) {
    console.error('[/api/analytics/daily-comparison] failed', e);
    res.status(500).json({ error: e?.message || 'Failed to compute daily comparison' });
  }
});

app.get('/api/analytics/appliance-breakdown', async (_req, res) => {
  try {
    await ensureCacheFresh();
    res.json(cache.applianceBreakdown);
  } catch (e) {
    console.error('[/api/analytics/appliance-breakdown] failed', e);
    res.status(500).json({ error: e?.message || 'Failed to compute appliance breakdown' });
  }
});

app.get('/api/analytics/solar', async (req, res) => {
  try {
    await ensureCacheFresh();
    let days = cache.solar;
    if (req.query?.date && req.query.date !== 'all') days = days.filter((d) => String(d.date) === String(req.query.date));
    res.json(days);
  } catch (e) {
    console.error('[/api/analytics/solar] failed', e);
    res.status(500).json({ error: e?.message || 'Failed to compute solar view' });
  }
});

app.get('/api/analytics/weather', async (req, res) => {
  try {
    await ensureCacheFresh();
    let days = cache.weather;
    if (req.query?.date && req.query.date !== 'all') days = days.filter((d) => String(d.date) === String(req.query.date));
    res.json(days);
  } catch (e) {
    console.error('[/api/analytics/weather] failed', e);
    res.status(500).json({ error: e?.message || 'Failed to compute weather view' });
  }
});

app.get('/api/analytics/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    await ensureCacheFresh();

    const area = cache.areaById.get(areaId);
    if (!area) return res.status(404).json({ error: `Unknown areaId: ${areaId}` });

    const date = req.query?.date && req.query.date !== 'all' ? String(req.query.date) : 'all';
    const hourly = area.hourlyByDate.get(date) || [];
    const kpi = area.kpiByDate.get(date) || null;

    res.json({
      availableDates: area.availableDates,
      kpi,
      daily: area.dailyAllDates,
      hourly,
    });
  } catch (e) {
    console.error('[/api/analytics/area/:areaId] failed', e);
    res.status(500).json({ error: e?.message || 'Failed to compute area view' });
  }
});

app.listen(PORT, () => {
  console.log(`Analytics API listening on http://localhost:${PORT}`);
});