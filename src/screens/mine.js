import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa"; // icons
import Sidebar from "../components/SideBar";

const MineLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    // Fake auth (replace with API later)
    if (username === "admin" && password === "password") {
      setError("");
      navigate("/mineDashboard");
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #4e73df, #1cc88a)",
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={5}>
            <Card className="p-4 shadow-lg border-0 rounded-4 text-center">
              {/* Logo Section */}
              <div className="mb-3">
                <img
                  src="/logo.png"
                  alt="App Logo"
                  style={{ width: "80px", height: "80px", objectFit: "contain" }}
                />
              </div>

              <h2 className="mb-4 text-primary fw-bold">Mine Login</h2>

              {error && (
                <div className="alert alert-danger py-2 text-center rounded-3">
                  {error}
                </div>
              )}

              <Form onSubmit={handleSubmit} className="text-start">
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label className="fw-semibold">Username</Form.Label>
                  <div className="d-flex align-items-center">
                    <span className="px-2 text-muted">
                      <FaUser />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="rounded-3"
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-4" controlId="formPassword">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <div className="d-flex align-items-center">
                    <span className="px-2 text-muted">
                      <FaLock />
                    </span>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-3"
                    />
                  </div>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 rounded-3 fw-semibold"
                  style={{ padding: "10px" }}
                >
                  Login
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MineLogin;
