import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import Card from "react-bootstrap/Card";
import { Chart, plugins, registerables } from "chart.js";
import { useNavigate, useLocation } from "react-router-dom";
import { useDataType } from "../contextProviders/dataTypeContext";
import annotationPlugin from "chartjs-plugin-annotation";

import { max } from "date-fns";
Chart.register(...registerables);
Chart.register(annotationPlugin);

function ChartCard({ data, options, title, period, chartWidth, chartHeight }) {
  const lastMonthData = 0;
  const [Latest, setLatest] = useState(0);
  const [Max, setMax] = useState({  max: null });

  const navigate = useNavigate();
  const location = useLocation(); // Get the current route
  
  const [maxScale, setMaxScale] = useState(null);
  const { selectedType, handleTypeSelect } = useDataType();

  useEffect(() => {
    if (data && data.datasets) {
      // Calculate the maximum value from all datasets
      const allData = data.datasets.flatMap(dataset => dataset.data);
      const max = Math.max(...allData);

      const roundedMax = Math.ceil(max / 10) * 10;
      setMaxScale(roundedMax);
    }
  }, [data]);


  // const previousMonthData = data.datasets[0].data.slice(-2)[0];
  const previousMonthData = 1;
  const change = lastMonthData - previousMonthData;
  const changeColor = change >= 0 ? "green" : "red";
  const changeArrow = change >= 0 ? "↑" : "↓";

  const isTemperatureOrHumidity = selectedType === "Temperature" || selectedType === "Humidity";
  // Check if we are on the analytics page
  const isAnalyticsPage = location.pathname.includes("analytics");
  // Check if we are on the dashboard page
  const isDashboardPage = location.pathname.includes("dashboard");

  // Conditional feature logic: Disable the feature if on the dashboard and the chart is temperature or humidity
  const showFeature = !(isDashboardPage && isTemperatureOrHumidity);


  const modifiedOptions = {
    type : 'line',
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
          display : true,
        },
        position: 'left',
        min : 0,
        ...(data.datasets && data.datasets.length > 1 ? { max: maxScale } : {max: maxScale}),
      },
      ...(data.datasets && data.datasets.length > 1
        ? {
            // Add y1 axis only for multi-chart
            y1: {
              grid: {
                display: false,
              },
              ticks: {
                display: true,
              },
              position: "right",
              max: maxScale,
              min: 0,
            },
          }
        : {}),
    }
  };
  
  const handleCardClick = () => {
    // Split the title by whitespace
    const words = title.split(/\s+/);
    console.log(words);

    let cleanTitle = words[0].toLowerCase();

    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    // If there's a dot in the second word, replace it with 'p'
    if (cleanTitle.length > 1 && cleanTitle.includes(".")) {
      cleanTitle = cleanTitle.replace(".", "p");
    }
    console.log(cleanTitle);
    handleTypeSelect(cleanTitle);
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
      onDoubleClick={handleCardClick}>
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
