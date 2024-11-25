import React from "react";

function IconBadge({ icon, backgroundColor, iconSize, color }) {
  const badgeStyle = {
    width: "1.5rem",
    height: "1.5rem",
    backgroundColor: backgroundColor || "#007bff", // Default to #007bff if no background color is provided
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "5px",
    color: color || "#fff",
  };

  return (
    <div style={badgeStyle}>
      {React.cloneElement(icon, { size: iconSize || 15 })}{" "}
      {/* Clone the provided icon with a custom size */}
    </div>
  );
}

export default IconBadge;
