import React, { useContext, useState } from "react";
import axios from "axios";
import Sidebar from "../components/SideBar";
import TopNavBar from "../components/topNavBar";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Table,
} from "react-bootstrap";
import { AiOutlinePlus } from "react-icons/ai";
import StationsTable from "../components/StationsTable";

import { StationContext } from "../contextProviders/StationContext";

const Stations = () => {
  const { stations, loading, error, fetchStations } =
    useContext(StationContext);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    province: "",
    city: "",
    longitude: "",
    latitude: "",
    sensorIds: [""], // Start with one empty string
  });

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSensorIdChange = (index, event) => {
    const { value } = event.target;
    const updatedSensorIds = [...formData.sensorIds];
    updatedSensorIds[index] = value;
    setFormData({ ...formData, sensorIds: updatedSensorIds });
  };

  const addSensorId = () => {
    setFormData({ ...formData, sensorIds: [...formData.sensorIds, ""] });
  };

  const removeSensorId = (index) => {
    const updatedSensorIds = formData.sensorIds.filter((_, i) => i !== index);
    setFormData({ ...formData, sensorIds: updatedSensorIds });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        "https://try-again-test-isaiah.app.cern.ch/api/stations",
        formData
      );
      handleCloseModal();
    } catch (error) {
      console.error("Error adding station:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading stations: {error.message}</div>;

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
          <Button variant="primary" onClick={handleShowModal}>
            <AiOutlinePlus /> Add Station
          </Button>
        </div>

        <Col md={12}>
          <Card className="p-2" style={{ border: "none", height: "85vh" }}>
            <Card.Body>
              <StationsTable data={stations} />
            </Card.Body>
          </Card>
        </Col>
      </Container>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add Station</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formProvince">
              <Form.Label>Province</Form.Label>
              <Form.Control
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formCity">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formLongitude">
              <Form.Label>Longitude</Form.Label>
              <Form.Control
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formLatitude">
              <Form.Label>Latitude</Form.Label>
              <Form.Control
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
              />
            </Form.Group>

            {formData.sensorIds.map((sensorId, index) => (
              <Form.Group controlId={`formSensorID${index}`} key={index}>
                <Form.Label>Sensor ID {index + 1}</Form.Label>
                <Form.Control
                  type="text"
                  name={`sensorID${index}`}
                  value={sensorId}
                  onChange={(event) => handleSensorIdChange(index, event)}
                />
                {formData.sensorIds.length > 1 && (
                  <Button
                    variant="danger"
                    onClick={() => removeSensorId(index)}
                    className="mt-2">
                    Remove
                  </Button>
                )}
              </Form.Group>
            ))}
            <Button variant="primary" onClick={addSensorId} className="mt-2">
              Add Sensor ID
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Stations;
