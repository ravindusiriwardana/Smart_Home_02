import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeProvider.jsx";

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
  const { theme, toggle } = useTheme();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--sh-panel)",
        backdropFilter: "var(--sh-glass-blur)",
        WebkitBackdropFilter: "var(--sh-glass-blur)",
        border: "1px solid var(--sh-border)",
        borderRadius: 50,
        padding: "7px 10px",
        display: "flex",
        gap: 4,
        zIndex: 1000,
        boxShadow: "var(--sh-shadow)",
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
                ? "1px solid var(--sh-border-strong)"
                : "1px solid transparent",
              cursor: "pointer",
              background: active
                ? "color-mix(in srgb, var(--sh-teal) 14%, transparent)"
                : isHovered
                  ? "color-mix(in srgb, var(--sh-teal) 8%, transparent)"
                  : "transparent",
              color: active ? "var(--sh-teal)" : "var(--sh-text-sub)",
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

      <button
        type="button"
        className="sh-toggle"
        onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}>
        {theme === "dark" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </nav>
  );
}
