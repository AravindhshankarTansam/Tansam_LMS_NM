// src/components/ProgressBar.jsx
import React from "react";

export default function ProgressBar({ value = 0 }) {
  const pct = Math.round(value);
  return (
    <div className="progress-wrapper">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-text">{pct}%</div>
    </div>
  );
}
