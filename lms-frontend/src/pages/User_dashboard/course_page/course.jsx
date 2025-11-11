import React, { useState } from "react";
import "./course.css";
import certificate from "../../../assets/certificate.jpeg"; // adjust path if needed

const units = [
  { id: "1-2" },
  { id: "3-4" },
  { id: "5-6" },
  { id: "7-8" },
];

const icons = {
  checklist: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7F56D9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M9 22V9"></path>
      <path d="M5 13h4"></path>
      <path d="M5 17h4"></path>
    </svg>
  ),
  video: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7F56D9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  ),
  presentation: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7F56D9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3h18v14H3z"></path>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  webinar: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7F56D9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect>
      <polygon points="10 12 15 15 10 18 10 12"></polygon>
    </svg>
  ),
  conference: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#7F56D9"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="12" r="2"></circle>
      <circle cx="12" cy="7" r="2"></circle>
      <circle cx="19" cy="12" r="2"></circle>
      <path d="M7 12h5"></path>
      <path d="M12 9v6"></path>
      <path d="M14 12h5"></path>
    </svg>
  ),
  test: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M9 22V9"></path>
      <path d="M5 13h4"></path>
      <path d="M5 17h4"></path>
    </svg>
  ),
};

export default function SupplyChain() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "— Hello, Mitchell! I’m your virtual learning assistant." },
    { from: "bot", text: "— I will guide you through all the different stages of mastering the Supply Chain Management course from basics to certification." },
    { from: "bot", text: "— What kind of courses would you like to learn?" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [conversationEnded, setConversationEnded] = useState(false);

  const openCertificate = () => window.open(certificate, "_blank");

  const handleSend = () => {
    if (!userInput.trim() || conversationEnded) return;

    const newMessages = [...messages, { from: "user", text: userInput }];
    setMessages(newMessages);

    const input = userInput.toLowerCase();
    let botResponse = "";

    // --- Bot logic ---
    if (input.includes("thank")) {
      botResponse = "You're welcome! 😊 You can reach me anytime for guidance.";
      setConversationEnded(true);
    } else if (input.includes("doctor")) {
      botResponse = `That’s great! Here are some related courses you might like:
- 🩺 Medical Supply Chain Management
- 💊 Pharmaceutical Logistics
- 🏥 Hospital Operations & Procurement`;
    } else if (input.includes("engineering")) {
      botResponse = `Nice choice! You might enjoy:
- ⚙️ Industrial Supply Systems
- 🏗️ Engineering Project Logistics
- 🚚 Transportation & Distribution Engineering`;
    } else if (input.includes("supply") || input.includes("chain")) {
      botResponse = `Perfect! You’re in the right place. This course will teach:
- Inventory Management
- Logistics Planning
- Procurement Strategies
- Global Supply Systems`;
    } else {
      botResponse = `Interesting! While I look for that, here are some general courses you could explore:
- 🌐 Supply Chain Management Basics
- 📦 Operations & Inventory Control
- 💼 Business Logistics`;
    }

    // Bot reply after short delay
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: botResponse }]);
    }, 800);

    setUserInput("");
  };

  return (
    <div className="supply-chain-container">
      <h2 className="title">SUPPLY CHAIN MANAGEMENT</h2>

      {/* Course Flow */}
      <div className="flow-container">
        <div className="bubble start-bubble">START</div>
        <div className="dotted-arrow"></div>

        {units.map((unit, index) => (
          <React.Fragment key={unit.id}>
            <div className="bubble unit-bubble">
              <div className="unit-header">
                <span>Unit {unit.id}</span>
                <span className="icon">{icons.checklist}</span>
              </div>

              <div className="unit-item">
                <span>YouTube video</span>
                <span className="icon">{icons.video}</span>
              </div>
              <div className="unit-item">
                <span>Presentation</span>
                <span className="icon">{icons.presentation}</span>
              </div>
              <div className="unit-item">
                <span>Webinars</span>
                <span className="icon">{icons.webinar}</span>
              </div>
              <div className="unit-item">
                <span>Conferences</span>
                <span className="icon">{icons.conference}</span>
              </div>

              <div className="test-box">
                <span>TEST</span>
                <span className="icon">{icons.test}</span>
              </div>
            </div>

            {index < units.length - 1 ? (
              <div className="dotted-arrow"></div>
            ) : (
              <div className="dotted-arrow-long"></div>
            )}
          </React.Fragment>
        ))}

        <div className="bubble cert-bubble" onClick={openCertificate}>
          CERTIFICATION
        </div>
      </div>

      {/* Bot Section */}
      <div className="robot-container">
        <svg
          className="robot"
          xmlns="http://www.w3.org/2000/svg"
          width="130"
          height="130"
          viewBox="0 0 64 64"
        >
          <rect x="15" y="20" width="34" height="34" fill="#c6c6c6" rx="6" />
          <circle cx="27" cy="35" r="4" fill="#6c63ff" />
          <circle cx="37" cy="35" r="4" fill="#6c63ff" />
          <rect x="23" y="45" width="18" height="6" fill="#4b42d1" rx="3" />
          <line x1="15" y1="20" x2="10" y2="15" stroke="#999" strokeWidth="3" />
          <line x1="49" y1="20" x2="54" y2="15" stroke="#999" strokeWidth="3" />
        </svg>

        <div className="speech-bubble">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <p key={idx} className={msg.from === "bot" ? "bot-msg" : "user-msg"}>
                {msg.text}
              </p>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                conversationEnded ? "Conversation ended." : "Type your message..."
              }
              disabled={conversationEnded}
            />
            <button
              onClick={handleSend}
              disabled={conversationEnded}
              style={{ cursor: conversationEnded ? "not-allowed" : "pointer" }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
