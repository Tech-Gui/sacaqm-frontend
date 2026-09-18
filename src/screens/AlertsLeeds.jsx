import React, { useEffect, useState, useCallback } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import AppMap from "../map/AppMap";

// Separate from REACT_APP_API_BASE — midranges is a different service
// entirely from whatever REACT_APP_API_BASE points at (login/private-summary).
const MIDRANGES_BASE = (process.env.REACT_APP_MIDRANGES_API_BASE || "").replace(/\/+$/, "");
const LEEDS_READ_KEY = process.env.REACT_APP_LEEDS_READ_KEY;
const LEEDS_AUTH_HEADERS = { Authorization: `Bearer ${LEEDS_READ_KEY}` };

const LEEDS_LAT = 53.83175;
const LEEDS_LNG = -1.784284;

// Blue/white brand colours for this page's chrome (title, borders, table
// header, buttons, cards). Online/offline and alert-sent status keep their
// green/red semantics regardless — those need to stay visually distinct
// to be scannable at a glance.
const BRAND_BLUE = "#0d5ca8";
const BRAND_BLUE_LIGHT = "#eaf3fb";

function formatDuration(hours) {
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  let remHours = Math.round(hours - days * 24);
  let finalDays = days;
  if (remHours === 24) {
    finalDays += 1;
    remHours = 0;
  }
  return `${finalDays}d ${remHours}h`;
}

function StatChip({ label, value, tone }) {
  const toneColors = {
    ok: { bg: "#e8f7ee", fg: "#0f8a3f" },
    warn: { bg: "#fdeceb", fg: "#c0392b" },
    neutral: { bg: BRAND_BLUE_LIGHT, fg: BRAND_BLUE },
  };
  const c = toneColors[tone] || toneColors.neutral;
  return (
    <div
      style={{
        background: c.bg,
        borderRadius: 12,
        padding: "14px 18px",
        textAlign: "center",
        flex: 1,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color: c.fg, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginTop: 6, letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

export default function AlertsLeeds() {
  const [history, setHistory] = useState([]);
  const [currentOffline, setCurrentOffline] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [historyRes, statusRes] = await Promise.all([
        fetch(`${MIDRANGES_BASE}/api/leeds-alert-history`, { headers: LEEDS_AUTH_HEADERS }),
        fetch(`${MIDRANGES_BASE}/api/leeds-current-status`, { headers: LEEDS_AUTH_HEADERS }),
      ]);
      if (!historyRes.ok || !statusRes.ok) throw new Error("Request failed");

      const historyData = await historyRes.json();
      const statusData = await statusRes.json();

      setHistory(historyData.history);
      setCurrentOffline(statusData.offline);
      setTotalCount(statusData.totalCount);
      setError(null);
    } catch (e) {
      setError("Couldn't load alert data. Retrying shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const offlineCount = currentOffline.length;
  const onlineCount = totalCount != null ? totalCount - offlineCount : null;

  return (
    <Container className="py-4" style={{ backgroundColor: "#ffffff" }}>
      <div className="d-flex align-items-center gap-2 mb-1">
        <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
        <h2 className="mb-0" style={{ color: BRAND_BLUE, fontWeight: 700 }}>
          Leeds : Sensor Alerts
        </h2>
      </div>
      <p className="text-muted mb-4">
        SYNERGIA sensors at Leeds. Alerts fire once 2+ sensors have been offline for 3+ hours.
      </p>

      {error && <Alert variant="warning">{error}</Alert>}

      {loading ? (
        <Spinner animation="border" role="status" style={{ color: BRAND_BLUE }} />
      ) : (
        <>
          <div className="d-flex flex-wrap gap-3 mb-4">
            <StatChip label="Total Sensors" value={totalCount ?? "—"} tone="neutral" />
            <StatChip label="Online" value={onlineCount ?? "—"} tone="ok" />
            <StatChip label="Offline Now" value={offlineCount} tone={offlineCount > 0 ? "warn" : "ok"} />
          </div>

          <Card
            className="mb-4"
            style={{ border: `1px solid ${BRAND_BLUE}`, borderRadius: 10, overflow: "hidden" }}
          >
            <div style={{ height: 420, width: "100%" }}>
              <AppMap
                initialLatitude={LEEDS_LAT}
                initialLongitude={LEEDS_LNG}
                initialZoom={10}
                filterStations={(s) => (s.name || "").toUpperCase().includes("SYNERGIA")}
              />
            </div>
            <Card.Body style={{ backgroundColor: BRAND_BLUE_LIGHT, padding: "0.75rem 1.1rem" }}>
              <Card.Text className="mb-0" style={{ color: BRAND_BLUE, fontSize: 13 }}>
                This map gives an easier, at-a-glance view of which sensors are online or offline.
                Clicking a sensor shows its station details here — it won't open sensor graphs.
              </Card.Text>
            </Card.Body>
          </Card>

          <Card className="mb-4" style={{ border: "1px solid #e5e0d5", borderRadius: 10 }}>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0" style={{ color: BRAND_BLUE, fontWeight: 600 }}>
                  Currently Offline
                </h5>
                <Badge bg={offlineCount > 0 ? "danger" : "success"} style={{ fontSize: 12 }}>
                  {offlineCount > 0 ? `${offlineCount} offline` : "All clear"}
                </Badge>
              </div>
              {offlineCount === 0 ? (
                <div className="text-muted" style={{ fontSize: 14 }}>
                  All Leeds sensors are currently online.
                </div>
              ) : (
                <Table striped bordered hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: BRAND_BLUE, color: "#ffffff", fontWeight: 600 }}>Sensor</th>
                      <th style={{ backgroundColor: BRAND_BLUE, color: "#ffffff", fontWeight: 600 }}>Offline Since</th>
                      <th style={{ backgroundColor: BRAND_BLUE, color: "#ffffff", fontWeight: 600 }}>Hours Offline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOffline.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.offlineSince ? new Date(s.offlineSince).toLocaleString() : "—"}</td>
                        <td>
                          <Badge bg="danger">{s.hoursOffline != null ? formatDuration(s.hoursOffline) : "—"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <h4 style={{ color: BRAND_BLUE, fontWeight: 600 }}>Alert History</h4>
          <Table
            striped
            bordered
            hover
            responsive
            style={{ backgroundColor: "#ffffff" }}
          >
            <thead>
              <tr>
                <th style={{ backgroundColor: BRAND_BLUE, color: "#ffffff", fontWeight: 600 }}>Date</th>
                <th style={{ backgroundColor: BRAND_BLUE, color: "#ffffff", fontWeight: 600 }}>Offline Count</th>
                <th style={{ backgroundColor: BRAND_BLUE, color: "#ffffff", fontWeight: 600 }}>Sensors</th>
                <th style={{ backgroundColor: BRAND_BLUE, color: "#ffffff", fontWeight: 600 }}>Alert Sent</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, i) => (
                <tr key={i}>
                  <td>{new Date(entry.triggeredAt).toLocaleString()}</td>
                  <td>{entry.offlineCount}</td>
                  <td>{entry.sensorNames.join(", ")}</td>
                  <td>
                    {entry.emailSent ? (
                      <Badge bg="success">Yes</Badge>
                    ) : (
                      <Badge bg="danger">No</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No alerts logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      )}
    </Container>
  );
}