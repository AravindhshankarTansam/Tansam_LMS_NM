// src/components/Features.jsx
import React from "react";
import "./Features.css";

const featuresData = [
  { icon: "💻", title: "Anywhere, Anytime, Any Device" },
  { icon: "📈", title: "Adaptive Learning" },
  { icon: "👥", title: "Special Needs Support" },
  { icon: "🏫", title: "Offline Learning" },
  { icon: "💡", title: "Easy Integrations" },
  { icon: "📊", title: "Tracking and Reporting" },
];

const Features = () => {
  return (
    <section className="features-section">
      <h2>MapleLMS Features</h2>
      <p>
        MapleLMS offers the best cloud-based learning management software that
        perfectly aligns with your organization’s diverse training and L&D
        requirements.
      </p>
      <div className="features-grid">
        {featuresData.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
          </div>
        ))}
      </div>
      <button className="features-button">See more features</button>
    </section>
  );
};

export default Features;
