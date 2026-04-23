import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/sensor-data')
      .then(response => response.json())
      .then(data => {
        // Assuming the CSV has columns like 'time', 'consumption'
        // Process data for chart, e.g., take first 50 entries
        const chartData = data.slice(0, 50).map((item, index) => ({
          time: index,
          consumption: parseFloat(item['use [kW]']) || 0, // Adjust column name as needed
        }));
        setData(chartData);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Assignment 02: Smart Home Analytics</h1>
      <p>Welcome to the visual analytics system.</p>
      <h2>Sensor Data Chart</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="consumption" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;