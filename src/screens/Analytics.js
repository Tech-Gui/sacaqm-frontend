// AnalyticsScreen.js
import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Card, Dropdown } from "react-bootstrap";
import Sidebar from "../components/SideBar";
import TopNavBar from "../components/topNavBar";
import ChartCard from "../components/chartCard.js";
import { Tooltip, OverlayTrigger } from "react-bootstrap"; // Import Tooltip

import { useDataType } from "../contextProviders/dataTypeContext.js";
import { useSensorData } from "../contextProviders/sensorDataContext.js";
import { DataContext } from "../contextProviders/DataContext.js";
import { StationContext } from "../contextProviders/StationContext.js";

import annotationPlugin from "chartjs-plugin-annotation";
import { Chart } from "chart.js";

// Register annotation plugin
Chart.register(annotationPlugin);

//console.log("Registered plugins:", Chart.registry.plugins);


const AnalyticsScreen = () => {
  const {
    selectedSensor,
    selectedPeriod = "Today",
    setSelectedSensor,
    setSelectedPeriod,
  } = useSensorData();
  const renderTooltip = (props) => (
    <Tooltip id="data-resolution-tooltip" {...props}>
      Switch to "Hourly Averages" or "Daily Averages" to view color-coded data. Refer to the color scale{" "}
      <a
        href="https://saaqis.environment.gov.za/Pagesfiles/SAAQIS%20Air%20Quality%20Index%20for%20General%20Public-Summary.pdf"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#ffffff", textDecoration: "underline" }}
      >
        here
      </a>.
    </Tooltip>
  );

  const {
    selectedSensor2 = "No Station 2 Selected",
    setSelectedSensor2,
  } = useSensorData();

  const { nodeData, setNodeData, fetchNodeData ,nodeData2, setNodeData2, fetchNodeData2  } = useContext(DataContext);
 // const [matchingTimestamps, setMatchingTimestamps] = useState([]);

  const { stations } = useContext(StationContext);

  const [filteredData1, setFilteredData1] = useState([]);
  const [filteredData2, setFilteredData2] = useState([]);
  const [dataResolution, setDataResolution] = useState("raw");

  const { selectedType, handleTypeSelect } = useDataType();
  

  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Fetch data when the component mounts or when selectedSensor changes
  // Fetch data for station 1
  useEffect(() => {
    const station = stations.find(
      (station) => station["_id"] === selectedSensor
    );

    if (station) {
      // Default fetch is for 7 days
      fetchNodeData(station._id, 7);
      console.log("station id", station._id);
      console.log("Data fetched for 7 days.");
    } else {
      console.log("Station 1 not found.");
    }
  }, [selectedSensor]);

  // Fetch data for station 2
  useEffect(() => {
    if (selectedSensor2 === "No Station 2 Selected") return;
    const station2 = stations.find(
      (station) => station["_id"] === selectedSensor2
    );

    if (station2) {
      // Default fetch is for 7 days
      fetchNodeData2(station2._id, 7);
      console.log("Data fetched for 7 days.");
    } else {
      console.log("Station 2 not found.");
    }
  }, [selectedSensor2]);


  // Fetch data when selectedPeriod changes to "30 Days"
  useEffect(() => {
    if (selectedPeriod === "30 Days") {
      const station = stations.find(
        (station) => station["_id"] === selectedSensor
      );
      const station2 = stations.find(
        (station2) => station2["_id"] === selectedSensor2
      );

      if (station) {
        setIsLoading(true); // Start loading
        fetchNodeData(station._id, 30)
          .then(() => {
            setIsLoading(false); // End loading
            console.log("Data fetched for 30 days.");
          })
          .catch((error) => {
            setIsLoading(false);
            console.error("Error fetching 30 days data:", error);
          });
      } else {
        console.log("Station not found.");
      }

      if(station2) {
        setIsLoading(true); // Start loading
        fetchNodeData2(station2._id, 30)
          .then(() => {
            setIsLoading(false); // End loading
            console.log("Data fetched for 30 days.");
          })
          .catch((error) => {
            setIsLoading(false);
            console.error("Error fetching 30 days data:", error);
          });
      } else {
        console.log("Station not found.");
      }
    }
    // No need to fetch data for periods less than 7 days
  }, [selectedPeriod]);

  // Filter data based on selectedPeriod and dataResolution
  const filterData = () => {
    let filtered1 = nodeData;
    let filtered2 = selectedSensor2 !== "No Station 2 Selected" ? nodeData2 : [];
  
    if (selectedPeriod) {
      const now = new Date();
      let start = new Date();
      switch (selectedPeriod) {
        case "Today":
          start.setHours(0, 0, 0, 0);
          break;
        case "Last Day":
          start.setDate(now.getDate() - 1);
          break;
        case "7 Days":
          start.setDate(now.getDate() - 7);
          break;
        default:
          start = null;
      }
  
      if (start) {
        filtered1 = nodeData.filter((item) => {
          const timestamp = new Date(item.timestamp);
          return timestamp >= start && timestamp <= now;
        });
  
        if (selectedSensor2 !== "No Station 2 Selected") {
          filtered2 = nodeData2.filter((item) => {
            const timestamp = new Date(item.timestamp);
            return timestamp >= start && timestamp <= now;
          });
        }
      }
    }
  
    if (dataResolution !== "raw") {
      filtered1 = averageData(filtered1, dataResolution);
      if (selectedSensor2 !== "No Station 2 Selected") {
        filtered2 = averageData(filtered2, dataResolution);
      }
    }
  
    setFilteredData1(filtered1);
    setFilteredData2(filtered2);
  };
  
  // Average data based on resolution
  const averageData = (data, resolution) => {
    
    const groupedData = {};

    data.forEach((item) => {
      const date = new Date(item.timestamp);
      let key;

      switch (resolution) {
        case "hourly":
          key = date.toISOString().slice(0, 13) + ":00:00.000Z"; // Group by hour
          break;
        case "daily":
          key = date.toISOString().slice(0, 10) + "T00:00:00.000Z"; // Group by day
          break;
        case "weekly":
          const weekStart = new Date(date);
          console.log("here is week start " ,weekStart);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10) + "T00:00:00.000Z"; // Group by week
          break;
        default:
          key = date.toISOString();
      }

      if (!groupedData[key]) {
        groupedData[key] = { sum: {}, count: 0 };
      }

      Object.keys(item).forEach((prop) => {
        if (typeof item[prop] === "number") {
          groupedData[key].sum[prop] =
            (groupedData[key].sum[prop] || 0) + item[prop];
        }
      });

      groupedData[key].count++;
    });

    return Object.entries(groupedData).map(([key, value]) => {
      const avgItem = { timestamp: new Date(key) };
      Object.keys(value.sum).forEach((prop) => {
        avgItem[prop] = value.sum[prop] / value.count;
      });
      return avgItem;
    })
  };

  // Handle period selection  
  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setFilteredData1([]); // Clear existing filtered data
    setFilteredData2([]); // Clear existing filtered data for sensor 2
  };

  // Handle station 1 selection
  const handleStationSelect = (stationId) => {
    setSelectedSensor(stationId);
    setFilteredData1([]); // Clear existing filtered data
    setSelectedPeriod("Today"); // Reset to default period
  };

  // Handle station 2 selection
  const handleStationSelect2 = (stationId) => {
    setSelectedSensor2(stationId);
    setFilteredData2([]); // Clear existing filtered data
    setSelectedPeriod("Today"); // Reset to default period
  };

  // Prepare data for chart
  useEffect(() => {
    filterData();
    //console.log("Filtered Data 1:", filteredData1);
    //console.log("Filtered Data 2:", filteredData2);
  }, [nodeData, nodeData2,selectedPeriod, dataResolution]);



  
  // Prepare dates and data for the chart
  //const dates = filteredData1.map((data) => new Date(data.timestamp));
  // Prepare timestamps from both stations
  const timestamps1 = new Set(filteredData1.map((data) => data.timestamp)); // Using Set for fast lookup
  const timestamps2 = new Set(filteredData2.map((data) => data.timestamp));
  //console.log("1 Timestamps:", timestamps1);
  //console.log("2 Timestamps:", timestamps2);
  // Find common timestamps
  const commonTimestamps = Array.from(timestamps1).filter(timestamp => timestamps2.has(timestamp));
  // Log the common timestamps to the console
  //console.log("Common Timestamps:", commonTimestamps);
  

  //filteredData1.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  //filteredData2.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Get all timestamps from both stations
  const allTimestamps = [...new Set([
    ...filteredData1.map(data => data.timestamp),
    ...filteredData2.map(data => data.timestamp),
  ])];

  // Sort timestamps to create a unified X-axis
  allTimestamps.sort((a, b) => new Date(a) - new Date(b));

  // Prepare dates for X-axis
  const xTimestamps = allTimestamps.map(timestamp => new Date(timestamp));

  console.log("alltimestamp :", xTimestamps);
  

  // Prepare data for the chart using the unified timestamps for Sensor 1
  const filteredDataForSensor1 = allTimestamps.map((timestamp) => {
    const entry = filteredData1.find(data => data.timestamp === timestamp);
    if (entry) {
      // Return the selected data type
      switch (selectedType) {
        case "Humidity":
          return entry.humidity;
        case "Temperature":
          return entry.temperature;
        case "Nox":
          return entry.nox;
        case "Voc":
          return entry.voc;
        case "Pm1p0":
          return entry.pm1p0;
        case "Pm2p5":
          return entry.pm2p5;
        case "Pm4p0":
          return entry.pm4p0;
        case "Pm10p0":
          return entry.pm10p0;
        case "Co2":
          return entry.co2;
        default:
          return null;
      }
    } else {
      return null; // If no entry found for this timestamp, return null
    }
  });

  // Prepare data for the chart using the unified timestamps for Sensor 2
  const filteredDataForSensor2 = allTimestamps.map((timestamp) => {
    const entry = filteredData2.find(data => data.timestamp === timestamp);
    if (entry) {
      // Return the selected data type
      switch (selectedType) {
        case "Humidity":
          return entry.humidity;
        case "Temperature":
          return entry.temperature;
        case "Nox":
          return entry.nox;
        case "Voc":
          return entry.voc;
        case "Pm1p0":
          return entry.pm1p0;
        case "Pm2p5":
          return entry.pm2p5;
        case "Pm4p0":
          return entry.pm4p0;
        case "Pm10p0":
          return entry.pm10p0;
        case "Co2":
          return entry.co2;
        default:
          return null;
      }
    } else {
      return null; // If no entry found for this timestamp, return null
    }
  });
  
  console.log("here is the data i think : ", filteredDataForSensor1)

  const getTitle = (selectedType) => {
    switch (selectedType) {
      case "Pm1p0":
        return "PM1.0 (μg/m³)";
      case "Pm2p5":
        return "PM2.5 (μg/m³)";
      case "Pm4p0":
        return "PM4.0 (μg/m³)";
      case "Pm10p0":
        return "PM10.0 (μg/m³)";
      case "Temperature":
        return "Temperature (°C)";
      case "Humidity":
        return "Humidity (%)";
      case "Voc":
        return "VOC (ppb)";
      case "Nox":
        return "NOx (ppb)";
      case "Co2":
        return "CO2 (ppm)";
      default:
        return "";
    }
  };
  const getStationNameByStationId = (sensorId) => {
    const station = stations.find((station) => station["_id"] === sensorId);
    return station ? station["name"] : "Select Station";
  };




  const pm25AnnotationScaleDaily = [
    {
      type: "box",
      yMin: 40,
      yMax: Infinity ,
      backgroundColor: "rgba(255, 0, 0, 0.5)", // Strong Red for Unsafe
      borderWidth: 0,
      label: {
        content: "UnSafe",
        display: true,
        backgroundColor: "rgba(255, 0, 0, 0.9)", // Fully Opaque Strong Red
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 0,
      yMax: 40,
      backgroundColor: "rgba(82, 196, 26, 0.45)", // Green for Good
      borderWidth: 0,
      label: {
        content: "Safe",
        display: true,
        backgroundColor: "green",
        color: "white",
        position: "end", // Center the label horizontally
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
  ];
  
  const pm25AnnotationScaleHourly = [
    {
      type: "box",
      yMin: 254,
      yMax: Infinity,
      backgroundColor: "rgba(128, 0, 128, 0.5)", // Strong Purple for Very Unhealthy
      borderWidth: 0,
      label: {
        content: "Hazardous",
        display: true,
        backgroundColor: "rgba(128, 0, 128, 0.6)", // Fully Opaque Strong Purple
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 204,
      yMax: 253,
      backgroundColor: "rgba(255, 0, 0, 0.5)", // Strong Red for Unhealthy
      borderWidth: 0,
      label: {
        content: "Very Unhealthy",
        display: true,
        backgroundColor: "rgba(255, 0, 0, 0.9)", // Fully Opaque Strong Red
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },          
    {
      type: "box",
      yMin: 154,
      yMax: 203,
      backgroundColor: "rgba(255, 140, 0, 0.5)", // Strong Orange for Unhealthy for Sensitive Groups
      borderWidth: 0,
      label: {
        content: "Unhealthy",
        display: true,
        backgroundColor: "rgba(245, 116, 37, 0.45)", // Stronger Orange
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 104,
      yMax: 153,
      backgroundColor: "rgba(255, 215, 0, 0.5)", // Strong Yellow for Moderate
      borderWidth: 0,
      label: {
        content: "Moderate",
        display: true,
        backgroundColor: "rgba(255, 215, 0, 0.9)", // Stronger Yellow
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 0,
      yMax: 103,
      backgroundColor: "rgba(82, 196, 26, 0.45)", // Green for Good
      borderWidth: 0,
      label: {
        content: "Good",
        display: true,
        backgroundColor: "green",
        color: "white",
        position: "end", // Center the label horizontally
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
  ];
  
  const pm10AnnotationScaleDaily = [
    {
      type: "box",
      yMin: 75,
      yMax: Infinity ,
      backgroundColor: "rgba(255, 0, 0, 0.5)", // Strong Red for Unsafe
      borderWidth: 0,
      label: {
        content: "UnSafe",
        display: true,
        backgroundColor: "rgba(255, 0, 0, 0.9)", // Fully Opaque Strong Red
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 0,
      yMax: 75,
      backgroundColor: "rgba(82, 196, 26, 0.45)", // Green for Good
      borderWidth: 0,
      label: {
        content: "Safe",
        display: true,
        backgroundColor: "green",
        color: "white",
        position: "end", // Center the label horizontally
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
  ];
  
  const pm10AnnotationScaleHourly = [
    {
      type: "box",
      yMin: 341,
      yMax: Infinity,
      backgroundColor: "rgba(128, 0, 128, 0.5)", // Strong Purple for Very Unhealthy
      borderWidth: 0,
      label: {
        content: "Hazardous",
        display: true,
        backgroundColor: "rgba(128, 0, 128, 0.6)", // Fully Opaque Strong Purple
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 291,
      yMax: 340,
      backgroundColor: "rgba(255, 0, 0, 0.5)", // Strong Red for Unhealthy
      borderWidth: 0,
      label: {
        content: "Very Unhealthy",
        display: true,
        backgroundColor: "rgba(255, 0, 0, 0.9)", // Fully Opaque Strong Red
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },          
    {
      type: "box",
      yMin: 241,
      yMax: 290,
      backgroundColor: "rgba(255, 140, 0, 0.5)", // Strong Orange for Unhealthy for Sensitive Groups
      borderWidth: 0,
      label: {
        content: "Unhealthy",
        display: true,
        backgroundColor: "rgba(245, 116, 37, 0.45)", // Stronger Orange
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 191,
      yMax: 240,
      backgroundColor: "rgba(255, 215, 0, 0.5)", // Strong Yellow for Moderate
      borderWidth: 0,
      label: {
        content: "Moderate",
        display: true,
        backgroundColor: "rgba(255, 215, 0, 0.9)", // Stronger Yellow
        color: "white",
        position: "end",
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
    {
      type: "box",
      yMin: 0,
      yMax: 190,
      backgroundColor: "rgba(82, 196, 26, 0.45)", // Green for Good
      borderWidth: 0,
      label: {
        content: "Good",
        display: true,
        backgroundColor: "green",
        color: "white",
        position: "end", // Center the label horizontally
        font: {
          size: 14, // Increase font size
          weight: "bold", // Ensure bold text
        },
      },
    },
  ];
  
  const chartInfo = {
    labels: xTimestamps,
    datasets: [
      {
        label: getStationNameByStationId(selectedSensor), // Dataset 1
        data: filteredDataForSensor1,
        fill: false,
        backgroundColor: "rgba(54, 162, 235, 1)",
        borderColor: "rgba(54, 162, 235, 1)", // Blue color for Dataset 1
        yAxisID: 'y',
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: "#FFFFFF",
        pointBorderColor: "rgba(54, 162, 235, 1)",
        pointBorderWidth: 2,
        spanGaps: true, // This will link points even with missing values
        shadowColor: "rgba(0, 0, 0, 0.3)", // Add subtle shadow for clarity
        shadowBlur: 10,
      //  showLine: true,
      //  pointRadius: 0,  // hides individual points
      },
      ...(selectedSensor2 !== "No Station 2 Selected"
        ? [
            {
              label: getStationNameByStationId(selectedSensor2), // Dataset 2
              data: filteredDataForSensor2,
              fill: false,
              backgroundColor: "rgba(255, 99, 132, 1)",
              borderColor: "rgba(255, 99, 132, 1)", // Pink color for Dataset 2
              yAxisID: 'y1',
              tension: 0.4,
              borderWidth: 2,
              pointBackgroundColor: "#FFFFFF",
              pointBorderColor: "rgba(255, 99, 132, 1)",
              pointBorderWidth: 2,
              spanGaps: true, // This will link points even with missing values
              shadowColor: "rgba(0, 0, 0, 0.3)", // Add subtle shadow for clarity
              shadowBlur: 10,
            },
          ]
        : []),
    ],
  };

  const selectedData = chartInfo;
  
  const calculateYMax = () => {
    const allDataValues = [
      ...filteredDataForSensor1.filter(val => val !== null), // Filter out nulls
    ];
  
    const maxValue = Math.max(...allDataValues);
    return Math.ceil(maxValue / 10) * 10; // Multiply max value by 10 and round up
  };
  
  // Prepare dynamic yMax
  //const yMax = calculateYMax();
  const isTemperatureOrHumidity = selectedType === "Temperature" || selectedType === "Humidity" || selectedType === "Voc" || selectedType === "Nox" || selectedType === "Pm1p0" || selectedType === "Pm4p0" ;
   
  const generateAnnotations = (Dataresolution) => {
    let scale;

      if (Dataresolution === "daily") {
        if (selectedType === "Pm10p0") {
          scale = pm10AnnotationScaleDaily;
        } else if (selectedType === "Pm2p5") {
          scale = pm25AnnotationScaleDaily;
        } else {
          scale = []; // No annotations for other types
        }
      } else if (Dataresolution === "hourly") {
        if (selectedType === "Pm10p0") {
          scale = pm10AnnotationScaleHourly;
        } else if (selectedType === "Pm2p5") {
          scale = pm25AnnotationScaleHourly;
        } else {
          scale = []; // No annotations for other types
        }
      } else {
        scale = []; // Empty array for unsupported resolutions
      }
  
  
    return scale.map((band) => ({
      type: "box",
      yMin: band.yMin,
      yMax: band.yMax,
      backgroundColor: band.backgroundColor,
      borderWidth: 0, // No border for clean visuals
      label: {
        display: true,
        content: band.label.content || band.label, // Ensure content is set correctly
        position: band.label.position || "start",
        font: band.label.font || {
          size: 12,
          weight: "normal",
        },
        color: band.label.color || "rgba(0, 0, 0, 0.7)",
      },
    }));
  };
  
  

  const chartOptions = {
    type : 'line',
    responsive: true,
    scales: {
      x: {
        type: "time",
        time: {
          unit: dataResolution === "raw" ? "hour" : dataResolution,
          displayFormats: {
            hour: "MMM D, HH:mm",
            day: "MMM D",
            week: "MMM D",
          },
        },
        grid: {
          display: true,
        },
        display: true,
      },
      y: {
        //max : yMax,
        position: 'left',
        grid: {
          display: true,
          drawOnChartArea: false, // Avoid overlapping grid lines
        },
        ticks: {
          color: "rgba(255, 99, 132, 1)", // blue for left y-axis
          stepSize: 50,
        },
        display: true,
        title: {
          display: true,
          text: '1st station', // 
          color: '#000', // 
          font: {
              size: 14, // Optional: Set title font size
          },
        },
      },
      y1: {
        grid: {
          display: true,
          drawOnChartArea: false, // Only want the grid lines for one axis to show up
        },
        display: true,
        ticks: {
          color: "rgba(54, 162, 235, 1)", // pink for right y-axis
          stepSize: 50,
        },
        title: {
          display: true,
          text: '2nd station', // 
          color: '#000', // 
          font: {
              size: 14, // Optional: Set title font size
          },
        },
      },
    },
    plugins: {
      legend: {
        display: selectedSensor2 !== "No Station 2 Selected",
      },
      annotation: {
        annotations: generateAnnotations(dataResolution), // Dynamic annotations
      },
    },
    elements: {
      line: {
        z: 10, // Ensure data lines are on top
      },
      point: {
        radius: 1,
        z: 20,
      },
    },
    maintainAspectRatio: false,
  };

  

  return (
    <div
      className="d-flex flex-row"
      style={{
        minHeight: "100vh",
        maxHeight: "100vh",
        background: "#f2f2f2",
        overflowY: "hidden",
      }}>
      <Sidebar />
      <Container
        fluid
        className="p-4"
        >
        <TopNavBar />
        <div className="d-flex flex-row justify-content-between">
          {/* 1st Station Selector */}
          <Dropdown onSelect={(eventKey) => handleStationSelect(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              size="sm"
              style={{
                background: "#4A90E2", // Modern blue shade
                border: "none",
                borderRadius: "20px", // Rounded corners
                padding: "10px 20px", // Padding for a cleaner button size
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow
                fontSize: "14px", // Better readability
                fontWeight: "600", // Semi-bold for better emphasis
                color: "#fff", // White text for contrast
                transition: "all 0.3s ease", // Smooth hover transition
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#357ABD"; // Darker blue on hover
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#4A90E2"; // Original blue
              }}
            >
              {getStationNameByStationId(selectedSensor)}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ maxHeight: "80vh", overflowY: "scroll" }}>
              {stations.map((station, index) => (
                <Dropdown.Item key={index} eventKey={station["_id"]}>
                  {station["name"]}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
  
          {/* 2nd Station Selector */}
          <Dropdown onSelect={(eventKey) => handleStationSelect2(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              size="sm"
              style={{
                background: "#4A90E2", // Modern blue shade
                border: "none",
                borderRadius: "20px", // Rounded corners
                padding: "10px 20px", // Padding for a cleaner button size
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow
                fontSize: "14px", // Better readability
                fontWeight: "600", // Semi-bold for better emphasis
                color: "#fff", // White text for contrast
                transition: "all 0.3s ease", // Smooth hover transition
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#357ABD"; // Darker blue on hover
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#4A90E2"; // Original blue
              }}
            >
              {selectedSensor2 === "No Station 2 Selected" ? "Select station 2" : getStationNameByStationId(selectedSensor2)}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ maxHeight: "80vh", overflowY: "scroll" }}>
              <Dropdown.Item eventKey="No Station 2 Selected">No Station 2 Selected</Dropdown.Item>
              {stations.map((station, index) => (
                <Dropdown.Item key={index} eventKey={station["_id"]}>
                  {station["name"]}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
  
          {/* Period Selector */}
          <Dropdown onSelect={(eventKey) => handlePeriodSelect(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              size="sm"
              style={{
                background: "#4A90E2", // Modern blue shade
                border: "none",
                borderRadius: "20px", // Rounded corners
                padding: "10px 20px", // Padding for a cleaner button size
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow
                fontSize: "14px", // Better readability
                fontWeight: "600", // Semi-bold for better emphasis
                color: "#fff", // White text for contrast
                transition: "all 0.3s ease", // Smooth hover transition
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#357ABD"; // Darker blue on hover
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#4A90E2"; // Original blue
              }}
            >
              {selectedPeriod}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="Today">Today</Dropdown.Item>
              <Dropdown.Item eventKey="Last Day">Last Day</Dropdown.Item>
              <Dropdown.Item eventKey="7 Days">7 Days</Dropdown.Item>
              <Dropdown.Item eventKey="30 Days">30 Days</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
  
          {/* Data Resolution Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Dropdown onSelect={(eventKey) => setDataResolution(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-resolution"
              size="sm"
              style={{
                background: "#4A90E2", // Modern blue shade
                border: "none",
                borderRadius: "20px", // Rounded corners
                padding: "10px 20px", // Padding for a cleaner button size
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow
                fontSize: "14px", // Better readability
                fontWeight: "600", // Semi-bold for better emphasis
                color: "#fff", // White text for contrast
                transition: "all 0.3s ease", // Smooth hover transition
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#357ABD"; // Darker blue on hover
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#4A90E2"; // Original blue
              }}
            >
              {dataResolution === "raw"
                ? "Raw Data"
                : `${dataResolution.charAt(0).toUpperCase() + dataResolution.slice(1)} Averages`}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="raw">Raw Data</Dropdown.Item>
              <Dropdown.Item eventKey="hourly">Hourly Averages</Dropdown.Item>
              <Dropdown.Item eventKey="daily">Daily Averages</Dropdown.Item>
              <Dropdown.Item eventKey="weekly">Weekly Averages</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>  
              {/* Tooltip Icon */}
              <OverlayTrigger
                placement="bottom"
                overlay={
                  <Tooltip id="tooltip-info">
                    Switch to "Hourly Averages" or "Daily Averages" to view color-coded data. 
                  </Tooltip>
                }
              >
                <i
                  className="fa fa-info-circle"
                  style={{
                    fontSize: "16px",
                    color: "#2068F3",
                    cursor: "pointer",
                    marginLeft: "10px", // Adjust spacing between dropdown and icon
                  }}
                ></i>
               </OverlayTrigger>
               </div>
        </div>

        <Row className="mt-4">
          <Col>
            <Card
              className="mt-1"
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                minHeight: "60vh",
              }}>
              <h6
                style={{
                  color: "#666",
                  fontWeight: "bold",
                  fontSize: "10px",
                  fontFamily: "Helvetica Neue",
                  textAlign: "left",
                  padding: "1rem",
                }}>
                <div className="d-flex flex-row justify-content-between">
                  <Dropdown onSelect={(eventKey) => handleTypeSelect(eventKey)}>
                    <Dropdown.Toggle
                      id="dropdown-basic"
                      style={{
                        background: "#FFF",
                        borderColor: "#666",
                        color: "#666",
                        fontWeight: "bold",
                        fontSize: "10px",
                        fontFamily: "Helvetica Neue",
                      }}>
                      {getTitle(selectedType)}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item eventKey="Pm1p0">PM1.0</Dropdown.Item>
                      <Dropdown.Item eventKey="Pm2p5">PM2.5</Dropdown.Item>
                      <Dropdown.Item eventKey="Pm4p0">PM4.0</Dropdown.Item>
                      <Dropdown.Item eventKey="Pm10p0">PM10.0</Dropdown.Item>
                      <Dropdown.Item eventKey="Temperature">Temperature</Dropdown.Item>
                      <Dropdown.Item eventKey="Humidity">Humidity</Dropdown.Item>
                      <Dropdown.Item eventKey="Voc">VOC</Dropdown.Item>
                      <Dropdown.Item eventKey="Nox">NOx</Dropdown.Item>
                      <Dropdown.Item eventKey="Co2">CO2</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </h6>
              
              {isLoading ? (
                <div
                  style={{
                    height: "75vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <h3>Loading 30 Days Data...</h3>
                </div>
              ) : filteredData2 && filteredData1 && filteredData2.length > 0 && filteredData1.length > 0 ? (
                <div style={{
                  height: "75vh",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: "20px",
                }}>
                      {/* Chart */}
                      <div style={{ flex: 1, minWidth: "0" , height: "100%"}}>
                        <ChartCard
                          data={selectedData}
                          options={chartOptions}
                          title={getTitle(selectedType)}
                          multiAxis
                        />
                      </div> 
                {/* Dynamic Legend */}
                  <div
                    style={{
                      width: "240px",
                     // marginTop: "20px",
                      visibility: isTemperatureOrHumidity ? "hidden" : "visible",
                      opacity: isTemperatureOrHumidity ? 0 : 1,
                      pointerEvents: isTemperatureOrHumidity ? "none" : "auto",
                      transition: "opacity 0.3s ease-in-out",
                      fontSize: "12px",
                      lineHeight: "1.4",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    {(
                      dataResolution === "daily"
                        ? selectedType === "Pm10p0"
                          ? pm10AnnotationScaleDaily
                          : pm25AnnotationScaleDaily
                        : dataResolution === "hourly"
                        ? selectedType === "Pm10p0"
                          ? pm10AnnotationScaleHourly
                          : pm25AnnotationScaleHourly
                        : []
                    ).map((band, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: band.backgroundColor,
                          padding: "8px",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            backgroundColor: band.backgroundColor,
                            borderRadius: "50%",
                            marginRight: "10px",
                          }}
                        ></div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            width: "100%", // Ensure consistent space for text alignment
                          }}
                        >
                          <strong
                            style={{
                              color: band.label.color || "black",
                              whiteSpace: "nowrap", // Prevent text wrapping
                              overflow: "hidden", // Clip overflowing text
                              textOverflow: "ellipsis", // Add ellipsis for long text
                            }}
                          >
                            {band.label.content || band.label}
                          </strong>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "10px",
                              color: "#444",
                              textAlign: "left", // Align text to the left
                            }}
                          >
                            {`Range: ${band.yMin} - ${band.yMax === Infinity ? "∞" : band.yMax}`}
                          </p>
                        </div>
                      </div>
                    ))}
                      {/* Information Note */}
                      {dataResolution === "raw" &&  (
                       <div
                       style={{
                         marginTop: "20px",
                         textAlign: "center",
                         fontSize: "12px",
                         lineHeight: "1.6",
                         color: "#444",
                         backgroundColor: "#eef2f9",
                         padding: "15px",
                         borderRadius: "8px",
                         boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                         fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                         transition: "all 0.3s ease-in-out",
                       }}
                     >
                       <div style={{ marginBottom: "10px", fontWeight: "bold", color: "#2068F3" }}>
                         🌟 Explore More Insights!
                       </div>
                       <p style={{ margin: "0", color: "#555" }}>
                         Learn more about the thresholds and air quality levels by switching your data resolution to{" "}
                         <strong>Daily Averages</strong> or <strong>Hourly Averages</strong>.
                       </p>
                       <p style={{ margin: "0", fontSize: "11px", color: "#777", marginTop: "10px" }}>
                         For additional information, refer to{" "}
                         <a
                           href="https://saaqis.environment.gov.za/Pagesfiles/SAAQIS%20Air%20Quality%20Index%20for%20General%20Public-Summary.pdf"
                           target="_blank"
                           rel="noopener noreferrer"
                           style={{
                             color: "#2068F3",
                             textDecoration: "underline",
                             fontWeight: "bold",
                           }}
                         >
                           this link
                         </a>{" "}
                         to understand how air pollutant concentrations are categorized into levels like <strong>Good</strong>,{" "}
                         <strong>Moderate</strong>, or <strong>Hazardous</strong>.
                       </p>
                     </div>                     
                      )}

                      {dataResolution !== "raw" && dataResolution !== "weekly" && !isTemperatureOrHumidity && (
                        <div
                          style={{
                            marginTop: "20px",
                            textAlign: "center",
                            fontSize: "10px",
                            lineHeight: "1.5",
                            color: "#555",
                            backgroundColor: "#f9f9f9",
                            padding: "10px",
                            borderRadius: "6px",
                            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
                            fontStyle: "italic",
                          }}
                        >
                          Want to learn more? Check out{" "}
                          <a
                            href="https://saaqis.environment.gov.za/Pagesfiles/SAAQIS%20Air%20Quality%20Index%20for%20General%20Public-Summary.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#2068F3",
                              textDecoration: "underline",
                              fontWeight: "bold",
                            }}
                          >
                            this resource
                          </a>{" "}
                          for detailed insights.
                        </div>
                      )}
                    </div>
                </div>
              ) : filteredData1 && filteredData1.length > 0 && selectedSensor2 == "No Station 2 Selected" ? (
                <div style={{
                  height: "75vh",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: "20px",
                }}>
                {/* Chart */}
                <div style={{ flex: 1, minWidth: "0" , height: "100%"}}>
                  <ChartCard
                    data={selectedData}
                    options={chartOptions}
                    title={getTitle(selectedType)}
                    multiAxis
                  />
                </div> 
          {/* Dynamic Legend */}
            <div
              style={{
                width: "240px",
               // marginTop: "20px",
                visibility: isTemperatureOrHumidity ? "hidden" : "visible",
                opacity: isTemperatureOrHumidity ? 0 : 1,
                pointerEvents: isTemperatureOrHumidity ? "none" : "auto",
                transition: "opacity 0.3s ease-in-out",
                fontSize: "12px",
                lineHeight: "1.4",
                fontFamily: "Arial, sans-serif",
              }}
            >
              {(
                dataResolution === "daily"
                  ? selectedType === "Pm10p0"
                    ? pm10AnnotationScaleDaily
                    : pm25AnnotationScaleDaily
                  : dataResolution === "hourly"
                  ? selectedType === "Pm10p0"
                    ? pm10AnnotationScaleHourly
                    : pm25AnnotationScaleHourly
                  : []
              ).map((band, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: band.backgroundColor,
                    padding: "8px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      backgroundColor: band.backgroundColor,
                      borderRadius: "50%",
                      marginRight: "10px",
                    }}
                  ></div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      width: "100%", // Ensure consistent space for text alignment
                    }}
                  >
                    <strong
                      style={{
                        color: band.label.color || "black",
                        whiteSpace: "nowrap", // Prevent text wrapping
                        overflow: "hidden", // Clip overflowing text
                        textOverflow: "ellipsis", // Add ellipsis for long text
                      }}
                    >
                      {band.label.content || band.label}
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "10px",
                        color: "#444",
                        textAlign: "left", // Align text to the left
                      }}
                    >
                      {`Range: ${band.yMin} - ${band.yMax === Infinity ? "∞" : band.yMax}`}
                    </p>
                  </div>
                </div>
              ))}
                 {/* Information Note */}
                  {dataResolution === "raw" && (
                   <div
                   style={{
                     marginTop: "20px",
                     textAlign: "center",
                     fontSize: "12px",
                     lineHeight: "1.6",
                     color: "#444",
                     backgroundColor: "#eef2f9",
                     padding: "15px",
                     borderRadius: "8px",
                     boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                     fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                     transition: "all 0.3s ease-in-out",
                   }}
                 >
                   <div style={{ marginBottom: "10px", fontWeight: "bold", color: "#2068F3" }}>
                     🌟 Explore More Insights!
                   </div>
                   <p style={{ margin: "0", color: "#555" }}>
                     Learn more about the thresholds and air quality levels by switching your data resolution to{" "}
                     <strong>Daily Averages</strong> or <strong>Hourly Averages</strong>.
                   </p>
                   <p style={{ margin: "0", fontSize: "11px", color: "#777", marginTop: "10px" }}>
                     For additional information, refer to{" "}
                     <a
                       href="https://saaqis.environment.gov.za/Pagesfiles/SAAQIS%20Air%20Quality%20Index%20for%20General%20Public-Summary.pdf"
                       target="_blank"
                       rel="noopener noreferrer"
                       style={{
                         color: "#2068F3",
                         textDecoration: "underline",
                         fontWeight: "bold",
                       }}
                     >
                       this link
                     </a>{" "}
                     to understand how air pollutant concentrations are categorized into levels like <strong>Good</strong>,{" "}
                     <strong>Moderate</strong>, or <strong>Hazardous</strong>.
                   </p>
                 </div>
                 
                 
                  )}

                  {dataResolution !== "raw" && dataResolution !== "weekly" && !isTemperatureOrHumidity && (
                    <div
                      style={{
                        marginTop: "20px",
                        textAlign: "center",
                        fontSize: "10px",
                        lineHeight: "1.5",
                        color: "#555",
                        backgroundColor: "#f9f9f9",
                        padding: "10px",
                        borderRadius: "6px",
                        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
                        fontStyle: "italic",
                      }}
                    >
                      Want to learn more? Check out{" "}
                      <a
                        href="https://saaqis.environment.gov.za/Pagesfiles/SAAQIS%20Air%20Quality%20Index%20for%20General%20Public-Summary.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#2068F3",
                          textDecoration: "underline",
                          fontWeight: "bold",
                        }}
                      >
                        this resource
                      </a>{" "}
                      for detailed insights.
                    </div>
                  )}
              </div>
          </div>
              ) : filteredData2 && filteredData2.length > 0 ? (
                <div style={{ height: "75vh" }}>
                  <div
                    style={{
                      textAlign: "center",
                      color: "#444",
                      fontWeight: "bold",
                      fontSize: "18px",
                      fontFamily: "Arial, sans-serif",
                      padding: "10px",
                      background: "rgba(240, 240, 240, 0.8)",
                      border: "1px solid rgba(200, 200, 200, 0.8)",
                      borderRadius: "8px",
                      margin: "10px 0",
                      maxWidth: "60%",
                      marginLeft: "auto",
                      marginRight: "auto",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                    }}>
                    Loading data for for {selectedSensor ? getStationNameByStationId(selectedSensor) : "Station 1"}.
                  </div>
                  <ChartCard
                    data={selectedData}
                    options={chartOptions}
                    title={`${getTitle(selectedType)} - Station 2`}
                  />
                </div>
              ) : filteredData1 && filteredData1.length > 0 ? (
                <div style={{ height: "75vh" }}>
                  <div
                    style={{
                      textAlign: "center",
                      color: "#444",
                      fontWeight: "bold",
                      fontSize: "18px",
                      fontFamily: "Arial, sans-serif",
                      padding: "10px",
                      background: "rgba(240, 240, 240, 0.8)",
                      border: "1px solid rgba(200, 200, 200, 0.8)",
                      borderRadius: "8px",
                      margin: "10px 0",
                      maxWidth: "60%",
                      marginLeft: "auto",
                      marginRight: "auto",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                    }}>
                     Loading data for {selectedSensor2 ? getStationNameByStationId(selectedSensor2) : "Station 2"}... Please wait!
                  </div>
                  <ChartCard
                    data={selectedData}
                    options={chartOptions}
                    title={`${getTitle(selectedType)} - Station 1`}
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: "75vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}>
                  <h3>Loading data... Please wait!</h3>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
  
};

export default AnalyticsScreen;