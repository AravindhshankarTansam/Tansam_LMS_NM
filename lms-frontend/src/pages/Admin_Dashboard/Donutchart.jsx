// src/components/DonutChart.jsx
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data, total }) {
  // data: { passed, failed, overdue, inProgress, notStarted }
  const labels = ["Passed", "Failed", "Overdue", "In Progress", "Not Started"];
  const values = [data.passed, data.failed, data.overdue, data.inProgress, data.notStarted];

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#c7c7c7"],
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  return (
    <div className="donut-chart">
      <Doughnut data={chartData} options={options} />
      <div className="donut-center">
        <div className="donut-total">{total}</div>
        <div className="donut-label">Contents</div>
      </div>
    </div>
  );
}
