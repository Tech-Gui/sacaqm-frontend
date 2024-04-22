import React, { useState, useEffect } from "react";
import axios from "axios";
import StationsTable from "../components/OrderTable";
import Sidebar from "../components/SideBar";
import TopNavBar from "../components/topNavBar";
import { Button, Card, Col, Container, Form, Modal } from "react-bootstrap";
import { AiOutlinePlus } from "react-icons/ai";
import DailyLoadingReport from "../components/DailyLoadingReport";
import { DLRdata } from "../dummyData/DLRDummy";

const Stations = () => {
  return (
    <div
      className="d-flex flex-row"
      style={{ minHeight: "100vh", maxHeight: "100vh", background: "#f2f2f2" }}>
      <Sidebar />
      
      <Container fluid className="p-4">
      <TopNavBar />
        <div className="mb-4 d-flex flex-row justify-content-between">
          <h4
            style={{ fontSize: "23px", fontWeight: "500", textAlign: "left" }}>
            Stations
          </h4>
        </div>

        <Col md={12}>
          <Card className="p-2" style={{ border: "none", height: "85vh" }}>
            <Card.Body>
              <DailyLoadingReport data={DLRdata} />
            </Card.Body>
          </Card>
        </Col>
      </Container>
    </div>
  );
};

export default Stations;
