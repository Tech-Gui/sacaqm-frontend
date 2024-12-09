import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Card from "react-bootstrap/Card";
import { Chart, registerables } from "chart.js";
import { useNavigate } from "react-router-dom";
import { useDataType } from "../contextProviders/dataTypeContext";

Chart.register(...registerables);

// Define your AQI bands (adjust colors and thresholds as you need)
const aqiBands = [
  { label: "Good", min: 0, max: 50, color: "rgba(82, 196, 26, 0.45)" }, // Fresh green
  { label: "Moderate", min: 51, max: 100, color: "rgba(250, 173, 20, 0.45)" }, // Warm amber
  {
    label: "Unhealthy for Sensitive Groups",
    min: 101,
    max: 150,
    color: "rgba(245, 116, 37, 0.45)", // Vibrant orange
  },
  { label: "Unhealthy", min: 151, max: 200, color: "rgba(236, 56, 56, 0.45)" }, // Strong red
  {
    label: "Very Unhealthy",
    min: 201,
    max: 300,
    color: "rgba(146, 84, 222, 0.45)", // Rich purple
  },
  { label: "Hazardous", min: 301, max: 500, color: "rgba(165, 42, 74, 0.45)" }, // Deep maroon
];

// This plugin draws colored bands behind the data lines
const backgroundPlugin = {
  id: "backgroundPlugin",
  beforeDatasetsDraw: (chart) => {
    const {
      ctx,
      chartArea: { top, bottom, left, right },
      scales: { y },
    } = chart;

    aqiBands.forEach((band) => {
      const yStart = y.getPixelForValue(band.max);
      const yEnd = y.getPixelForValue(band.min);

      if (yStart && yEnd) {
        // Draw the colored rectangle
        ctx.save();
        ctx.fillStyle = band.color;
        ctx.fillRect(left, yStart, right - left, yEnd - yStart);
        ctx.restore();

        // Draw the text label inside the band
        ctx.save();
        ctx.fillStyle = "#FFF"; // Choose a color that contrasts with the band color
        ctx.font = "bold 12px Helvetica"; // Customize your font
        ctx.textAlign = "left"; // Or "center", depending on what you prefer
        ctx.textBaseline = "middle";

        // Position the text in the vertical center of the band
        const textY = (yStart + yEnd) / 2;
        ctx.fillText(band.label, left + 10, textY);
        ctx.restore();
      }
    });
  },
};

function ChartCard({ data, options, title, period, chartWidth, chartHeight }) {
  const lastMonthData = 0;
  const [Max, setMax] = useState({ max: null });

  useEffect(() => {
    if (data && data.datasets) {
      const allData = data.datasets.flatMap((dataset) => dataset.data);
      const max = Math.max(...allData);
      const roundedMax = Math.ceil(max / 100) * 100;
      setMax({ max: roundedMax });
    }
  }, [data]);

  const previousMonthData = 1; // This is just a placeholder for logic
  const change = lastMonthData - previousMonthData;
  const changeColor = change >= 0 ? "green" : "red";
  const changeArrow = change >= 0 ? "↑" : "↓";

  const modifiedOptions = {
    type: "line",
    ...options,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          display: true,
          maxTicksLimit: 3,
          callback: (value, index) => {
            const val = data.labels[index];
            const date = new Date(val);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            let formattedDate;
            if (period === "Today") {
              formattedDate = `${month}-${day}`;
            } else if (period === "7Days") {
              formattedDate = `${month}-${day}`;
            } else if (period === "LastDay") {
              formattedDate = `${month}-${day}`;
            } else {
              formattedDate = `${year}-${month}-${day}`;
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
        position: "left",
        min: 0,
        ...(data.datasets && data.datasets.length > 1 ? { max: Max.max } : {}),
      },
      ...(data.datasets && data.datasets.length > 1
        ? {
            y1: {
              grid: {
                display: false,
              },
              ticks: {
                display: true,
              },
              position: "right",
              max: Max.max,
              min: 0,
            },
          }
        : {}),
    },
  };

  const navigate = useNavigate();
  const { selectedType, handleTypeSelect } = useDataType();
  const handleCardClick = () => {
    const words = title.split(/\s+/);
    let cleanTitle = words[0].toLowerCase();
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    if (cleanTitle.length > 1 && cleanTitle.includes(".")) {
      cleanTitle = cleanTitle.replace(".", "p");
    }
    handleTypeSelect(cleanTitle);
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
      onDoubleClick={handleCardClick}>
      <Card.Body className="d-flex flex-column align-items-center">
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
        </div>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ width: "100%", height: "100%" }}>
          {data ? (
            <Line
              data={data}
              options={modifiedOptions}
              plugins={[backgroundPlugin]}
              width={chartWidth}
              height={chartHeight}
            />
          ) : null}
        </div>
      </Card.Body>
    </Card>
  );
}

export default ChartCard;
