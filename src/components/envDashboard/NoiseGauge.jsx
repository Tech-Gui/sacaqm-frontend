import React, { useRef, useEffect } from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";

export default function NoiseGaugeWidget({ value = 0 }) {
  const canvasRef = useRef(null);

  // Compliance zones
  const greenMax = 55;
  const amberMax = 70;
  const redMax = 100;

  const getStatus = () => {
    if (value <= greenMax) return { label: "Compliant", bgcolor: "#dcfce7", color: "#16a34a" };
    if (value <= amberMax) return { label: "Warning", bgcolor: "#fef3c7", color: "#d97706" };
    return { label: "Non-Compliant", bgcolor: "#fee2e2", color: "#dc2626" };
  };

  const status = getStatus();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 20;
    const radius = Math.min(width, height) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gauge arc
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    // Green zone
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + (greenMax / redMax) * Math.PI, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#22c55e';
    ctx.stroke();

    // Amber zone
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle + (greenMax / redMax) * Math.PI, startAngle + (amberMax / redMax) * Math.PI, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Red zone
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle + (amberMax / redMax) * Math.PI, endAngle, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    // Draw tick marks
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * Math.PI;
      const x1 = centerX + (radius - 15) * Math.cos(angle);
      const y1 = centerY + (radius - 15) * Math.sin(angle);
      const x2 = centerX + (radius + 5) * Math.cos(angle);
      const y2 = centerY + (radius + 5) * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', centerX - radius + 10, centerY + 5);
    ctx.fillText('50', centerX - radius / 2, centerY - radius / 2 - 10);
    ctx.fillText('100', centerX + radius - 10, centerY + 5);

    // Draw needle (pointer)
    const needleAngle = startAngle + (Math.min(value, redMax) / redMax) * Math.PI;
    const needleLength = radius - 30;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleAngle);

    // Needle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    // Needle triangle
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, -needleLength);
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    ctx.restore();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    ctx.fill();

    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#cbd5e1';
    ctx.shadowBlur = 0;
    ctx.fill();

  }, [value]);

  return (
    <Paper 
      sx={{ 
        borderRadius: 3, 
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        bgcolor: 'white',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 240,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-4px)',
        }
      }}
    >
      {/* Title */}
      <Typography 
        sx={{ 
          fontWeight: 600, 
          fontSize: '0.75rem',
          color: '#64748b',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <Box component="span" sx={{ fontSize: '1rem' }}>📊</Box>
        Noise Levels
      </Typography>

      {/* Canvas Gauge */}
      <canvas 
        ref={canvasRef} 
        width={220} 
        height={140}
        style={{ marginBottom: '8px' }}
      />

      {/* Value */}
      <Typography 
        sx={{ 
          fontWeight: 700,
          fontSize: '2.5rem',
          color: '#1e293b',
          letterSpacing: '-0.5px',
          lineHeight: 1,
          mb: 1
        }}
      >
        {value}
        <Box 
          component="span" 
          sx={{ 
            fontSize: '1.25rem', 
            color: '#94a3b8',
            fontWeight: 400,
            ml: 0.5
          }}
        >
          dB
        </Box>
      </Typography>

      {/* Status Chip */}
      <Chip 
        label={status.label}
        sx={{
          bgcolor: status.bgcolor,
          color: status.color,
          fontWeight: 600,
          fontSize: '0.7rem',
          height: 24,
          borderRadius: 1.5,
          minWidth: 90,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      />
    </Paper>
  );
}