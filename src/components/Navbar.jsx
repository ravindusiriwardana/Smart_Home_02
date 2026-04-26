import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{ padding: '16px', background: '#f5f5f5', display: 'flex', gap: '16px' }}>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/analytical">Analytical</Link>
      <Link to="/chatbot">Chatbot</Link>
    </nav>
  );
}

export default Navbar;
