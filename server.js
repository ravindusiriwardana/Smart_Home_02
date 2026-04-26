import express from 'express';
import cors from 'cors';
import { connectToMongoDB, client } from './mongodb.config.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = process.env.PORT || 3001;

const APPLIANCE_KEYS = [
  'Dishwasher [kW]','Furnace 1 [kW]','Furnace 2 [kW]','Home office [kW]',
  'Fridge [kW]','Wine cellar [kW]','Garage door [kW]','Kitchen 12 [kW]',
  'Kitchen 14 [kW]','Kitchen 38 [kW]','Barn [kW]','Well [kW]',
  'Microwave [kW]','Living room [kW]',
];

// ── Helper: get DB + collection safely ──────────────────────────────────────
// FIX: wrapped in a helper so every route uses the same verified reference
// and we can log the real error if client isn't connected yet.
function getEnergyCollection() {
  if (!client) throw new Error('MongoDB client not initialised');
  return client.db('SmartHomeEnergyDB').collection('EnergyData');
}

// ── Swagger ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Smart Home API', version: '1.0.0', description: 'Smart Home energy data API' },
    servers: [{ url: 'http://localhost:3001', description: 'Development server' }],
  },
  apis: ['./server.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());
app.use(express.json());

// ── Start server only after MongoDB is ready ─────────────────────────────────
connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // FIX: exit so you see the real DB error immediately
  });

app.get('/', (req, res) => res.send('Smart Home Server is running!'));

// ── Devices ──────────────────────────────────────────────────────────────────
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await client.db('smartHomeDB').collection('devices').find({}).toArray();
    res.json(devices);
  } catch (error) {
    console.error('GET /api/devices:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const result = await client.db('smartHomeDB').collection('devices').insertOne(req.body);
    res.json(result);
  } catch (error) {
    console.error('POST /api/devices:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Sensor Data ───────────────────────────────────────────────────────────────
app.get('/api/sensor-data', async (req, res) => {
  try {
    const data = await getEnergyCollection().find({}).limit(100).toArray();
    res.json(data);
  } catch (error) {
    console.error('GET /api/sensor-data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics: Summary ────────────────────────────────────────────────────────
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const col = getEnergyCollection();

    // FIX: Use MongoDB aggregation instead of pulling all docs into memory.
    // This is faster and avoids the 5000-doc limit cutting your data short.
    const [agg] = await col.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalUse:     { $sum: { $ifNull: ['$use [kW]', 0] } },
          totalGen:     { $sum: { $ifNull: ['$gen [kW]', 0] } },
          maxUse:       { $max: { $ifNull: ['$use [kW]', 0] } },
          // FIX: field is 'temperature', not 'Temperature' — check your actual docs
          avgTemp:      { $avg: { $ifNull: ['$temperature', 0] } },
          // FIX: humidity in your data is 0–1 so multiply by 100
          avgHumidity:  { $avg: { $ifNull: ['$humidity', 0] } },
        },
      },
    ]).toArray();

    if (!agg) {
      return res.json({
        totalRecords: 0, totalUse: 0, totalGen: 0,
        netFromGrid: 0, selfSufficiencyPct: 0,
        avgUse: 0, maxUse: 0, avgTemp: 0, avgHumidity: 0,
      });
    }

    res.json({
      totalRecords:       agg.totalRecords,
      totalUse:           parseFloat(agg.totalUse.toFixed(2)),
      totalGen:           parseFloat(agg.totalGen.toFixed(2)),
      netFromGrid:        parseFloat((agg.totalUse - agg.totalGen).toFixed(2)),
      selfSufficiencyPct: agg.totalUse > 0
        ? parseFloat(((agg.totalGen / agg.totalUse) * 100).toFixed(1))
        : 0,
      avgUse:     parseFloat((agg.totalUse / agg.totalRecords).toFixed(4)),
      maxUse:     parseFloat(agg.maxUse.toFixed(2)),
      avgTemp:    parseFloat(agg.avgTemp.toFixed(1)),
      // FIX: multiply by 100 if stored as 0.0–1.0 fraction
      avgHumidity: parseFloat((agg.avgHumidity * 100).toFixed(1)),
    });
  } catch (error) {
    console.error('GET /api/analytics/summary:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics: Daily Comparison ───────────────────────────────────────────────
app.get('/api/analytics/daily-comparison', async (req, res) => {
  try {
    const col = getEnergyCollection();

    // FIX: aggregate in MongoDB — group by the date portion of the 'time' field
    const agg = await col.aggregate([
      {
        $group: {
          _id: { $substr: ['$time', 0, 10] }, // "YYYY-MM-DD"
          totalUse: { $sum: { $ifNull: ['$use [kW]', 0] } },
          totalGen: { $sum: { $ifNull: ['$gen [kW]', 0] } },
          count:    { $sum: 1 },
          maxUse:   { $max: { $ifNull: ['$use [kW]', 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]).toArray();

    const result = agg.map(d => ({
      date:     d._id,
      totalUse: parseFloat(d.totalUse.toFixed(2)),
      totalGen: parseFloat(d.totalGen.toFixed(2)),
      netLoad:  parseFloat((d.totalUse - d.totalGen).toFixed(2)),
      avgUse:   parseFloat((d.totalUse / d.count).toFixed(4)),
      maxUse:   parseFloat(d.maxUse.toFixed(2)),
    }));

    res.json(result);
  } catch (error) {
    console.error('GET /api/analytics/daily-comparison:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics: Hourly Averages ────────────────────────────────────────────────
app.get('/api/analytics/hourly-averages', async (req, res) => {
  try {
    const col = getEnergyCollection();

    const agg = await col.aggregate([
      {
        $addFields: {
          // FIX: extract hour number directly in the aggregation pipeline
          hourNum: {
            $toInt: { $substr: [{ $arrayElemAt: [{ $split: ['$time', ' '] }, 1] }, 0, 2] },
          },
        },
      },
      {
        $group: {
          _id:      '$hourNum',
          totalUse: { $sum: { $ifNull: ['$use [kW]', 0] } },
          totalGen: { $sum: { $ifNull: ['$gen [kW]', 0] } },
          count:    { $sum: 1 },
          maxUse:   { $max: { $ifNull: ['$use [kW]', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const result = agg.map(h => ({
      hour:   h._id,
      avgUse: parseFloat((h.totalUse / h.count).toFixed(4)),
      avgGen: parseFloat((h.totalGen / h.count).toFixed(4)),
      maxUse: parseFloat(h.maxUse.toFixed(2)),
    }));

    res.json(result);
  } catch (error) {
    console.error('GET /api/analytics/hourly-averages:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics: Peak Hours ─────────────────────────────────────────────────────
app.get('/api/analytics/peak-hours', async (req, res) => {
  try {
    const col = getEnergyCollection();

    const agg = await col.aggregate([
      {
        $addFields: {
          hourNum: {
            $toInt: { $substr: [{ $arrayElemAt: [{ $split: ['$time', ' '] }, 1] }, 0, 2] },
          },
        },
      },
      {
        $group: {
          _id:      '$hourNum',
          totalUse: { $sum: { $ifNull: ['$use [kW]', 0] } },
          count:    { $sum: 1 },
          maxUse:   { $max: { $ifNull: ['$use [kW]', 0] } },
        },
      },
      { $sort: { totalUse: -1 } }, // FIX: sort by highest total, not avgUse
    ]).toArray();

    const result = agg.map(h => ({
      hour:   h._id,
      avgUse: parseFloat((h.totalUse / h.count).toFixed(4)),
      maxUse: parseFloat(h.maxUse.toFixed(2)),
    }));

    res.json(result);
  } catch (error) {
    console.error('GET /api/analytics/peak-hours:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics: Appliance Breakdown ───────────────────────────────────────────
app.get('/api/analytics/appliance-breakdown', async (req, res) => {
  try {
    const col = getEnergyCollection();

    // FIX: build the $group stage dynamically from APPLIANCE_KEYS
    const groupStage = { _id: { $substr: ['$time', 0, 10] }, count: { $sum: 1 } };
    APPLIANCE_KEYS.forEach(k => {
      const safe = k.replace(/[\[\]\s]/g, '_');
      groupStage[`${safe}_total`] = { $sum: { $ifNull: [`$${k}`, 0] } };
    });

    const agg = await col.aggregate([
      { $group: groupStage },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]).toArray();

    const result = agg.map(d => {
      const entry = { date: d._id };
      APPLIANCE_KEYS.forEach(k => {
        const safe = k.replace(/[\[\]\s]/g, '_');
        const total = d[`${safe}_total`] || 0;
        entry[`${k}_total`] = parseFloat(total.toFixed(2));
        entry[`${k}_avg`]   = parseFloat((total / (d.count || 1)).toFixed(4));
      });
      return entry;
    });

    res.json(result);
  } catch (error) {
    console.error('GET /api/analytics/appliance-breakdown:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics: Solar vs Consumption ──────────────────────────────────────────
app.get('/api/analytics/solar-vs-consumption', async (req, res) => {
  try {
    const col = getEnergyCollection();

    // FIX: original code used 'Solar [kW]' for gen but summary uses 'gen [kW]'
    // Check your actual MongoDB field name — using both with $ifNull as fallback
    const agg = await col.aggregate([
      {
        $group: {
          _id:      { $substr: ['$time', 0, 10] },
          totalConsumption: { $sum: { $ifNull: ['$use [kW]', 0] } },
          totalSolar: {
            $sum: {
              $ifNull: [
                '$Solar [kW]',
                { $ifNull: ['$gen [kW]', 0] }, // fallback if field differs
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]).toArray();

    const result = agg.map(d => ({
      date:               d._id,
      totalConsumption:   parseFloat(d.totalConsumption.toFixed(2)),
      totalSolar:         parseFloat(d.totalSolar.toFixed(2)),
      netFromGrid:        parseFloat((d.totalConsumption - d.totalSolar).toFixed(2)),
      selfSufficiencyPct: d.totalConsumption > 0
        ? parseFloat(((d.totalSolar / d.totalConsumption) * 100).toFixed(1))
        : 0,
    }));

    res.json(result);
  } catch (error) {
    console.error('GET /api/analytics/solar-vs-consumption:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Analytics: Weather Impact ─────────────────────────────────────────────────
app.get('/api/analytics/weather-impact', async (req, res) => {
  try {
    const col = getEnergyCollection();

    const agg = await col.aggregate([
      {
        $group: {
          _id:         { $substr: ['$time', 0, 10] },
          avgUse:      { $avg: { $ifNull: ['$use [kW]', 0] } },
          avgTemp:     { $avg: { $ifNull: ['$temperature', 0] } },
          maxTemp:     { $max: { $ifNull: ['$temperature', 0] } },
          minTemp:     { $min: { $ifNull: ['$temperature', 0] } },
          // FIX: multiply humidity by 100 if stored as 0–1 fraction
          avgHumidity: { $avg: { $multiply: [{ $ifNull: ['$humidity', 0] }, 100] } },
          avgWind:     { $avg: { $ifNull: ['$windSpeed', 0] } },
          avgCloud:    { $avg: { $ifNull: ['$cloudCover', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const result = agg.map(d => ({
      date:        d._id,
      avgUse:      parseFloat(d.avgUse.toFixed(4)),
      avgTemp:     parseFloat(d.avgTemp.toFixed(1)),
      maxTemp:     parseFloat(d.maxTemp.toFixed(1)),
      minTemp:     parseFloat(d.minTemp.toFixed(1)),
      avgHumidity: parseFloat(d.avgHumidity.toFixed(1)),
      avgWind:     parseFloat((d.avgWind || 0).toFixed(1)),
      avgCloud:    parseFloat((d.avgCloud || 0).toFixed(1)),
    }));

    res.json(result);
  } catch (error) {
    console.error('GET /api/analytics/weather-impact:', error.message);
    res.status(500).json({ error: error.message });
  }
});