import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV = [
  {
    path: "/",
    label: "Home",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },

  {
    path: "/analytical",
    label: "Analytics",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    path: "/calculator",
    label: "Calculator",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    path: "/chatbot",
    label: "Chat Bot",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function FloatingNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(12,26,39,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,200,160,0.2)",
        borderRadius: 50,
        padding: "7px 10px",
        display: "flex",
        gap: 4,
        zIndex: 1000,
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,200,160,0.04)",
      }}>
      {NAV.map((item) => {
        const active = location.pathname === item.path;
        const isHovered = hovered === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            onMouseEnter={() => setHovered(item.path)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: active || isHovered ? 8 : 0,
              padding: active || isHovered ? "9px 18px" : "9px 13px",
              borderRadius: 40,
              border: active
                ? "1px solid rgba(0,200,160,0.35)"
                : "1px solid transparent",
              cursor: "pointer",
              background: active
                ? "rgba(0,200,160,0.16)"
                : isHovered
                  ? "rgba(0,200,160,0.07)"
                  : "transparent",
              color: active ? "#00c8a0" : "#4a7a8a",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              maxWidth: active || isHovered ? 140 : 42,
            }}>
            {item.icon}
            <span
              style={{
                opacity: active || isHovered ? 1 : 0,
                maxWidth: active || isHovered ? 100 : 0,
                overflow: "hidden",
                transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
