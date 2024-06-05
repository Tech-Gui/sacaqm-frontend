import React, { useContext, useEffect, useRef, useState } from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Sidebar from "../components/SideBar";
import TopNavBar from "../components/topNavBar";
import { Card, Container, Image, Spinner } from "react-bootstrap";
import StatsCard from "../components/statsCard";
import IconBadge from "../components/iconBadge";
import { GiDustCloud } from "react-icons/gi";
import { MdOutlineAir } from "react-icons/md";
import ChartCard from "../components/chartCard.js";
import { FaTemperatureThreeQuarters } from "react-icons/fa6";
import { WiHumidity } from "react-icons/wi";
import AppMap from "../map/index.js";
import { Dropdown } from "react-bootstrap";

import { useSensorData } from "../contextProviders/sensorDataContext.js";
import { DataContext } from "../contextProviders/DataContext.js";
import { StationContext } from "../contextProviders/StationContext.js";
import { useDataType } from "../contextProviders/dataTypeContext.js";

function Dashboard() {
  const {
    selectedSensor,
    selectedPeriod,
    setSelectedSensor,
    setSelectedPeriod,
  } = useSensorData();

  const { nodeData, setNodeData, fetchNodeData } = useContext(DataContext);
  const { stations, loading, error, fetchStations } =
    useContext(StationContext);
  const { selectedType, handleTypeSelect } = useDataType();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        display: false,
      },
      y: {
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
    maintainAspectRatio: true,
  };

  const dates = filteredData.map((data) => {
    const timestamp = new Date(data.timestamp);
    // Adding 2 hours to convert to SA time
    timestamp.setHours(timestamp.getHours());
    return timestamp;
  });

  const TemperatureChartData = {
    labels: dates,
    datasets: [
      {
        label: "Temperature",
        data: filteredData.map((data) => data.temperature),
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

  // console.log(TemperatureChartData.datasets[0].data.slice(-1)[0])

  const pm2p5chartData = {
    labels: dates,
    datasets: [
      {
        label: "PM2.5",

        data: filteredData.map((data) => data.pm2p5),
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
        borderColor: "#ff3838",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ff3838",
        pointBorderWidth: 2,
      },
    ],
  };

  const pm4p0chartData = {
    labels: dates,
    datasets: [
      {
        label: "PM4.0",

        data: filteredData.map((data) => data.pm4p0),
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
        borderColor: "#ee6ff7",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ee6ff7",
        pointBorderWidth: 2,
      },
    ],
  };

  const pm10p0chartData = {
    labels: dates,
    datasets: [
      {
        label: "PM10.0",
        data: filteredData.map((data) => data.pm10p0),
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
        borderColor: "#4e1bb4",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#4e1bb4",
        pointBorderWidth: 2,
      },
    ],
  };

  const pm1p0chartData = {
    labels: dates,
    datasets: [
      {
        label: "PM1.0",
        data: filteredData.map((data) => data.pm1p0),
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
        borderColor: "#a8ff96",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#a8ff96",
        pointBorderWidth: 2,
      },
    ],
  };

  const HumiditychartData = {
    labels: dates,
    datasets: [
      {
        label: "Humidity",
        data: filteredData.map((data) => data.humidity),
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
        borderColor: "#ee6ff7",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ee6ff7",
        pointBorderWidth: 2,
      },
    ],
  };

  const VocchartData = {
    labels: dates,
    datasets: [
      {
        label: "Voc",
        data: filteredData.map((data) => data.voc),
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
        borderColor: "#ee6ff7",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ee6ff7",
        pointBorderWidth: 2,
      },
    ],
  };

  const NoxChartData = {
    labels: dates,
    datasets: [
      {
        label: "Nox",
        data: filteredData.map((data) => data.nox),
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
        borderColor: "#ee6ff7",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ee6ff7",
        pointBorderWidth: 2,
      },
    ],
  };

  var noxValue = NoxChartData.datasets[0].data.slice(-1)[0];
  var tempDisplay = TemperatureChartData.datasets[0].data.slice(-1)[0];
  var vocValue = VocchartData.datasets[0].data.slice(-1)[0];
  var pm1Value = pm1p0chartData.datasets[0].data.slice(-1)[0];
  var pm2p05Value = pm2p5chartData.datasets[0].data.slice(-1)[0];

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
  };

  const handleStationSelect = (stationId) => {
    setFilteredData([]);
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
    filterData();
  }, [startDate, endDate, selectedPeriod]);

  useEffect(() => {
    setFilteredData(nodeData);
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
        className="p-4"
        style={{
          maxHeight: "100vh",
          overflowY: "scroll",
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
              {getStationNameByStationId(selectedSensor) || "Meadowlands West"}
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

        <Row>
          <Col lg={7} md={12}>
            {" "}
            {/*this is the map card*/}
            <Card
              className="mt-1 p-2 mapcard"
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                width: "100%",
              }}>
              <Row className="d-flex justify-content-center">
                <h6
                  style={{
                    color: "#666",
                    fontWeight: "bold",
                    fontSize: "10px",
                    fontFamily: "Helvetica Neue",
                    textAlign: "left",
                    paddingLeft: "1.5rem",
                  }}>
                  NEAR YOU
                </h6>

                <Row
                  className="d-flex justify-content-between"
                  style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}>
                  <Col className="mb-1">
                    {" "}
                    <div style={{ cursor: "pointer" }}>
                      <StatsCard
                        title="NOX"
                        value={
                          filteredData && filteredData.length > 0
                            ? noxValue
                            : "...."
                        }
                        wrappedComponent={
                          <IconBadge
                            icon={<MdOutlineAir />}
                            backgroundColor="rgba(255, 216, 0, 0.3)"
                            color="#990033"
                            iconSize={16}
                          />
                        }
                      />
                    </div>
                  </Col>

                  <Col className="mb-1">
                    {" "}
                    <StatsCard
                      title="VOC"
                      value={
                        filteredData && filteredData.length > 0
                          ? vocValue
                          : "...."
                      }
                      wrappedComponent={
                        <IconBadge
                          icon={<GiDustCloud />}
                          backgroundColor="rgba(0, 0, 255, 0.3)"
                          color="#00f"
                          iconSize={15}
                        />
                      }
                    />
                  </Col>

                  <Col>
                    {" "}
                    <StatsCard
                      title="PM 1.0"
                      value={
                        filteredData && filteredData.length > 0
                          ? pm1Value
                          : "...."
                      }
                      wrappedComponent={
                        <IconBadge
                          icon={<WiHumidity />}
                          backgroundColor="rgba(0, 255, 0, 0.3)"
                          color="#08A045"
                          iconSize={19}
                        />
                      }
                    />
                  </Col>
                  <Col>
                    {" "}
                    <StatsCard
                      title="PM 2.5"
                      value={
                        filteredData && filteredData.length > 0
                          ? pm2p05Value
                          : "...."
                      }
                      wrappedComponent={
                        <IconBadge
                          icon={<FaTemperatureThreeQuarters />}
                          backgroundColor="rgba(255, 87, 51, 0.5)"
                          color="#F00"
                          iconSize={15}
                        />
                      }
                    />
                  </Col>
                </Row>

                <div
                  style={{
                    width: "100%",
                    padding: "1.5rem",
                    paddingTop: "0,2rem",
                  }}>
                  <Row className="d-flex justify-content-center">
                    <Col className="col-height">
                      <AppMap selSensor={selectedSensor} />
                    </Col>
                  </Row>
                </div>
              </Row>
            </Card>
          </Col>

          <Col lg={5} md={12} sm={6} className="m-0">
            <Row>
              <Col md={6} lg={12}>
                <Card
                  className="mt-1 "
                  style={{
                    border: "none",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    minHeight: "26vh",
                  }}>
                  <h6
                    style={{
                      color: "#666",
                      fontWeight: "bold",
                      fontSize: "10px",
                      fontFamily: "Helvetica Neue",
                      textAlign: "left",
                    }}></h6>
                  {filteredData && filteredData.length > 0 ? (
                    <ChartCard
                      data={pm4p0chartData}
                      options={chartOptions}
                      title="PM4.0 (μg/m³)"
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}>
                      <Spinner animation="border" role="status"></Spinner>
                    </div>
                  )}
                </Card>
              </Col>

              <Col md={6} lg={12}>
                <Card
                  className="mt-2 "
                  style={{
                    border: "none",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    paddingBottom: "0.2rem",
                    minHeight: "26vh",
                  }}>
                  {filteredData && filteredData.length > 0 ? (
                    <ChartCard
                      data={pm10p0chartData}
                      options={chartOptions}
                      title="PM10.0 (μg/m³)"
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}>
                      <Spinner animation="border" role="status"></Spinner>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card
              className="mt-2 "
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                paddingBottom: "0.2rem",
                minHeight: "25vh",
              }}>
              {filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={pm1p0chartData}
                  options={chartOptions}
                  title="PM1.0 (μg/m³)"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                  }}>
                  <Spinner animation="border" role="status"></Spinner>
                </div>
              )}
            </Card>
          </Col>
          <Col md={6}>
            <Card
              className="mt-2 "
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                paddingBottom: "0.2rem",
                minHeight: "25vh",
              }}>
              {filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={pm2p5chartData}
                  options={chartOptions}
                  title="PM2.5 (μg/m³)"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                  }}>
                  <Spinner animation="border" role="status"></Spinner>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card
              className="mt-2 "
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                paddingBottom: "0.2rem",
              }}>
              {filteredData ? (
                <ChartCard
                  data={TemperatureChartData}
                  options={chartOptions}
                  title="Temperature (°C)"
                />
              ) : null}
            </Card>
          </Col>
          <Col md={6}>
            <Card
              className="mt-2 "
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                paddingBottom: "0.2rem",
              }}>
              {filteredData ? (
                <ChartCard
                  data={HumiditychartData}
                  options={chartOptions}
                  title="Humidity (%)"
                />
              ) : null}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Dashboard;
