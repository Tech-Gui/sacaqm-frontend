import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

export function Ring({ inputData, stats, plugin }) {
  const options = {
    cutout: "80%", // Set the cutout to 70%
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
    },
  };

  const data = {
    labels: ["Right", "Wrong"],
    datasets: [
      {
        label: "Clients",
        data: [inputData[0], inputData[1] ? inputData[1] : 0],
        backgroundColor: ["#2068F3", "rgba(32, 104, 243, 0.31)"],
        borderColor: ["#2068F3", "rgba(32, 104, 243, 0.31)"],
        //   borderWidth: [1, 1],
      },
    ],
  };

  return (
    <div style={{ height: "10rem", width: "10rem" }}>
      <div className="d-flex justify-content-center align-items-center flex-column">
        <Doughnut data={data} options={options} plugins={plugin} />
        <p
          style={{
            color: "#666",
            fontWeight: "bold",
            fontSize: "10px",
            fontFamily: "Helvetica Neue",
          }}
          className="mt-3">
          {stats}
        </p>
      </div>
    </div>
  );
}
