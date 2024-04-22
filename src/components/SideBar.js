import React from "react";
import { Navbar, Nav, Image, Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom"; // Import useLocation

import { RxDashboard, RxPinLeft } from "react-icons/rx";
import { GiTruck } from "react-icons/gi";
import { IoPieChartSharp } from "react-icons/io5";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { GiCoalWagon } from "react-icons/gi";
import { BiSupport } from "react-icons/bi";
import { SiMicrosoftexcel } from "react-icons/si";
import { RiAlarmWarningFill } from "react-icons/ri";

function Sidebar() {
  // Get the current location
  const location = useLocation();

  // Define a function to determine if a link is active
  const isLinkActive = (path) => location.pathname === path;

  return (
    <Navbar
      expand="lg"
      variant="light"
      className="flex-column"
      style={{
        width: "15rem",
        // backgroundColor: "#1B2791",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      }}>
      <Navbar.Brand as={Link} to="/dashboard">
        <img
          src="logo.png"
          alt="Imat Tech Logo"
          style={{ maxHeight: "150px", maxWidth: "auto" }}
        />
      </Navbar.Brand>

      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="flex-column gap-4">
          <Nav.Link
            as={Link}
            to="/dashboard"
            style={{
              textAlign: "left",
              color: isLinkActive("/dashboard") ? "#1B2791" : "#3DA2E6",
            }}>
            <RxDashboard size={30} />{" "}
            <span style={{ marginLeft: "1rem" }}>Dashboard</span>
          </Nav.Link>{" "}
          <Nav.Link
            as={Link}
            to="/stations"
            style={{
              textAlign: "left",
              color: isLinkActive("/stations") ? "#1B2791" : "#3DA2E6",
            }}>
            <SiMicrosoftexcel size={30} />
            <span style={{ marginLeft: "1rem" }}>All Stations</span>
          </Nav.Link>{" "}
          {/* <Nav.Link
            as={Link}
            to="/reports"
            style={{
              textAlign: "left",
              color: isLinkActive("/reports") ? "#EEE" : "#3DA2E6",
            }}>
            {/* <IoPieChartSharp size={30} /> */}
          {/* <RiAlarmWarningFill size={30} />
            <span style={{ marginLeft: "1rem" }}>Hotspots</span>
          </Nav.Link> */}
          <Nav.Link
            as={Link}
            to="/analytics"
            style={{
              textAlign: "left",
              color: isLinkActive("/analytics") ? "#1B2791" : "#3DA2E6",
            }}>
            <IoPieChartSharp size={30} />
            <span style={{ marginLeft: "1rem" }}>Analytics </span>
          </Nav.Link>{" "}
        </Nav>
      </Navbar.Collapse>

      <div
        style={{
          textAlign: "left",
          color: "#EEE",
          paddingBottom: "2rem",
        }}>
        <RxPinLeft size={30} />
        <span style={{ color: "#fff", marginLeft: "1rem" }}>Logout</span>
      </div>
    </Navbar>
  );
}

export default Sidebar;
