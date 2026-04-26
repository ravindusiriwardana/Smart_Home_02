import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV = [
  {
    path: "/analytical",
    label: "Analytics",
    sub: "7-day breakdown",
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
    path: "/chatbot",
    label: "AI Chat",
    sub: "Ask anything",
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

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#0c1a27",
        borderRight: "1px solid rgba(0,200,160,0.12)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
        fontFamily: "'Syne', sans-serif",
        flexShrink: 0,
      }}>
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: "2.5rem",
          paddingLeft: 4,
        }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "rgba(0,200,160,0.12)",
            border: "1px solid rgba(0,200,160,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#00c8a0",
          }}>
          ◈
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#e8f4f8",
              letterSpacing: ".02em",
            }}>
            SmartHome
          </div>
          <div style={{ fontSize: 10, color: "#4a7a8a", marginTop: 1 }}>
            Energy Platform
          </div>
        </div>
      </div>

      {/* Section label */}
      <div
        style={{
          fontSize: 10,
          color: "#2a5a6a",
          textTransform: "uppercase",
          letterSpacing: ".1em",
          marginBottom: 8,
          paddingLeft: 8,
        }}>
        Navigation
      </div>

      {/* Nav items */}
      <div
        style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
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
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: active
                  ? "rgba(0,200,160,0.12)"
                  : isHovered
                    ? "rgba(0,200,160,0.06)"
                    : "transparent",
                border: `1px solid ${active ? "rgba(0,200,160,0.28)" : "transparent"}`,
                color: active ? "#00c8a0" : isHovered ? "#e8f4f8" : "#4a7a8a",
                cursor: "pointer",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                textAlign: "left",
                transition: "all 0.15s ease",
                width: "100%",
              }}>
              {item.icon}
              <div>
                <div>{item.label}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: active ? "rgba(0,200,160,0.6)" : "#2a5a6a",
                    fontWeight: 400,
                    marginTop: 1,
                  }}>
                  {item.sub}
                </div>
              </div>
              {active && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#00c8a0",
                    animation: "pulse-dot 1.8s infinite",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(0,200,160,0.1)",
          paddingTop: "1rem",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,185,50,0.15)",
              border: "1px solid rgba(255,185,50,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#ffb932",
            }}>
            SH
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e8f4f8" }}>
              Smart Home
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#4a7a8a",
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 1,
              }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#00c8a0",
                  display: "inline-block",
                  animation: "pulse-dot 1.8s infinite",
                }}
              />
              Online
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
