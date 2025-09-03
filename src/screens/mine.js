import React, { useState } from "react";
import { Form, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import axios from "axios";
import Sidebar from "../components/SideBar";
import { useAuth } from '../contextProviders/AuthContext';

// get API base from env
const API_BASE = process.env.REACT_APP_API_BASE;

const MineLogin = () => {
  const [email, setEmail] = useState("");   
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const payload = { email, password };

      const { data } = await axios.post(`${API_BASE}/api/user/login`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const { token, user } = data;

      // persist
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      login(token, user);
      navigate("/mineDashboard");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid credentials.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
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
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label className="fw-semibold">Email</Form.Label>
              <div className="d-flex align-items-center">
                <span className="px-2 text-muted">
                  <FaUser />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-3"
                  autoComplete="email"
                  disabled={loading}
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
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 rounded-3 fw-semibold"
              style={{ padding: "10px" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );   
};

export default MineLogin;