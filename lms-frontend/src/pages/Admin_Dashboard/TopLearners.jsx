// src/components/TopLearners.jsx
import React from "react";

export default function TopLearners({ data }) {
  return (
    <div className="toplearn">
      {data.map((t, i) => (
        <div className="learner-row" key={t.name}>
          <div className="lr-left">
            <div className="lr-rank">#{i + 1}</div>
            <img src={`https://i.pravatar.cc/40?img=${i + 10}`} alt="" className="lr-avatar" />
            <div>
              <div className="lr-name">{t.name}</div>
              <div className="lr-role muted tiny">{t.role}</div>
            </div>
          </div>
          <div className="lr-points">{t.pts} pts</div>
        </div>
      ))}
      <div className="view-all"><a href="#">View all →</a></div>
    </div>
  );
}
