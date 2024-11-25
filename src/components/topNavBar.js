import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Link, useLocation } from "react-router-dom";
import React, { useState } from "react";

import { RxDashboard, RxPinLeft } from "react-icons/rx";
import { GiTruck } from "react-icons/gi";
import { IoPieChartSharp } from "react-icons/io5";
import { FaInfoCircle } from "react-icons/fa";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { IoIosPeople } from "react-icons/io";
import { GiCoalWagon } from "react-icons/gi";
import { BiSupport } from "react-icons/bi";
import { SiMicrosoftexcel } from "react-icons/si";
import { RiAlarmWarningFill } from "react-icons/ri";


function TopNavBar() {

  return (
    <Navbar collapseOnSelect expand="md" className="bg-body-tertiary d-lg-none mb-3 mx p-1">
      <Container>
        {/* <Navbar.Brand href="#home">React-Bootstrap</Navbar.Brand> */}
        <Navbar.Brand as={Link} to="/dashboard" >
        <img
          src="logo.png"
          alt="Imat Tech Logo"
          style={{ maxHeight: "50px", maxWidth: "auto" }}
        />
      </Navbar.Brand>

        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav ">
    
          <Nav className='ml-auto' style={{textAlign: "right"}}>

          <Nav.Link
            as={Link}
            to="/dashboard"
            >
            <RxDashboard size={20} />
            <span style={{ marginLeft: "1rem" }}>Dashboard</span>
          </Nav.Link>

            <Nav.Link
            as={Link}
            to="/stations"
            >
            <SiMicrosoftexcel size={20} />
            <span style={{ marginLeft: "1rem" }}>All Stations</span>
          </Nav.Link>

          <Nav.Link
            as={Link}
            to="/analytics">
            <IoPieChartSharp size={20} />
            <span style={{ marginLeft: "1.9rem" }}>Analytics</span>
          </Nav.Link>

          <Nav.Link
            as={Link}
            to="/information">
            <FaInfoCircle size={20} />
            <span style={{ marginLeft: "1.45rem" }}>More Info</span>
          </Nav.Link>


          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopNavBar;