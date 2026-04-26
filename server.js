import express from 'express';
import cors from 'cors';
import { connectToMongoDB, client } from './mongodb.config.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = process.env.PORT || 3001;

// APPLIANCE_KEYS for analytics
const APPLIANCE_KEYS = [
  'Dishwasher [kW]','Furnace 1 [kW]','Furnace 2 [kW]','Home office [kW]',
  'Fridge [kW]','Wine cellar [kW]','Garage door [kW]','Kitchen 12 [kW]',
  'Kitchen 14 [kW]','Kitchen 38 [kW]','Barn [kW]','Well [kW]',
  'Microwave [kW]','Living room [kW]',
];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Home API',
      version: '1.0.0',
      description: 'API for Smart Home sensor data and device management',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(console.error);

// Example route
app.get('/', (req, res) => {
  res.send('Smart Home Server is running!');
});

// API Routes for Devices
app.get('/api/devices', async (req, res) => {
  try {
    const db = client.db('smartHomeDB');
    const devices = await db.collection('devices').find({}).toArray();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/devices', async (req, res) => {
  try {
    const db = client.db('smartHomeDB');
    const result = await db.collection('devices').insertOne(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes for Sensor Data (e.g., from HomeC.csv)
app.get('/api/sensor-data', async (req, res) => {
  try {
    const db = client.db('SmartHomeEnergyDB');
    const data = await db.collection('EnergyData').find({}).limit(100).toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics API Endpoints
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const db = client.db('SmartHomeEnergyDB');
    const data = await db.collection('EnergyData').find({}).limit(5000).toArray();
    
    if (!data || data.length === 0) {
      return res.json({ totalRecords: 0, totalUse: 0, totalGen: 0, netFromGrid: 0, selfSufficiencyPct: 0, avgUse: 0, maxUse: 0, avgTemp: 0, avgHumidity: 0 });
    }
    
    const totalUse = data.reduce((sum, d) => sum + (d['use [kW]'] || 0), 0);
    const totalGen = data.reduce((sum, d) => sum + (d['gen [kW]'] || 0), 0);
    const maxUse = Math.max(...data.map(d => d['use [kW]'] || 0));
    const avgTemp = data.reduce((sum, d) => sum + (d.temperature || 0), 0) / data.length;
    const avgHumidity = data.reduce((sum, d) => sum + (d.humidity || 0), 0) / data.length;
    
    res.json({
      totalRecords: data.length,
      totalUse: parseFloat(totalUse.toFixed(2)),
      totalGen: parseFloat(totalGen.toFixed(2)),
      netFromGrid: parseFloat((totalUse - totalGen).toFixed(2)),
      selfSufficiencyPct: totalUse > 0 ? parseFloat(((totalGen / totalUse) * 100).toFixed(1)) : 0,
      avgUse: parseFloat((totalUse / data.length).toFixed(4)),
      maxUse: parseFloat(maxUse.toFixed(2)),
      avgTemp: parseFloat(avgTemp.toFixed(1)),
      avgHumidity: parseFloat((avgHumidity * 100).toFixed(1)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/daily-comparison', async (req, res) => {
  try {
    const db = client.db('SmartHomeEnergyDB');
    const data = await db.collection('EnergyData').find({}).limit(5000).toArray();
    
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Group by date
    const dailyMap = {};
    data.forEach(d => {
      const date = d.time?.split(' ')[0] || 'Unknown';
      if (!dailyMap[date]) {
        dailyMap[date] = { date, totalUse: 0, totalGen: 0, count: 0, maxUse: 0 };
      }
      dailyMap[date].totalUse += d['use [kW]'] || 0;
      dailyMap[date].totalGen += d['gen [kW]'] || 0;
      dailyMap[date].count += 1;
      dailyMap[date].maxUse = Math.max(dailyMap[date].maxUse, d['use [kW]'] || 0);
    });
    
    const result = Object.values(dailyMap).map(d => ({
      date: d.date,
      totalUse: parseFloat(d.totalUse.toFixed(2)),
      totalGen: parseFloat(d.totalGen.toFixed(2)),
      netLoad: parseFloat((d.totalUse - d.totalGen).toFixed(2)),
      avgUse: parseFloat((d.totalUse / d.count).toFixed(4)),
      maxUse: parseFloat(d.maxUse.toFixed(2)),
    })).slice(0, 30);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/hourly-averages', async (req, res) => {
  try {
    const db = client.db('SmartHomeEnergyDB');
    const data = await db.collection('EnergyData').find({}).limit(5000).toArray();
    
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Group by hour
    const hourlyMap = {};
    data.forEach(d => {
      const hour = parseInt(d.time?.split(' ')[1]?.split(':')[0]) || 0;
      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { hour, totalUse: 0, totalGen: 0, count: 0, maxUse: 0 };
      }
      hourlyMap[hour].totalUse += d['use [kW]'] || 0;
      hourlyMap[hour].totalGen += d['gen [kW]'] || 0;
      hourlyMap[hour].count += 1;
      hourlyMap[hour].maxUse = Math.max(hourlyMap[hour].maxUse, d['use [kW]'] || 0);
    });
    
    const result = Object.values(hourlyMap).map(h => ({
      hour: h.hour,
      avgUse: parseFloat((h.totalUse / h.count).toFixed(4)),
      avgGen: parseFloat((h.totalGen / h.count).toFixed(4)),
      maxUse: parseFloat(h.maxUse.toFixed(2)),
    })).sort((a, b) => a.hour - b.hour);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/peak-hours', async (req, res) => {
  try {
    const db = client.db('SmartHomeEnergyDB');
    const data = await db.collection('EnergyData').find({}).limit(5000).toArray();
    
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Group by hour
    const hourlyMap = {};
    data.forEach(d => {
      const hour = parseInt(d.time?.split(' ')[1]?.split(':')[0]) || 0;
      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { hour, totalUse: 0, count: 0, maxUse: 0 };
      }
      hourlyMap[hour].totalUse += d['use [kW]'] || 0;
      hourlyMap[hour].count += 1;
      hourlyMap[hour].maxUse = Math.max(hourlyMap[hour].maxUse, d['use [kW]'] || 0);
    });
    
    const result = Object.values(hourlyMap).map(h => ({
      hour: h.hour,
      avgUse: parseFloat((h.totalUse / h.count).toFixed(4)),
      maxUse: parseFloat(h.maxUse.toFixed(2)),
    })).sort((a, b) => b.avgUse - a.avgUse);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/appliance-breakdown', async (req, res) => {
  try {
    const db = client.db('SmartHomeEnergyDB');
    const data = await db.collection('EnergyData').find({}).limit(5000).toArray();
    
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Group by date
    const dailyMap = {};
    data.forEach(d => {
      const date = d.time?.split(' ')[0] || 'Unknown';
      if (!dailyMap[date]) {
        dailyMap[date] = { date };
        APPLIANCE_KEYS.forEach(k => {
          dailyMap[date][`${k}_total`] = 0;
        });
      }
      APPLIANCE_KEYS.forEach(k => {
        dailyMap[date][`${k}_total`] += d[k] || 0;
      });
    });
    
    const result = Object.values(dailyMap).map(d => {
      const entry = { date: d.date };
      APPLIANCE_KEYS.forEach(k => {
        entry[`${k}_avg`] = parseFloat((d[`${k}_total`] / 1).toFixed(4));
        entry[`${k}_total`] = parseFloat(d[`${k}_total`].toFixed(2));
      });
      return entry;
    }).slice(0, 30);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/solar-vs-consumption', async (req, res) => {
  try {
    const db = client.db('SmartHomeEnergyDB');
    const data = await db.collection('EnergyData').find({}).limit(5000).toArray();
    
    if (!data || data.length === 0) {
      return res.json([]);
    }
    
    // Group by date
    const dailyMap = {};
    data.forEach(d => {
      const date = d.time?.split(' ')[0] || 'Unknown';
      if (!dailyMap[date]) {
        dailyMap[date] = { date, totalUse: 0, totalGen: 0, count: 0 };
      }
      dailyMap[date].totalUse += d['use [kW]'] || 0;
      dailyMap[date].totalGen += d['Solar [kW]'] || 0;
      dailyMap[date].count += 1;
    });
    
    const result = Object.values(dailyMap).map(d => ({
      date: d.date,
      consumption: parseFloat(d.totalUse.toFixed(2)),
      solar: parseFloat(d.totalGen.toFixed(2)),
      selfSufficiency: parseFloat(((d.totalGen / d.totalUse) * 100).toFixed(1)),
    })).slice(0, 30);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});