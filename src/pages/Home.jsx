import React from 'react';

function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to Smart Home Analytics</h1>
      <p>Your comprehensive platform for monitoring and analyzing home energy consumption.</p>
      <div style={{ marginTop: '40px' }}>
        <h2>Features</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>📊 Real-time Dashboard</li>
          <li>🔍 Detailed Analytics</li>
          <li>🤖 AI Chatbot Assistant</li>
          <li>⚡ Energy Cost Calculator</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;