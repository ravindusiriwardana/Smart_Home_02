import React from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

function Charts({ data }) {
  return (
    <div>

      {/* LINE CHART */}
      <div style={{ height: 300 }}>
        <h3>Energy Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="use" stroke="#00a389" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BAR CHART */}
      <div style={{ height: 300, marginTop: 20 }}>
        <h3>Appliance Usage</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="use" fill="#007bff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default Charts;