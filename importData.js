import fs from 'fs';
import csv from 'csv-parser';
import { client } from './mongodb.config.js';

const results = [];

fs.createReadStream('HomeC.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    try {
      await client.connect();
      const db = client.db('smartHomeDB');
      const collection = db.collection('sensorData');
      await collection.insertMany(results);
      console.log('Data imported successfully!');
    } catch (error) {
      console.error('Error importing data:', error);
    } finally {
      await client.close();
    }
  });