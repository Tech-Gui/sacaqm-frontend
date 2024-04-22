import React from "react";
import { Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDataType } from "../contextProviders/dataTypeContext";

function StatsCard({ title, value, wrappedComponent, change }) {
  const navigate = useNavigate();
  const { selectedType, handleTypeSelect } = useDataType();
  const handleCardClick = () => {
    handleTypeSelect(title);
    // After setting the selectedType, navigate to the analytics page
    navigate("/analytics");
  };
  return (
    <Card
      style={{
        width: "11rem",
        height: "4rem",
        border: "none",
        background: "#E6E8F3",
        cursor: "pointer",
      }}
      onClick={handleCardClick}>
      <Card.Body className="gap-1">
        <div
          className="d-flex flex-row justify-content-between "
          style={{ marginTop: "-0.5rem" }}>
          <p
            style={{
              color: "#666",
              fontWeight: "bold",
              fontSize: "10px",
              fontFamily: "Helvetica Neue",
            }}>
            {title}
          </p>

          {wrappedComponent}
        </div>
        <div
          className="d-flex flex-row justify-content-between"
          style={{ marginTop: "-1rem" }}>
          <p
            style={{
              color: "#000",
              fontWeight: "bold",
              fontSize: "20px",
              fontFamily: "Helvetica Neue",
            }}>
            {value}
          </p>
          {change && <p>{change}</p>}
        </div>
      </Card.Body>
    </Card>
  );
}

export default StatsCard;
