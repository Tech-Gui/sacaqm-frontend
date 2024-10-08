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

const AnalyticsScreen = () => {
  const {
    selectedSensor,
    selectedPeriod,
    setSelectedSensor,
    setSelectedPeriod,
  } = useSensorData();

  const { nodeData, setNodeData, fetchNodeData } = useContext(DataContext);

  const { stations } = useContext(StationContext);

  const [filteredData1, setFilteredData] = useState([]);
  const [dataResolution, setDataResolution] = useState("raw");

  const { selectedType, handleTypeSelect } = useDataType();

  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Fetch data when the component mounts or when selectedSensor changes
  useEffect(() => {
    const station = stations.find(
      (station) => station["_id"] === selectedSensor
    );

    if (station) {
      // Default fetch is for 7 days
      fetchNodeData(station._id, 7);
      console.log("Data fetched for 7 days.");
    } else {
      console.log("Station not found.");
    }
  }, [selectedSensor]);

  // Fetch data when selectedPeriod changes to "30 Days"
  useEffect(() => {
    if (selectedPeriod === "30 Days") {
      const station = stations.find(
        (station) => station["_id"] === selectedSensor
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
    }
    // No need to fetch data for periods less than 7 days
  }, [selectedPeriod]);

  // Filter data based on selectedPeriod and dataResolution
  const filterData = () => {
    let filtered = nodeData;

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
        // No need for "30 Days" here since we fetch data separately
        default:
          start = null;
      }

      if (start) {
        filtered = nodeData.filter((item) => {
          const timestamp = new Date(item.timestamp);
          return timestamp >= start && timestamp <= now;
        });
      }
    }

    if (dataResolution !== "raw") {
      filtered = averageData(filtered, dataResolution);
    }

    setFilteredData(filtered);
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
    });
  };

  // Handle period selection
  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    setFilteredData([]); // Clear existing filtered data
  };

  // Handle station selection
  const handleStationSelect = (stationId) => {
    setSelectedSensor(stationId);
    setFilteredData([]); // Clear existing filtered data
    setSelectedPeriod("7 Days"); // Reset to default period
  };

  // Prepare data for chart
  useEffect(() => {
    filterData();
  }, [nodeData, selectedPeriod, dataResolution]);

  // Prepare dates and data for the chart
  const dates = filteredData1.map((data) => new Date(data.timestamp));

  const filteredData2 = filteredData1.map((data) => {
    // Return the selected data type
    switch (selectedType) {
      case "Humidity":
        return data.humidity;
      case "Temperature":
        return data.temperature;
      case "Nox":
        return data.nox;
      case "Voc":
        return data.voc;
      case "Pm1p0":
        return data.pm1p0;
      case "Pm2p5":
        return data.pm2p5;
      case "Pm4p0":
        return data.pm4p0;
      case "Pm10p0":
        return data.pm10p0;
      default:
        return null;
    }
  });

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

  const chartInfo = {
    labels: dates,
    datasets: [
      {
        label: getTitle(selectedType),
        data: filteredData2,
        fill: true,
        backgroundColor: function (context) {
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(88, 130, 239, 1)");
          gradient.addColorStop(0.25, "rgba(88, 130, 239, 0.75)");
          gradient.addColorStop(0.5, "rgba(88, 130, 239, 0.5)");
          gradient.addColorStop(0.75, "rgba(88, 130, 239, 0.25)");
          gradient.addColorStop(1, "rgba(88, 130, 239, 0.0)");
          return gradient;
        },
        borderColor: "#8fbaff",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        pointBorderColor: "#8fbaff",
        pointBorderWidth: 2,
      },
    ],
  };

  const selectedData = chartInfo;

  const chartOptions = {
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
        grid: {
          display: true,
        },
        display: true,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 1,
      },
    },
    maintainAspectRatio: false,
  };

  const getStationNameByStationId = (sensorId) => {
    const station = stations.find((station) => station["_id"] === sensorId);
    return station ? station["name"] : "Select Station";
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
          {/* Station Selector */}
          <Dropdown onSelect={(eventKey) => handleStationSelect(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              size="sm"
              style={{
                background: "#2068F3",
                border: "none",
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
                : `${
                    dataResolution.charAt(0).toUpperCase() +
                    dataResolution.slice(1)
                  } Averages`}
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
                      <Dropdown.Item eventKey="Temperature">
                        Temperature
                      </Dropdown.Item>
                      <Dropdown.Item eventKey="Humidity">
                        Humidity
                      </Dropdown.Item>
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
              ) : filteredData1 && filteredData1.length > 0 ? (
                <div style={{ height: "75vh" }}>
                  <ChartCard
                    data={selectedData}
                    options={chartOptions}
                    title={getTitle(selectedType)}
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
                  <h3>No Data Available</h3>
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
