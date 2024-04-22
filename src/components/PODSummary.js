import React from "react";
import { Table } from "react-bootstrap";

function PODSummary({ data }) {
  return (
    <Table hover className="mt-2 mb-5">
      <thead>
        <tr>
          <th style={headerStyle}>Ref No</th>
          <th style={headerStyle}>Date and Time</th>
          <th style={headerStyle}>Product</th>
          <th style={headerStyle}>Destination</th>
          <th style={headerStyle}>Action</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>{item.referenceNo}</td>
            <td>{item.dateTime}</td>
            <td>{item.product}</td>
            <td>{item.destination}</td>
            <td>
              <button style={buttonStyle}>OPEN</button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

const buttonStyle = {
  backgroundColor: "#00f",
  color: "white",
  padding: "5px 10px 5px",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "9px",
};

const headerStyle = {
  background: "#E6E8F3",
  color: "#666",
  fontWeight: "bold",
  fontSize: "10px",
  fontFamily: "Helvetica Neue",
};

export default PODSummary;
