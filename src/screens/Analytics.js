import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Dropdown } from "react-bootstrap";
import Sidebar from "../components/SideBar";
import ChartCard from "../components/chartCard.js";
import sensorData from "../dummyData/SensorData.js";
import { useDataType } from "../contextProviders/dataTypeContext.js";
import { useSensorData } from "../contextProviders/sensorDataContext.js";
import { useNavigate } from "react-router-dom";

const AnalyticsScreen = () => {
  const {
    data,
    selectedSensor,
    selectedPeriod,
    setSelectedSensor,
    setSelectedPeriod,
    fetchData,
  } = useSensorData();
  const navigate = useNavigate();
  useEffect(() => {
    fetchData();
  }, [selectedSensor, selectedPeriod]);

  const { selectedType, handleTypeSelect } = useDataType();

  const selectedData = data[selectedType];

  useEffect(() => {
    const timer = setTimeout(() => {
      handleCardClick();
    }, 2000); // Call handleCardClick after 2 seconds (2000 milliseconds)

    // Cleanup function to clear the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [selectedSensor, selectedPeriod]); // Empty dependency array ensures the effect runs only once, on mount

  const handleCardClick = () => {
    // After setting the selectedType, navigate to the analytics page
    navigate("/analytics");
  };
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

  const handleSensorSelect = (sensorId) => {
    setSelectedSensor(sensorId);
    // onSelectSensor(sensorId);
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
        <div className="d-flex flex-row justify-content-between">
          <Dropdown onSelect={(eventKey) => handleSensorSelect(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              style={{
                background: "#2068F3",
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}>
              {selectedSensor || "Near You"}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ maxHeight: "80vh", overflowY: "scroll" }}>
              {sensorData.map((sensor, index) => (
                <Dropdown.Item key={index} eventKey={sensor["Sensor ID"]}>
                  {sensor["Station Name"]}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown onSelect={(eventKey) => handlePeriodSelect(eventKey)}>
            <Dropdown.Toggle
              id="dropdown-basic"
              style={{
                background: "#2068F3",
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              }}>
              {selectedPeriod}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item eventKey="Today">Today</Dropdown.Item>
              <Dropdown.Item eventKey="LastDay">Last Day</Dropdown.Item>
              <Dropdown.Item eventKey="7Days">7 Days</Dropdown.Item>
              <Dropdown.Item eventKey="30Days">30 Days</Dropdown.Item>
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
                      {selectedType}
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
                <ChartCard
                  data={selectedData}
                  options={chartOptions}
                  title={selectedType}
                />
              ) : null}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AnalyticsScreen;
