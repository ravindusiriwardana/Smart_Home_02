import express from 'express';
import cors from 'cors';
import { connectToMongoDB, client } from './mongodb.config.js';

const app = express();
const PORT = process.env.PORT || 3001;

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
    const db = client.db('smartHomeDB');
    const data = await db.collection('sensorData').find({}).limit(100).toArray(); // Limit for performance
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});