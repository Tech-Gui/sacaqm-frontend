import React, { useState } from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

import { RxDashboard, RxPinLeft } from "react-icons/rx";
import { GiTruck } from "react-icons/gi";
import { IoPieChartSharp } from "react-icons/io5";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { GiCoalWagon } from "react-icons/gi";
import { BiSupport } from "react-icons/bi";
import { SiMicrosoftexcel } from "react-icons/si";
import { FaInfoCircle } from "react-icons/fa";
import { RiAlarmWarningFill } from "react-icons/ri";

function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isLinkActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Navbar
      expand="lg"
      variant="light"
      className="flex-column d-none d-lg-block"
      style={{
        width: "15rem",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        transition: "width 0.3s ease",
      }}>
      <Navbar.Brand as={Link} to="/dashboard" >
        <img
          src="logo.png"
          alt="Imat Tech Logo"
          style={{ maxHeight: "150px", maxWidth: "auto", marginBottom: "$)%" }}
        />
      </Navbar.Brand>

      <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={toggleSidebar} />

      <Navbar.Collapse id="basic-navbar-nav" className={!isOpen && "d-none d-lg-block"}>
        <Nav className="flex-column gap-4 " style={{padding: "2rem", textAlign: "right" }}>
          <Nav.Link
            as={Link}
            to="/dashboard"
            style={{
              textAlign: "left",
              color: isLinkActive("/dashboard") ? "#1B2791" : "#3DA2E6",
            }}>
            <RxDashboard size={30} />
            <span style={{ marginLeft: "1rem" }}>Dashboard</span>
          </Nav.Link>

          <Nav.Link
            as={Link}
            to="/stations"
            style={{
              textAlign: "left",
              color: isLinkActive("/stations") ? "#1B2791" : "#3DA2E6",
            }}>
            <SiMicrosoftexcel size={30} />
            <span style={{ marginLeft: "1rem" }}>All Stations</span>
          </Nav.Link>

          <Nav.Link
            as={Link}
            to="/analytics"
            style={{
              textAlign: "left",
              color: isLinkActive("/analytics") ? "#1B2791" : "#3DA2E6",
            }}>
            <IoPieChartSharp size={30} />
            <span style={{ marginLeft: "1rem" }}>Analytics</span>
          </Nav.Link>


          <Nav.Link
            as={Link}
            to="/information"
            style={{
              textAlign: "left",
              color: isLinkActive("/information") ? "#1B2791" : "#3DA2E6",
            }}>
            <FaInfoCircle size={30} />
            <span style={{ marginLeft: "1rem" }}>More Info</span>
          </Nav.Link>
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
