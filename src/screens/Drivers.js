import axios from "axios";
import React, { useState, useEffect } from "react";
import Table from "react-bootstrap/Table";
import Sidebar from "../components/SideBar";
import { Button, Card, Col, Container, Form, Modal } from "react-bootstrap";
import { AiOutlinePlus } from "react-icons/ai";
import { Link } from "react-router-dom";

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  useEffect(() => {
    // Fetch all drivers when the component mounts
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get("http://localhost:3000/drivers/all");
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      // Handle error or show a message to the user
    }
  };

  const initialFormData = {
    name: "",
    surname: "",
    IDNumber: "",
    passportNumber: "",
    driverNumber: "",
    truckNumber: "",
    status: "active",
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/drivers/", formData);
      // If successful, you may want to show a success message or close the modal
      setFormData(initialFormData); // Reset form fields
      fetchDrivers();
      handleClose(); // Close the modal
    } catch (error) {
      console.error("Error adding driver:", error);
      // Handle error or show a message to the user
    }
  };

  return (
    <div
      className="d-flex flex-row"
      style={{ minHeight: "100vh", maxHeight: "100vh", background: "#f2f2f2" }}>
      <Sidebar />
      <Container fluid className="p-4">
        <div className="mb-4 d-flex flex-row justify-content-between">
          <h4
            style={{ fontSize: "23px", fontWeight: "500", textAlign: "left" }}>
            Drivers
          </h4>
          <div style={{ textAlign: "right" }}>
            <button
              onClick={handleShow}
              style={{
                backgroundColor: "#1B2791",
                color: "white",
                padding: "5px 10px",
                borderRadius: "5px",
                border: "none",
              }}>
              <AiOutlinePlus /> Create Driver
            </button>
          </div>
        </div>

        <Col md={12}>
          <Card className="p-2" style={{ border: "none", height: "85vh" }}>
            <Card.Body>
              <Table hover>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th>
                      <Form.Check type="checkbox" />
                    </th>
                    <th>Name</th>
                    <th>Surname</th>
                    <th>Driver Number</th>
                    <th>Truck Number</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver, index) => (
                    <tr key={index} style={{ textAlign: "left" }}>
                      <td>
                        <Form.Check type="checkbox" />
                      </td>
                      <td>{driver.name}</td>
                      <td>{driver.surname}</td>
                      <td>{driver.driverNumber}</td>
                      <td>{driver.truckNumber}</td>
                      <td>
                        {driver.status ? (
                          <span
                            className={`status-pill ${driver.status.toLowerCase()}`}>
                            {driver.status}
                          </span>
                        ) : (
                          <span className="status-pill unknown">Unknown</span>
                        )}
                      </td>

                      <td>
                        <Link
                          to={`/`}
                          style={{
                            textDecoration: "none", // Removes underline
                            color: "inherit", // Uses the parent text color
                          }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Container>

      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Driver</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="name" className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="surname" className="mb-3">
              <Form.Label>Surname</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter surname"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="IDNumber" className="mb-3">
              <Form.Label>ID Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter ID number"
                name="IDNumber"
                value={formData.IDNumber}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="passportNumber" className="mb-3">
              <Form.Label>Passport Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter passport number"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="driverNumber" className="mb-3">
              <Form.Label>Driver Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter driver number"
                name="driverNumber"
                value={formData.driverNumber}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="truckNumber" className="mb-3">
              <Form.Label>Truck Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter truck number"
                name="truckNumber"
                value={formData.truckNumber}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="status" className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <div className="mb-3">
              <Button
                variant="primary"
                type="submit"
                style={{
                  backgroundColor: "#1B2791",
                  borderColor: "#1B2791",
                  width: "100%",
                }}>
                Add Driver
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Drivers;
