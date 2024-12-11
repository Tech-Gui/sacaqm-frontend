// AnalyticsScreen.js
import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Card, Dropdown } from "react-bootstrap";
import Sidebar from "../components/SideBar";
import TopNavBar from "../components/topNavBar";
import ChartCard from "../components/chartCard.js";

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
      default:
        return "";
    }
  };
  const getStationNameByStationId = (sensorId) => {
    const station = stations.find((station) => station["_id"] === sensorId);
    return station ? station["name"] : "Select Station";
  };

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
  const isTemperatureOrHumidity = selectedType === "Temperature" || selectedType === "Humidity" || selectedType === "Voc" || selectedType === "Nox";
   


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
      annotation:  isTemperatureOrHumidity
      ? undefined // Disable annotations for temperature and humidity
      : {
        annotations: [
          {
            type: "box",
            yMin: 300,
            yMax: 350,
            backgroundColor: "rgba(128, 0, 0, 0.5)", // Maroon for Hazardous
            borderWidth: 0,
            label: {
              content: "Hazardous",
              display: true,
              backgroundColor: "maroon",
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
            yMin: 200,
            yMax: 300,
            backgroundColor: "rgba(128, 0, 128, 0.5)", // Strong Purple for Very Unhealthy
            borderWidth: 0,
            label: {
              content: "Very Unhealthy",
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
            yMin: 150,
            yMax: 200,
            backgroundColor: "rgba(255, 0, 0, 0.5)", // Strong Red for Unhealthy
            borderWidth: 0,
            label: {
              content: "Unhealthy",
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
            yMin: 100,
            yMax: 150,
            backgroundColor: "rgba(255, 140, 0, 0.5)", // Strong Orange for Unhealthy for Sensitive Groups
            borderWidth: 0,
            label: {
              content: "Unhealthy for Sensitive Groups",
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
            yMin: 50,
            yMax: 100,
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
            yMax: 50,
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
        ],
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
        style={{
          minHeight: "98vh",
          maxHeight: "100vh",
          overflowY: "scroll",
          padding: "2rem",
        }}>
        <TopNavBar />
        <div className="d-flex flex-row justify-content-between">
          {/* 1st Station Selector */}
          <Dropdown onSelect={(eventKey) => handleStationSelect(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              size="sm"
              style={{
                background: "#2068F3",
                border: "No Station 2 Selected",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}>
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
                background: "#2068F3",
                border: "No Station 2 Selected",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}>
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
                background: "#2068F3",
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}>
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
          <Dropdown onSelect={(eventKey) => setDataResolution(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-resolution"
              size="sm"
              style={{
                background: "#2068F3",
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}>
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

                      {/* Legend */}
                      
                      <div
                          style={{
                            width: "240px", // Consistent width for the legend container
                            visibility: isTemperatureOrHumidity ? "hidden" : "visible",
                            opacity: isTemperatureOrHumidity ? 0 : 1,
                            pointerEvents: isTemperatureOrHumidity ? "none" : "auto",
                            transition: "opacity 0.3s ease-in-out",
                            fontSize: "12px",
                            lineHeight: "1.4",
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          {[
                            { label: "Hazardous", range: "301+", bg: "rgba(128, 0, 0, 0.1)", color: "#600", icon: "maroon" },
                            { label: "Very Unhealthy", range: "201-300", bg: "rgba(153, 50, 204, 0.1)", color: "purple", icon: "purple" },
                            { label: "Unhealthy", range: "151-200", bg: "rgba(255, 99, 132, 0.3)", color: "red", icon: "rgba(255, 0, 0, 0.7)" },
                            { label: "Unhealthy for Sensitive Groups", range: "101-150", bg: "rgba(255, 165, 0, 0.3)", color: "orange", icon: "orange" },
                            { label: "Moderate", range: "51-100", bg: "rgba(255, 223, 0, 0.4)", color: "goldenrod", icon: "rgba(255, 215, 0, 0.7)" },
                            { label: "Good", range: "0-50", bg: "rgba(144, 238, 144, 0.4)", color: "green", icon: "rgba(82, 196, 26, 0.7)" },
                          ].map((item, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: item.bg,
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
                                  backgroundColor: item.icon,
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
                                    color: item.color,
                                    whiteSpace: "nowrap", // Prevent text wrapping
                                    overflow: "hidden", // Clip overflowing text
                                    textOverflow: "ellipsis", // Add ellipsis for long text
                                  }}
                                >
                                  {item.label}
                                </strong>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "10px",
                                    color: "#444",
                                    textAlign: "left", // Align text to the left
                                  }}
                                >
                                  {item.range}
                                </p>
                              </div>
                            </div>
                          ))}
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
                      <div style={{ flex: 1, minWidth: "0" , height: "100%" }}>
                        <ChartCard
                          data={selectedData}
                          options={chartOptions}
                          title={getTitle(selectedType)}
                        />
                      </div>

                      {/* Legend */}
                      <div
                          style={{
                            width: "240px", // Consistent width for the legend container
                            visibility: isTemperatureOrHumidity ? "hidden" : "visible",
                            opacity: isTemperatureOrHumidity ? 0 : 1,
                            pointerEvents: isTemperatureOrHumidity ? "none" : "auto",
                            transition: "opacity 0.3s ease-in-out",
                            fontSize: "12px",
                            lineHeight: "1.4",
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          {[
                            { label: "Hazardous", range: "301+", bg: "rgba(128, 0, 0, 0.1)", color: "#600", icon: "maroon" },
                            { label: "Very Unhealthy", range: "201-300", bg: "rgba(153, 50, 204, 0.1)", color: "purple", icon: "purple" },
                            { label: "Unhealthy", range: "151-200", bg: "rgba(255, 99, 132, 0.3)", color: "red", icon: "rgba(255, 0, 0, 0.7)" },
                            { label: "Unhealthy for Sensitive Groups", range: "101-150", bg: "rgba(255, 165, 0, 0.3)", color: "orange", icon: "orange" },
                            { label: "Moderate", range: "51-100", bg: "rgba(255, 223, 0, 0.4)", color: "goldenrod", icon: "rgba(255, 215, 0, 0.7)" },
                            { label: "Good", range: "0-50", bg: "rgba(144, 238, 144, 0.4)", color: "green", icon: "rgba(82, 196, 26, 0.7)" },
                          ].map((item, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: item.bg,
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
                                  backgroundColor: item.icon,
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
                                    color: item.color,
                                    whiteSpace: "nowrap", // Prevent text wrapping
                                    overflow: "hidden", // Clip overflowing text
                                    textOverflow: "ellipsis", // Add ellipsis for long text
                                  }}
                                >
                                  {item.label}
                                </strong>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "10px",
                                    color: "#444",
                                    textAlign: "left", // Align text to the left
                                  }}
                                >
                                  {item.range}
                                </p>
                              </div>
                            </div>
                          ))}
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