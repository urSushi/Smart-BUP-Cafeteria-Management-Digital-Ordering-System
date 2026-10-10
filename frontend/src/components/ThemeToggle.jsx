import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import Icon from "./Icons.jsx";

export default function ThemeToggle({ className = "", showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${isDark ? "theme-toggle-dark" : "theme-toggle-light"} ${className}`}
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="theme-toggle-icon-wrap">
        {isDark ? (
          <Icon name="sun" size={17} color="#fbbf24" className="theme-icon sun-icon" />
        ) : (
          <Icon name="moon" size={16} color="#0d9488" className="theme-icon moon-icon" />
        )}
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
