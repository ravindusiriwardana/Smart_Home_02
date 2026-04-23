import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Analytical() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/sensor-data')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        setData(result);
      })
      .catch((fetchError) => {
        setError(fetchError.message);
      });
  }, []);

  // Process data for pie chart (categorize consumption levels)
  const pieData = [
    { name: 'Low (< 0.5 kW)', value: data.filter(item => parseFloat(item['use [kW]']) < 0.5).length },
    { name: 'Medium (0.5-1 kW)', value: data.filter(item => parseFloat(item['use [kW]']) >= 0.5 && parseFloat(item['use [kW]']) < 1).length },
    { name: 'High (>= 1 kW)', value: data.filter(item => parseFloat(item['use [kW]']) >= 1).length },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Analytical Insights</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ marginBottom: '40px' }}>
        <h3>Consumption Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3>Detailed Consumption Bar Chart</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="use [kW]" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3>Statistics</h3>
        <p>Total Records: {data.length}</p>
        <p>Max Consumption: {data.length > 0 ? Math.max(...data.map(item => parseFloat(item['use [kW]']) || 0)).toFixed(2) : 0} kW</p>
        <p>Min Consumption: {data.length > 0 ? Math.min(...data.map(item => parseFloat(item['use [kW]']) || 0)).toFixed(2) : 0} kW</p>
      </div>
    </div>
  );
}

export default Analytical;
