import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Card, Dropdown } from "react-bootstrap";
import Sidebar from "../components/SideBar";
import TopNavBar from "../components/topNavBar";
import ChartCard from "../components/chartCard.js";

import { useDataType } from "../contextProviders/dataTypeContext.js";
import { useSensorData } from "../contextProviders/sensorDataContext.js";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../contextProviders/DataContext.js";
import { StationContext } from "../contextProviders/StationContext.js";

const AnalyticsScreen = () => {
  const {
    data,
    selectedSensor,
    selectedPeriod,
    setSelectedSensor,
    setSelectedPeriod,
    fetchData,
  } = useSensorData();

  const { nodeData, fetchNodeData } = useContext(DataContext);

  const { stations, loading, error, fetchStations } =
    useContext(StationContext);

  const [filteredStationData, setFilteredStationData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData1, setFilteredData] = useState([]);

  const dates = filteredData1.map((data) => {
    const timestamp = new Date(data.timestamp);
    // Adding 2 hours to convert to SA time
    timestamp.setHours(timestamp.getHours());
    return timestamp;
  });
  useEffect(() => {
    const station = stations.find(
      (station) => station["_id"] === selectedSensor
    );

    if (station) {
      fetchNodeData(station._id);
      console.log("station found baba");
    } else {
      console.log("station not found");
    }
  }, [selectedSensor]);

  const { selectedType, handleTypeSelect } = useDataType();

  if (selectedType === "Pm1p0") {
    var title = "Pm 1.0 (μg/m³)";
  } else if (selectedType === "Pm2p5") {
    var title = "Pm 2.5 (μg/m³)";
  } else if (selectedType === "Pm4p0") {
    var title = "Pm 4.0 (μg/m³)";
  } else if (selectedType === "Pm10p0") {
    var title = "Pm 10.0 (μg/m³)";
  } else if (selectedType === "Temperature") {
    var title = "Temperature (°C)";
  } else if (selectedType === "Humidity") {
    var title = "Humidity (%)";
  } else if (selectedType === "Voc") {
    var title = "Voc (Ppb)";
  } else if (selectedType === "Nox") {
    var title = "Nox (Ppb)";
  }

  function getTitle(selectedType) {
    var title;
    if (selectedType === "Pm1p0") {
      title = "Pm 1.0 (μg/m³)";
    } else if (selectedType === "Pm2p5") {
      title = "Pm 2.5 (μg/m³)";
    } else if (selectedType === "Pm4p0") {
      title = "Pm 4.0 (μg/m³)";
    } else if (selectedType === "Pm10p0") {
      title = "Pm 10.0 (μg/m³)";
    } else if (selectedType === "Temperature") {
      title = "Temperature (°C)";
    } else if (selectedType === "Humidity") {
      title = "Humidity (%)";
    } else if (selectedType === "Voc") {
      title = "Voc (Ppb)";
    } else if (selectedType === "Nox") {
      title = "Nox (Ppb)";
    }
    return title;
  }

  const filteredData2 = filteredData1.map((data) => {
    // Check the value of selectedType and return the corresponding data property
    if (selectedType === "Humidity") {
      return data.humidity;
    } else if (selectedType === "Temperature") {
      return data.temperature;
    } else if (selectedType === "Nox") {
      return data.nox;
    } else if (selectedType === "Voc") {
      return data.voc;
    } else if (selectedType === "Pm1p0") {
      return data.pm1p0;
    } else if (selectedType === "Pm2p5") {
      return data.pm2p5;
    } else if (selectedType === "Pm4p0") {
      return data.pm4p0;
    } else if (selectedType === "Pm10p0") {
      return data.pm10p0;
    }

    // Default case if selectedType doesn't match any condition
    return null; // or return some default value
  });

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
        // pointRadius: 3,
        pointBorderColor: "#8fbaff",
        pointBorderWidth: 2,
      },
    ],
  };

  // const selectedData = data[selectedType];
  const selectedData = chartInfo;

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        grid: {
          display: true, // Display x-axis grid lines
        },
        display: false,
      },
      y: {
        grid: {
          display: true, // Display y-axis grid lines
        },
        display: false,
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

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
  };

  const handleStationSelect = (stationId) => {
    setSelectedPeriod("All Time");
    // setFilteredData([]);
    setSelectedSensor(stationId);

    const station = stations.find((station) => station["_id"] === stationId);

    if (station) {
      fetchNodeData(station._id);
    } else {
      console.log("station not found");
    }

    // setSensorName(station);
  };

  const getStationNameByStationId = (sensorId) => {
    // Loop through each station data object
    for (const station of stations) {
      // Check if the current station's ID matches the provided sensorId
      if (station["_id"] === sensorId) {
        // If there's a match, return the station name
        return station["name"];
      }
    }
  };

  useEffect(() => {
    console.log("called");
    filterData();
  }, [startDate, endDate, selectedPeriod]);

  useEffect(() => {
    // setFilteredData(nodeData);
    filterData();
  }, [nodeData]);

  const filterData = () => {
    let filtered = nodeData;

    if (selectedPeriod) {
      const now = new Date();
      let start = new Date();
      switch (selectedPeriod) {
        case "All Time":
          start.setDate(now.getDate() - 10000);
          break;
        case "Today":
          start.setHours(0, 0, 0, 0);
          break;
        case "Last Day":
          start.setDate(now.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        case "7 Days":
          start.setDate(now.getDate() - 7);
          break;
        case "30 Days":
          start.setDate(now.getDate() - 77);
          break;
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
    setFilteredData(filtered);
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
        className="p-4 "
        style={{
          minHeight: "98vh",
          maxHeight: "100vh",
          overflowY: "scroll",
          padding: "2rem",
        }}>
        <TopNavBar />
        <div className="d-flex flex-row justify-content-between">
          <Dropdown onSelect={(eventKey) => handleStationSelect(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              size="sm"
              style={{
                background: "#2068F3",
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}>
              {getStationNameByStationId(selectedSensor) || "Thulani"}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ maxHeight: "80vh", overflowY: "scroll" }}>
              {stations.map((station, index) => (
                <Dropdown.Item key={index} eventKey={station["_id"]}>
                  {station["name"]}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

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
              <Dropdown.Item eventKey="All Time">All Time</Dropdown.Item>
              <Dropdown.Item eventKey="Today">Today</Dropdown.Item>
              <Dropdown.Item eventKey="Last Day">Last Day</Dropdown.Item>
              <Dropdown.Item eventKey="7 Days">7 Days</Dropdown.Item>
              <Dropdown.Item eventKey="30 Days">30 Days</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <Row className="mt-4">
          <Col>
            <Card
              className="mt-1 "
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
                      {Object.keys(data).map((type) => (
                        <Dropdown.Item key={type} eventKey={type}>
                          {type}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </h6>

              {data ? (
                <div style={{ height: "75vh" }}>
                  <ChartCard
                    data={selectedData}
                    options={chartOptions}
                    // title={selectedType}
                    title={title}
                  />
                </div>
              ) : null}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AnalyticsScreen;
