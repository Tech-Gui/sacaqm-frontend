import React from "react";
import { Table } from "react-bootstrap";
import { formatLastSeen } from "./dateFormatter";

function StationsTable({ data }) {
  const tableHeight = "80vh"; // Set the desired table height

  return (
    <div style={{ height: tableHeight, overflowY: "scroll" }} className="mt-2">
      <Table striped hover>
        <thead>
          <tr>
            <th style={headerStyle}>STATION</th>
            <th style={headerStyle}>PROVINCE</th>
            <th style={headerStyle}>CITY</th>
            <th style={headerStyle}>Description</th>
            <th style={headerStyle}>LONGITUDE</th>
            <th style={headerStyle}>LATITUDE</th>
            <th style={headerStyle}>SENSOR IDs</th>
            <th style={headerStyle}>LAST SEEN</th>
        
          </tr>
        </thead>
        <tbody>
          {data.map((station, index) => (
            <tr key={index}>
              <td style={{ textAlign: "left" }}>{station.name}</td>
              <td style={{ textAlign: "left" }}>{station.province}</td>
              <td style={{ textAlign: "left" }}>{station.city}</td>
              <td style={{ textAlign: "left" }}>{station.description}</td>
              <td style={{ textAlign: "left" }}>{station.longitude}</td>
              <td style={{ textAlign: "left" }}>{station.latitude}</td>
              <td style={{ textAlign: "left" }}>
                {station.sensorIds.join(", ")}
              </td>
              <td style={{ textAlign: "left" }}>
                {station.lastSeen
                  ? formatLastSeen(station.lastSeen)
                  : "No data"}
              </td>

           
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
  textAlign: "left",
};
export default StationsTable;
