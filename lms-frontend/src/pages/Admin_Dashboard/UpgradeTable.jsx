// src/components/UngradedTable.jsx
import React from "react";

export default function UngradedTable({ rows }) {
  return (
    <table className="ug-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Quiz title</th>
          <th>Questions</th>
          <th>Learner</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td className="title">{r.title}</td>
            <td>{r.questions}</td>
            <td><div className="learner-cell"><img src={`https://i.pravatar.cc/32?u=${r.learner}`} alt="" />{r.learner}</div></td>
            <td><button className="grade-btn">Grade Now</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
