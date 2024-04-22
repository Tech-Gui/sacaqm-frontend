import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import Card from "react-bootstrap/Card";
import { Chart, registerables } from "chart.js";
import { useNavigate } from "react-router-dom";
import { useDataType } from "../contextProviders/dataTypeContext";

Chart.register(...registerables);

function ChartCard({ data, options, title, period, chartWidth, chartHeight }) {
  const lastMonthData = 0;
  const [Latest, setLatest] = useState(0);

  // const previousMonthData = data.datasets[0].data.slice(-2)[0];
  const previousMonthData = 1;
  const change = lastMonthData - previousMonthData;
  const changeColor = change >= 0 ? "green" : "red";
  const changeArrow = change >= 0 ? "↑" : "↓";

  const modifiedOptions = {
    ...options,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: true,
          maxTicksLimit: 3, // This will show 6 ticks, skipping 2

          callback: (value, index, values) => {
            // 1. Create a Date object from the timestamp
            value = data.labels[index];
            const date = new Date(value);

            // 2. Format the date part using appropriate methods
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero for single-digit months
            const day = String(date.getDate()).padStart(2, "0");

            // 3. Combine year, month, and day for the desired format
            if (period === "Today") {
              var formattedDate = `${month}-${day}`;
            } else if (period === "7Days") {
              var formattedDate = `${month}-${day}`;
            } else if (period === "LastDay") {
              var formattedDate = `${month}-${day}`;
            } else {
              var formattedDate = `${year}-${month}-${day}`;
            }

            return formattedDate;
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          display: true,
        },
        beginAtZero: true, // Start the Y-axis at 0
      },
    },
  };
  const navigate = useNavigate();
  const { selectedType, handleTypeSelect } = useDataType();
  const handleCardClick = () => {
    handleTypeSelect(title);
    // After setting the selectedType, navigate to the analytics page
    navigate("/analytics");
  };

  return (
    <Card
      className="mb-2"
      style={{
        backgroundColor: "#FFF",
        height: "100%",
        border: "none",
        cursor: "pointer",
      }}
      onClick={handleCardClick}>
      <Card.Body className="d-flex flex-column align-items-cente">
        <div className="d-flex flex-row justify-content-between">
          <p
            className="card-title text-center"
            style={{
              color: "#666",
              fontWeight: "bold",
              fontSize: "15px",
              fontFamily: "Helvetica Neue",
              textAlign: "left",
            }}>
            {title}
          </p>

          {/* <div>
            <span
              style={{
                color: "var(--Witz-Black)",

                fontSize: "10px",
                fontStyle: "normal",
                fontWeight: 600,
                lineHeight: "normal",
              }}>
              {" "}
              Latest:{" "}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontStyle: "normal",
                fontWeight: 600,
                lineHeight: "normal",
              }}>
              {lastMonthData}
            </span>
            <div
              style={{
                color: changeColor,
                fontSize: "10px",
                fontWeight: "bold",
              }}>
              {changeArrow} {Math.abs(change)}
            </div>
          </div> */}
        </div>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ width: "100%", height: "100%" }}>
          {data ? <Line data={data} options={modifiedOptions} /> : null}
        </div>
      </Card.Body>
    </Card>
  );
}

export default ChartCard;
