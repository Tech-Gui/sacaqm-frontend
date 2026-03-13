import React, { useRef, useEffect } from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";

export default function NoiseGaugeWidget({ value = 0, subLabel = "Daily Average" }) {
  const canvasRef = useRef(null);

  // 4-color bands: Green ≤70, Yellow 71-90, Orange 91-120, Red 121+
  const MAX_DB = 130;
  const bands = [
    { max: 70,  color: '#22c55e', label: "Safe"            },
    { max: 90,  color: '#eab308', label: "Moderate"        },
    { max: 120, color: '#f97316', label: "Very Loud"       },
    { max: MAX_DB, color: '#ef4444', label: "Dangerous"    },
  ];

  const getStatus = () => {
    for (const b of bands) { if (value <= b.max) return b; }
    return bands[bands.length - 1];
  };
  const status = getStatus();

  const statusChipColors = {
    "Safe":       { bgcolor: "#dcfce7", color: "#16a34a" },
    "Moderate":   { bgcolor: "#fef9c3", color: "#854d0e" },
    "Very Loud":  { bgcolor: "#ffedd5", color: "#c2410c" },
    "Dangerous":  { bgcolor: "#fee2e2", color: "#dc2626" },
  };
  const chipStyle = statusChipColors[status.label] || statusChipColors["Safe"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 25;
    const radius = 105;

    ctx.clearRect(0, 0, width, height);

    const startAngle = -Math.PI;
    const totalAngle = Math.PI;

    // Draw 4 color zones
    let prevAngle = startAngle;
    bands.forEach((band) => {
      const pct = band.max / MAX_DB;
      const nextAngle = startAngle + totalAngle * pct;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, prevAngle, nextAngle, false);
      ctx.lineWidth = 24;
      ctx.strokeStyle = band.color;
      ctx.stroke();
      prevAngle = nextAngle;
    });

    // Tick marks
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (totalAngle * i / 10);
      ctx.beginPath();
      ctx.moveTo(centerX + (radius - 18) * Math.cos(angle), centerY + (radius - 18) * Math.sin(angle));
      ctx.lineTo(centerX + (radius + 6) * Math.cos(angle), centerY + (radius + 6) * Math.sin(angle));
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0',   centerX - radius - 14, centerY + 6);
    ctx.fillText('65',  centerX,               centerY - radius + 18);
    ctx.fillText('130', centerX + radius + 16, centerY + 6);

    // Needle
    const safeValue = Math.min(Math.max(value, 0), MAX_DB);
    const valuePercent = safeValue / MAX_DB;
    const needleAngle = startAngle + (totalAngle * valuePercent);
    const needleLength = radius - 30;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleAngle + Math.PI / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.lineTo(1, -needleLength);
    ctx.lineTo(-1, -needleLength);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.restore();

    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 0;
    ctx.fill();

  }, [value]);

  return (
    <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)', bgcolor: 'white', p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', transform: 'translateY(-4px)' } }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', mb: 2 }}>📊 Noise Levels</Typography>
      <canvas ref={canvasRef} width={280} height={175} style={{ marginBottom: '12px' }} />
      <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', color: '#1e293b', letterSpacing: '-0.5px', lineHeight: 1, mb: 0.5 }}>
        {value}<Box component="span" sx={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 400, ml: 0.5 }}>dB</Box>
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', mb: 1 }}>
        {subLabel}
      </Typography>
      <Chip label={status.label} sx={{ bgcolor: chipStyle.bgcolor, color: chipStyle.color, fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5, minWidth: 90, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
    </Paper>
  );
}