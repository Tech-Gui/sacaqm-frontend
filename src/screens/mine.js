import React, { useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
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
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar stays on the left */}
      <Sidebar />
      {/* Login content area */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #4e73df, #1cc88a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          className="p-4 shadow-lg border-0 rounded-4 text-center"
          style={{ width: "100%", maxWidth: "400px" }}
        >
          {/* Logo Section */}
          <div className="mb-3">
            <img
              src="/logo.png"
              alt="App Logo"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "contain",
              }}
            />
          </div>

          <h2 className="mb-4 text-primary fw-bold">Mine Login</h2>

          {error && (
            <div className="alert alert-danger py-2 text-center rounded-3">
              {error}
            </div>
          )}

          <Form onSubmit={handleSubmit}>
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
      </div>
    </div>
  );
};

export default MineLogin;