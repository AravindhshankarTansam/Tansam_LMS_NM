import React, { useState } from "react";
import "./FAQ.css";
import { Add, Remove } from "@mui/icons-material";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      question: "How can I bid for your products?",
      answer:
        "You can bid through our online portal by logging in and selecting your desired item.",
    },
    {
      question: "What is the function of your products?",
      answer:
        "Our products help you attain the perfect beauty you can ever imagine.",
    },
    {
      question: "How can I download your app?",
      answer: "You can download our app from the Play Store or App Store.",
    },
    {
      question: "How are your exchange rates calculated?",
      answer:
        "We calculate exchange rates based on current market trends and supplier pricing.",
    },
    {
      question: "How can I buy your products?",
      answer: "Browse our catalog, add items to cart, and proceed to checkout.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <h2 className="faq-title">FAQ’s</h2>

      {faqData.map((item, index) => (
        <div
          key={index}
          className={`faq-item ${openIndex === index ? "open" : ""}`}
        >
          <div className="faq-question" onClick={() => toggleFAQ(index)}>
            <span className="faq-icon">
              {openIndex === index ? <Remove /> : <Add />}
            </span>
            <p>{item.question}</p>
          </div>

          {openIndex === index && (
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FAQ;
