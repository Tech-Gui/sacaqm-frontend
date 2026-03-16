import React, { useContext, useEffect, useRef, useState } from "react";
import Row from "react-bootstrap/Row";
import { useNavigate } from "react-router-dom";
import Col from "react-bootstrap/Col";
import Sidebar from "../components/SideBar.js";
import TopNavBar from "../components/topNavBar.js";
import {
  Button,
  Card,
  Container,
  Image,
  Modal,
  Spinner,
} from "react-bootstrap";
import StatsCard from "../components/statsCard.js";
import IconBadge from "../components/iconBadge.js";
import { GiDustCloud } from "react-icons/gi";
import { MdOutlineAir } from "react-icons/md";
import ChartCard from "../components/chartCard.js";
import { FaTemperatureThreeQuarters } from "react-icons/fa6";
import { WiHumidity } from "react-icons/wi";
import AppMap from "../map/AppMap.js";
import { Dropdown } from "react-bootstrap";
import { FaSignOutAlt } from "react-icons/fa";
import { useSensorData } from "../contextProviders/sensorDataContext.js";
import { DataContext } from "../contextProviders/DataContext.js";
import { StationContext } from "../contextProviders/StationContext.js";
import { useDataType } from "../contextProviders/dataTypeContext.js";
import axios from "axios";
import { point } from "leaflet";
import { useAuth } from '../contextProviders/AuthContext.js';


const API_BASE = process.env.REACT_APP_API_BASE;



function MineDashboard() {
  const navigate = useNavigate();
  const {
    selectedSensor,
    selectedPeriod,
    setSelectedSensor,
    setSelectedPeriod,
  } = useSensorData();

  const { nodeData, setNodeData, fetchNodeData } = useContext(DataContext);
  const { selectedType, handleTypeSelect } = useDataType();
  const { stations, setStations, loading, setLoading, error, setError,fetchStations } =
      useContext(StationContext)
  const [sensorNameMap, setSensorNameMap] = useState({});

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [myStations, setMyStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState(null);
  const [offlineMessage, setOfflineMessage] = useState(null); 
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [isCustomRange, setIsCustomRange] = useState(false);




  const { logout, user } = useAuth();
  const handleLogout = () => {
    // Remove axios authorization header
    delete axios.defaults.headers.common["Authorization"];
    
    // Call logout from context
    logout();
    
    // Navigate to login page
    navigate("/login");
  };

  useEffect(() => {
    //setSelectedSensor("68aeec026bb2d3b1a11f79e4");
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good Morning");
    } else if (currentHour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  const fetchMyStations = async () => {
    try {
      setStationsLoading(true);
      setStationsError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found. Please log in again.");

      const { data } = await axios.get(
        `${API_BASE}/api/users_sensors/me/stations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      setMyStations(list);

      if (list.length > 0) {
        const firstStationId = String(list[0]._id);
        setSelectedSensor(firstStationId);
        setSelectedPeriod("Today");
        fetchNodeData(firstStationId, 1);
      }
    } catch (e) {
      setStationsError(e?.response?.data?.message || e.message || "Failed to load your stations");
      setMyStations([]);
    } finally {
      setStationsLoading(false);
    }
  };
  const fetchMySensorsAndNames = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found. Please log in again.");

      const [meResp, stationsResp] = await Promise.all([
        axios.get(`${API_BASE}/api/users_sensors/me/sensors`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/api/stations`, {
          headers: { Authorization: `Bearer ${token}` }, // fine if public too
        }),
      ]);

      const mySensorIds = new Set((meResp?.data?.sensorIds || []).map(String));
      const allStations = Array.isArray(stationsResp?.data) ? stationsResp.data : [];

      // Build station list the user actually owns (by intersecting sensorIds)
      const mineStations = [];
      const seenStationIds = new Set();

      for (const st of allStations) {
        const sidList = Array.isArray(st?.sensorIds) ? st.sensorIds.map(String) : [];
        const hasMine = sidList.some((sid) => mySensorIds.has(sid));
        if (hasMine && st?._id && !seenStationIds.has(String(st._id))) {
          seenStationIds.add(String(st._id));
          mineStations.push({
            _id: String(st._id),           // << stationId (IMPORTANT)
            name: st?.name || "Unnamed Station",
            sensorIds: sidList,            // keep for display if you want
          });
        }
      }

      // Sort by station name and store for the dropdown
      mineStations.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setStations(mineStations);

      // Auto-select first stationId and fetch data
      if (mineStations.length > 0) {
        const firstStationId = mineStations[0]._id;  // << stationId
        setSelectedSensor(firstStationId);           // note: this now holds a stationId
        setSelectedPeriod("Today");
        fetchNodeData(firstStationId, 1);            // << stationId goes here
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load sensors");
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setMyStations([]);
      return;
    }
    fetchMyStations();
  }, [user]);

  // const handleLogout = () => {
  //   navigate("/login");
  // };
  
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

   const dbaChartData = {
    labels: dates,
    datasets: [
      {
        label: "Decibel (dB)",
        data : filteredData.map((data) => data.dba),
        fill: true, 
        spanGaps: true,
        backgroundColor: function (context){
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0,0,0,200);
        gradient.addColorStop(0, "rgba(180, 75, 250, 1)");
        gradient.addColorStop(0.25, "rgba(180, 75, 250, 0.75)");
        gradient.addColorStop(0.5, "rgba(180, 75, 250, 0.5)");
        gradient.addColorStop(0.75, "rgba(180, 75, 250, 0.25)");
        gradient.addColorStop(1, "rgba(180, 75, 250, 0.0)");
        return gradient;
        },
        borderColor: "#b44bfa",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        pointBorderColor: "#b44bfa",
        pointBorderWidth: 2,
      },
    ],
   };

  var noxValue = NoxChartData.datasets[0].data.slice(-1)[0];
  var tempDisplay = TemperatureChartData.datasets[0].data.slice(-1)[0];
  var vocValue = VocchartData.datasets[0].data.slice(-1)[0];
  var pm1Value = pm1p0chartData.datasets[0].data.slice(-1)[0];
  var pm2p05Value = pm2p5chartData.datasets[0].data.slice(-1)[0];
  var dbaValue = dbaChartData.datasets[0].data.slice(-1)[0];
  // var co2Value = co2ChartData.datasets[0].data.slice(-1)[0]; 

  const handlePeriodSelect = (period) => {
    const station = stations.find((s) => s._id === selectedSensor);

    if (!station) return;

    const now = new Date();
    const lastSeen = new Date(station.lastSeen);

    const diffHours = (now - lastSeen) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    // LAST DAY (needs data in last 48h in your logic)
    if (period === "Last Day" && diffHours > 48) {
      setOfflineMessage("No data available for the last day.");
      return;
    }

    // user selected TODAY but sensor hasn't sent data for > 24h
    if (period === "Today" && diffHours > 24) {
      setOfflineMessage("No data available for Today. Sensor is offline.");
      return;
    }

    // user selected 7 DAYS but sensor hasn't sent data for > 7 days
    if (period === "7 Days" && diffDays > 7) {
      setOfflineMessage("No data available for the last 7 days.");
      return;
    }

    // user selected 30 DAYS but sensor hasn't sent data for > 30 days
    if (period === "30 Days" && diffDays > 30) {
      setOfflineMessage("No data available for the last 30 days.");
      return;
    }

    setOfflineMessage(null);
    setSelectedPeriod(period);
  };

  /*const handleStationSelect = (stationId) => {
    setSelectedPeriod("Today");
    setFilteredData([]);
    setSelectedSensor(stationId);

    const station = myStations.find((station) => station["_id"] === stationId);

    if (station) {
      fetchNodeData(station._id, 1);
    } else {
      console.log("station not found");
    }

    // setSensorName(station);
  };*/

  const handleStationSelect = (stationId) => {
    setSelectedSensor(stationId);
    setFilteredData([]);
    setOfflineMessage(null);

    const station = stations.find((s) => s._id === stationId);

    if (!station) {
      console.log("station not found");
      return;
    }

    const now = new Date();
    const lastSeen = new Date(station.lastSeen);

    const diffHours = (now - lastSeen) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    // last 24 hours
    if (diffHours <= 24) {
      setSelectedPeriod("Today");
      fetchNodeData(station._id, 1);
    }

    // between 24h and 7 days
    else if (diffDays <= 7) {
      setSelectedPeriod("7 Days");
      fetchNodeData(station._id, 7);
    }

    // between 7 and 30 days
    else if (diffDays <= 30) {
      setSelectedPeriod("30 Days");
      fetchNodeData(station._id, 30);
    }

    // more than 30 days
    else {
      setFilteredData([]);
      setOfflineMessage("Sensor offline for more than 30 days.");
    }
  };

  const getLastSeenText = () => {
    const station = stations.find((s) => s._id === selectedSensor);

    if (!station) return null;

    const now = new Date();
    const lastSeen = new Date(station.lastSeen);

    const diffHours = (now - lastSeen) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours <= 24) return null;

    if (diffDays < 1) {
      return `Sensor offline — last seen ${Math.floor(diffHours)} hours ago`;
    }

    return `Sensor offline — last seen ${Math.floor(diffDays)} days ago`;
  };


  const handle30DaysSelect = () => {
    setSelectedPeriod("30 Days");
    setFilteredData([]);

    const station = myStations.find(
      (station) => station["_id"] === selectedSensor
    );
    console.log("Ndashaiwa ini 1");
    console.log(station);
    console.log("Ndashaiwa ini 2");

    console.log(selectedSensor);

    if (station) {
      fetchNodeData(station._id, 30);
    } else {
      console.log("Ndashaiwa ini");
      console.log("station not found");
    }

    // setSensorName(station);
  };

  const handle7DaysSelect = () => {
    setSelectedPeriod("7 Days");
    setFilteredData([]);

    const station = myStations.find(
      (station) => station["_id"] === selectedSensor
    );
    console.log("Ndashaiwa ini 1");
    console.log(station);
    console.log("Ndashaiwa ini 2");

    console.log(selectedSensor);

    if (station) {
      fetchNodeData(station._id, 7);
    } else {
      console.log("Ndashaiwa ini");
      console.log("station not found");
    }

    // setSensorName(station);
  };

  const handleLastDaysSelect = () => {
    setSelectedPeriod("Last Day");
    setFilteredData([]);

    const station = myStations.find(
      (station) => station["_id"] === selectedSensor
    );
    console.log("Ndashaiwa ini 1");
    console.log(station);
    console.log("Ndashaiwa ini 2");

    console.log(selectedSensor);

    const now = new Date();
    let start = new Date();

    if (station) {
      fetchNodeData(station._id, 2);
      start.setDate(now.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      let filtered = nodeData;

      console.log(filtered);

      filtered = filtered.filter((item) => {
        const timestamp = new Date(item.timestamp);
        return (
          timestamp.getTime() >= start.getTime() &&
          timestamp.getTime() <= now.getTime()
        );
      });

      console.log(filtered);
      setFilteredData(filtered);
    } else {
      console.log("Ndashaiwa ini");
      console.log("station not found");
    }

    // setSensorName(station);
  };

  const getStationNameByStationId = (sensorId) => {
    // Loop through each station data object
    for (const station of myStations) {
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
        case "Today":
          start.setHours(0, 0, 0, 0);
          break;
        case "Last Day":
          // start.setDate(now.getDate() - 1);
          // start.setHours(0, 0, 0, 0);

          handleLastDaysSelect();
          break;
        case "7 Days":
          // start.setDate(now.getDate() - 7);
          handle7DaysSelect();
          break;
        case "30 Days":
          handle30DaysSelect();
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

        <div className="d-flex flex-row justify-content-between align-items-center">
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
              }}>
              {getStationNameByStationId(selectedSensor) || "Select Sensor"}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ maxHeight: "80vh", overflowY: "scroll" }}>
              {stations.map((station, index) => (
                <Dropdown.Item key={index} eventKey={station["_id"]}>
                  {station["name"]}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          {getLastSeenText() && (
            <span
              style={{
                marginLeft: "10px",
                color: "#ff6b6b",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {getLastSeenText()}
            </span>
          )}
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
        <Button
          onClick={handleLogout}
          style={{
            marginLeft: "10px",
            background: "#ff4d4f",
            border: "none",
            borderRadius: "20px",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          <FaSignOutAlt />
          Logout
        </Button>
        </div>
        <Row>
          <Col lg={12} md={12}>
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
                  LATEST READINGS
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
                        // wrappedComponent={
                        //   <IconBadge
                        //     icon={<MdOutlineAir />}
                        //     backgroundColor="rgba(255, 216, 0, 0.3)"
                        //     color="#990033"
                        //     iconSize={16}
                        //   />
                        // }
                        wrappedComponent={<> index</>}
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
                      // wrappedComponent={
                      //   <IconBadge
                      //     icon={<GiDustCloud />}
                      //     backgroundColor="rgba(0, 0, 255, 0.3)"
                      //     color="#00f"
                      //     iconSize={15}
                      //   />
                      // }

                      wrappedComponent={<> index</>}
                    />
                  </Col>

                  <Col>
                    {" "}
                    <StatsCard
                      title="PM 1.0"
                      value={
                        filteredData && filteredData.length > 0
                          ? `${pm1Value} `
                          : "...."
                      }
                      wrappedComponent={<> μg/m³</>}
                    />
                  </Col>
                  <Col>
                    {" "}
                    <StatsCard
                      title="PM 2.5"
                      value={
                        filteredData && filteredData.length > 0
                          ? `${pm2p05Value}`
                          : "...."
                      }
                      wrappedComponent={<> μg/m³</>}
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
              {offlineMessage ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                    color: "#999",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {offlineMessage}
                </div>
              ) : filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={pm1p0chartData}
                  options={chartOptions}
                  title="PM1.0 (μg/m³)"
                />
              ) : (
                <Spinner animation="border" role="status" />
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
              {offlineMessage ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                    color: "#999",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {offlineMessage}
                </div>
              ) : filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={pm2p5chartData}
                  options={chartOptions}
                  title="PM2.5 (μg/m³)"
                />
              ) : (
                <Spinner animation="border" role="status" />
              )}
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6} lg={6}>
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
              {offlineMessage ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                    color: "#999",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {offlineMessage}
                </div>
              ) : filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={pm4p0chartData}
                  options={chartOptions}
                  title="PM4.0 (μg/m³)"
                />
              ) : (
                <Spinner animation="border" role="status" />
              )}
            </Card>
          </Col>

          <Col md={6} lg={6}>
            <Card
              className="mt-2 "
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                paddingBottom: "0.2rem",
                minHeight: "26vh",
              }}>
              {offlineMessage ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                    color: "#999",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {offlineMessage}
                </div>
              ) : filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={pm10p0chartData}
                  options={chartOptions}
                  title="PM10.0 (μg/m³)"
                />
              ) : (
                <Spinner animation="border" role="status" />
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
              {offlineMessage ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  height: "25vh",
                                  color: "#999",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                }}
                              >
                                {offlineMessage}
                              </div>
                            ) : filteredData && filteredData.length > 0 ? (
                              <ChartCard
                                data={TemperatureChartData}
                                options={chartOptions}
                                title="Temperature (°C)"
                              />
                            ) : (
                              <Spinner animation="border" role="status" />
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
              }}>
              {offlineMessage ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  height: "25vh",
                                  color: "#999",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                }}
                              >
                                {offlineMessage}
                              </div>
                            ) : filteredData && filteredData.length > 0 ? (
                              <ChartCard
                                data={HumiditychartData}
                                options={chartOptions}
                                title="Humidity (%)"
                              />
                            ) : (
                              <Spinner animation="border" role="status" />
              )}
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card
              className="mt-2"
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                paddingBottom: "0.2rem",
                minHeight: "25vh",
              }}
            >
              {offlineMessage ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                    color: "#999",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {offlineMessage}
                </div>
              ) : filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={VocchartData}
                  options={chartOptions}
                  title="voc (ppb)"
                />
              ) : (
                <Spinner animation="border" role="status" />
              )}
            </Card>
        </Col>
  <Col md={6}>
    <Card
      className="mt-2"
      style={{
        border: "none",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        paddingBottom: "0.2rem",
        minHeight: "25vh",
      }}
    >
      {offlineMessage ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "25vh",
            color: "#999",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {offlineMessage}
        </div>
      ) : filteredData && filteredData.length > 0 ? (
        <ChartCard
          data={dbaChartData}
          options={chartOptions}
          title="Decibel (dB)"
        />
      ) : (
        <Spinner animation="border" role="status" />
      )}
    </Card>
  </Col>
  </Row>
      <Row>
          <Col md={6}>
            <Card
              className="mt-2"
              style={{
                border: "none",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                paddingBottom: "0.2rem",
                minHeight: "25vh",
              }}
            >
              {offlineMessage ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "25vh",
                    color: "#999",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {offlineMessage}
                </div>
              ) : filteredData && filteredData.length > 0 ? (
                <ChartCard
                  data={NoxChartData}
                  options={chartOptions}
                  title="nox (ppb)"
                />
              ) : (
                <Spinner animation="border" role="status" />
              )}
            </Card>
        </Col>
  </Row>
      </Container>

    </div>
  );
}

export default MineDashboard;
