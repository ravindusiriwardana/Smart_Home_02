import React, { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

function Appliances() {
  const [applianceData, setApplianceData] = useState([]);
  const [dailyComparison, setDailyComparison] = useState([]);
  const [selectedAppliance, setSelectedAppliance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch appliance breakdown data
      const applianceRes = await fetch('http://localhost:3001/api/analytics/appliance-breakdown');
      const applianceJson = await applianceRes.json();
      
      // Fetch daily comparison for secondary data
      const dailyRes = await fetch('http://localhost:3001/api/analytics/daily-comparison');
      const dailyJson = await dailyRes.json();

      // Process appliance data
      if (applianceJson && applianceJson.length > 0) {
        const latest = applianceJson[applianceJson.length - 1];
        const processedData = [];

        const applianceKeys = [
          'Dishwasher [kW]', 'Furnace 1 [kW]', 'Furnace 2 [kW]', 'Home office [kW]',
          'Fridge [kW]', 'Wine cellar [kW]', 'Garage door [kW]', 'Kitchen 12 [kW]',
          'Kitchen 14 [kW]', 'Kitchen 38 [kW]', 'Barn [kW]', 'Well [kW]',
          'Microwave [kW]', 'Living room [kW]',
        ];

        applianceKeys.forEach(key => {
          const total = latest[`${key}_total`] || 0;
          if (total > 0) {
            processedData.push({
              name: key.replace(' [kW]', ''),
              value: parseFloat(total),
              percentage: 0,
            });
          }
        });

        // Calculate percentages
        const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);
        processedData.forEach(item => {
          item.percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
        });

        // Sort by value
        processedData.sort((a, b) => b.value - a.value);

        setApplianceData(processedData);
        if (processedData.length > 0) {
          setSelectedAppliance(processedData[0].name);
        }
      }

      if (dailyJson && dailyJson.length > 0) {
        setDailyComparison(dailyJson.slice(-7)); // Last 7 days
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Appliance Consumption
        </h1>
        <p className="text-gray-300 mb-12">Monitor energy usage by appliance and optimize your home's efficiency</p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
                <p className="text-gray-400 text-sm mb-2">Total Appliances</p>
                <p className="text-3xl font-bold text-cyan-400">{applianceData.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
                <p className="text-gray-400 text-sm mb-2">Highest Consumer</p>
                <p className="text-2xl font-bold text-green-400">{applianceData[0]?.name}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
                <p className="text-gray-400 text-sm mb-2">Total Consumption</p>
                <p className="text-3xl font-bold text-purple-400">{(applianceData.reduce((sum, item) => sum + item.value, 0)).toFixed(2)} kW</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20">
                <p className="text-gray-400 text-sm mb-2">Top 3 %</p>
                <p className="text-2xl font-bold text-orange-400\">
                  {applianceData.slice(0, 3).reduce((sum, item) => sum + parseFloat(item.percentage), 0).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Pie Chart */}
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6">Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applianceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {applianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6">Consumption (kW)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={applianceData} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" width={95} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#06b6d4" radius={[0, 8, 8, 0]}>
                      {applianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List View */}
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20 mb-8">
              <h2 className="text-2xl font-bold mb-6">Detailed Breakdown</h2>
              <div className="space-y-3">
                {applianceData.map((item, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        ></div>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{item.value.toFixed(2)} kW</p>
                        <p className="text-gray-400 text-sm">{item.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Trend */}
            {dailyComparison.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl border border-white/20">
                <h2 className="text-2xl font-bold mb-6">Daily Trend (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="avgUse" stroke="#06b6d4" strokeWidth={2} name="Avg Usage (kW)" />
                    <Line type="monotone" dataKey="maxUse" stroke="#ef4444" strokeWidth={2} name="Max Usage (kW)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tips Section */}
            <div className="mt-8 bg-green-500/10 border border-green-400/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">💡 Energy Saving Tips</h3>
              <ul className="text-gray-300 space-y-2">
                <li>✓ Schedule high-consumption appliances (washing machine, dishwasher) during off-peak hours</li>
                <li>✓ Maintain HVAC systems regularly to improve efficiency</li>
                <li>✓ Use programmable thermostats to reduce heating/cooling costs</li>
                <li>✓ Replace old appliances with ENERGY STAR certified models</li>
                <li>✓ Insulate water heaters and pipes to reduce heat loss</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Appliances;
