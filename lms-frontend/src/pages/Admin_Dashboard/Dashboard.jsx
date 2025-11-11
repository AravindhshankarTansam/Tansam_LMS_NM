import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LineChart from "./Linechart";
import DonutChart from "./Donutchart";
import ProgressBar from "./ProgressBar";
import TopLearners from "./TopLearners";
import UngradedTable from "./UpgradeTable";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const assignment = { submitted: 65, remaining: 35, total: 100 };

  const learningContents = {
    total: 120,
    passed: 80,
    failed: 10,
    overdue: 5,
    inProgress: 15,
    notStarted: 10,
  };

  const topLearners = [
    { name: "Dr. Ananya R.", role: "Resident, Cardiology", pts: 98 },
    { name: "Dr. Mehul S.", role: "Intern, General Medicine", pts: 92 },
    { name: "Dr. Priya V.", role: "PG, Orthopedics", pts: 88 },
  ];

  const ungraded = [
    {
      id: 1,
      title: "Diagnosis of Myocardial Infarction",
      questions: "4 open-ended",
      learner: "Dr. Riya Singh",
    },
    {
      id: 2,
      title: "Clinical Case Study: Appendicitis",
      questions: "6 open-ended",
      learner: "Dr. Raj Malhotra",
    },
    {
      id: 3,
      title: "Anatomy of the Human Brain",
      questions: "3 open-ended",
      learner: "Dr. Sneha Nair",
    },
  ];

  const courseList = [
    { id: 1, title: "Human Anatomy", category: "Pre-Clinical", progress: 80 },
    { id: 2, title: "Pathology Essentials", category: "Para-Clinical", progress: 60 },
    { id: 3, title: "Clinical Skills in Surgery", category: "Clinical", progress: 45 },
    { id: 4, title: "Pharmacology & Therapeutics", category: "Para-Clinical", progress: 70 },
  ];

  return (
    <div className="dashboard-app">
      <Sidebar />
      <div className="dashboard-main">
        <Header userName="Dr. Bagus" />

        <div className="dashboard-content">
          {/* Top Greeting & Quick Actions */}
          <div className="top-actions">
            <h2 className="greeting">
              Good morning, Dr. Bagus <span role="img" aria-label="hand">👋</span>
            </h2>
            <div className="quick-actions">
              <button className="qa-btn course" onClick={() => navigate("/add-user")}>🧑‍⚕️ Add Student</button>
              <button className="qa-btn course" onClick={() => navigate("/create-course")}>📚 Add Module</button>
              {/* <button className="qa-btn assign">🩺 Case Study +</button>
              <button className="qa-btn quiz">💊 Medical Quiz +</button>
              <button className="qa-btn path">🧬 Learning Path +</button> */}
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Main Column */}
            <div className="main-column">
              {/* TOP ROW */}
              <div className="grid grid-top">
                {/* Total Students */}
                <div className="card card-issued">
                  <div className="card-header">Total Students Overview</div>
                  <div className="card-body" style={{ justifyContent: "space-between" }}>
                    <div className="issued-right">
                      <div className="big">856</div>
                      <div className="muted tiny">Active MBBS Students</div>
                      <div style={{ width: "120px", marginTop: 10 }}>
                        <LineChart small />
                      </div>
                    </div>
                    <div className="issued-left">
                      <div className="meta small">Total Enrolled</div>
                      <div className="title">1,250</div>
                      <div className="meta small">Completion Rate: <strong>68%</strong></div>
                    </div>
                  </div>
                </div>

                {/* Assignment Summary */}
                <div className="card card-assignment">
                  <div className="card-header">Case Studies Summary</div>
                  <div className="card-body vertical">
                    <div className="assignment-top">
                      <div className="title">
                        <strong>{assignment.submitted}</strong> submitted
                      </div>
                      <div className="muted tiny">{assignment.remaining} pending</div>
                    </div>

                    <div className="pb-wrapper">
                      <div className="pb-track">
                        <div
                          className="pb-fill"
                          style={{
                            width: `${(assignment.submitted / assignment.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="meta small muted">20 Case Studies • View all →</div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div className="grid grid-bottom">
                {/* Learning Content */}
                <div className="card card-learning">
                  <div className="card-header">Course Performance</div>
                  <div className="card-body learning-body">
                    <div className="learning-chart">
                      <DonutChart
                        data={{
                          passed: learningContents.passed,
                          failed: learningContents.failed,
                          overdue: learningContents.overdue,
                          inProgress: learningContents.inProgress,
                          notStarted: learningContents.notStarted,
                        }}
                        total={learningContents.total}
                        size="small"
                      />
                    </div>

                    <div className="learning-legend">
                      <div><span className="dot" style={{ background: "#3b82f6" }}></span> Passed</div>
                      <div><span className="dot" style={{ background: "#ef4444" }}></span> Failed</div>
                      <div><span className="dot" style={{ background: "#facc15" }}></span> Overdue</div>
                      <div><span className="dot" style={{ background: "#10b981" }}></span> In Progress</div>
                      <div><span className="dot" style={{ background: "#9ca3af" }}></span> Not Started</div>
                    </div>
                  </div>
                </div>

                {/* Top Learners */}
                <div className="card card-toplearn">
                  <div className="card-header">Top Performing Students</div>
                  <div className="card-body">
                    <TopLearners data={topLearners} />
                  </div>
                </div>
              </div>

              {/* Bottom Table */}
              <div className="card ungraded-card full-width">
                <div className="card-header">Pending Evaluations</div>
                <div className="card-body">
                  <UngradedTable rows={ungraded} />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="sidebar-column">
              <div className="card course-list-card">
                <div className="card-header">Active Medical Courses</div>
                <div className="card-body">
                  <ul className="course-list">
                    {courseList.map((c) => (
                      <li key={c.id}>
                        <div className="course-info">
                          <div className="course-title">{c.title}</div>
                          <div className="muted tiny">{c.category}</div>
                        </div>

                        <div className="pb-wrapper">
                          <div className="pb-track">
                            <div className="pb-fill" style={{ width: `${c.progress}%` }}></div>
                          </div>
                          <div className="pb-label">{c.progress}%</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card tips-card">
                <div className="card-header">Instructor Insights</div>
                <div className="card-body">
                  <ul className="tips-list">
                    <li>🩻 Radiology session attendance up by 10%</li>
                    <li>🧬 Anatomy module updated successfully</li>
                    <li>💉 Add simulation-based surgery modules</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
