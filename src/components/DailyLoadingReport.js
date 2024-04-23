import React from "react";
import { Table } from "react-bootstrap";

function DailyLoadingReport({ data }) {
  const tableHeight = "80vh"; // Set the desired table height

  return (
    <div style={{ height: tableHeight, overflowY: "scroll" }} className="mt-2">
      <Table striped hover>
        <thead>
          <tr>
            <th style={headerStyle}>ID</th>
            <th style={headerStyle}>STATION</th>
            <th style={headerStyle}>PROVINCE</th>
            <th style={headerStyle}>CITY</th>
            <th style={headerStyle}>ACTIVE</th>
            {/* <th style={headerStyle}>PM1.0</th>
            <th style={headerStyle}>PM2.5</th>
            <th style={headerStyle}>PM4.0</th>
            <th style={headerStyle}>PM10.0</th>
            <th style={headerStyle}>NOX</th>
            <th style={headerStyle}>VOC</th> */}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.SENSOR_ID}</td>
              <td>{item.STATION}</td>
              <td>{item.PROVINCE}</td>
              <td>{item.CITY}</td>
              <td>{item.ACTIVE}</td>
              {/* <td>{item.PM1_0}</td>
              <td>{item.PM2_5}</td>
              <td>{item.PM4_0}</td>
              <td>{item.PM10_0}</td>
              <td>{item.NOX}</td>
              <td>{item.VOC}</td> */}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
const headerStyle = {
  background: "#2068F3",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "10px",
  fontFamily: "Helvetica Neue",
};
export default DailyLoadingReport;
