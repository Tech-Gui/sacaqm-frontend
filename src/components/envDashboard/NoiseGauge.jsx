// import React, { useRef, useEffect } from "react";
// import { Paper, Typography, Box, Chip } from "@mui/material";

// export default function NoiseGaugeWidget({ value = 0, subLabel = "Daily Average" }) {
//   const canvasRef = useRef(null);

//   const thresholds = { green: 55, amber: 70, red: 100 };

//   const getStatus = () => {
//     if (value <= thresholds.green) return { label: "Compliant", bgcolor: "#dcfce7", color: "#16a34a" };
//     if (value <= thresholds.amber) return { label: "Warning", bgcolor: "#fef3c7", color: "#d97706" };
//     return { label: "Non-Compliant", bgcolor: "#fee2e2", color: "#dc2626" };
//   };

//   const status = getStatus();

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
//     const width = canvas.width;
//     const height = canvas.height;
//     const centerX = width / 2;
//     const centerY = height - 20;
//     const radius = 80;

//     ctx.clearRect(0, 0, width, height);

//     // ✅ FIXED: Use -Math.PI to 0 (top semicircle going clockwise)
//     // This makes 0% = left side, 50% = top, 100% = right side
//     const startAngle = -Math.PI;  // Left side (-180°)
//     const endAngle = 0;            // Right side (0°)
//     const totalAngle = Math.PI;    // 180° span

//     const greenPercent = thresholds.green / thresholds.red;
//     const amberPercent = thresholds.amber / thresholds.red;

//     const greenAngle = startAngle + (totalAngle * greenPercent);
//     const amberAngle = startAngle + (totalAngle * amberPercent);

//     // GREEN zone (0-55)
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, radius, startAngle, greenAngle, false);
//     ctx.lineWidth = 20;
//     ctx.strokeStyle = '#22c55e';
//     ctx.stroke();

//     // AMBER zone (56-70)
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, radius, greenAngle, amberAngle, false);
//     ctx.lineWidth = 20;
//     ctx.strokeStyle = '#f59e0b';
//     ctx.stroke();

//     // RED zone (71-100)
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, radius, amberAngle, endAngle, false);
//     ctx.lineWidth = 20;
//     ctx.strokeStyle = '#ef4444';
//     ctx.stroke();

//     // Tick marks
//     ctx.strokeStyle = '#cbd5e1';
//     ctx.lineWidth = 2;
//     for (let i = 0; i <= 10; i++) {
//       const angle = startAngle + (totalAngle * i / 10);
//       ctx.beginPath();
//       ctx.moveTo(centerX + (radius - 15) * Math.cos(angle), centerY + (radius - 15) * Math.sin(angle));
//       ctx.lineTo(centerX + (radius + 5) * Math.cos(angle), centerY + (radius + 5) * Math.sin(angle));
//       ctx.stroke();
//     }

//     // Labels
//     ctx.fillStyle = '#64748b';
//     ctx.font = 'bold 11px sans-serif';
//     ctx.textAlign = 'center';
//     ctx.fillText('0', centerX - radius - 10, centerY + 5);
//     ctx.fillText('50', centerX, centerY - radius + 15);
//     ctx.fillText('100', centerX + radius + 10, centerY + 5);

//     // NEEDLE - Fixed calculation
//     const safeValue = Math.min(Math.max(value, 0), thresholds.red);
//     const valuePercent = safeValue / thresholds.red;
//     const needleAngle = startAngle + (totalAngle * valuePercent);
//     const needleLength = radius - 25;

//     console.log(`Needle: ${value}dB = ${(valuePercent*100).toFixed(1)}% = ${needleAngle.toFixed(2)} radians`);

//     ctx.save();
//     ctx.translate(centerX, centerY);
//     ctx.rotate(needleAngle + Math.PI / 2);
//     ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
//     ctx.shadowBlur = 6;
//     ctx.shadowOffsetY = 3;
//     ctx.beginPath();
//     ctx.moveTo(-4, 0);
//     ctx.lineTo(4, 0);
//     ctx.lineTo(1, -needleLength);
//     ctx.lineTo(-1, -needleLength);
//     ctx.closePath();
//     ctx.fillStyle = '#1e293b';
//     ctx.fill();
//     ctx.restore();

//     // Center
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
//     ctx.fillStyle = '#1e293b';
//     ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
//     ctx.shadowBlur = 4;
//     ctx.fill();
//     ctx.beginPath();
//     ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
//     ctx.fillStyle = '#e2e8f0';
//     ctx.shadowBlur = 0;
//     ctx.fill();

//   }, [value]);

//   return (
//     <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)', bgcolor: 'white', p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width : '100%',  minHeight: 240, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', transform: 'translateY(-4px)' } }}>
//       <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', mb: 2 }}>📊 Noise Levels</Typography>
//       <canvas ref={canvasRef} width={220} height={140} style={{ marginBottom: '12px' }} />
//       <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', color: '#1e293b', letterSpacing: '-0.5px', lineHeight: 1, mb: 0.5 }}>
//         {value}<Box component="span" sx={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 400, ml: 0.5 }}>dB</Box>
//       </Typography>
//       <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', mb: 1 }}>
//         {subLabel}
//       </Typography>
//       <Chip label={status.label} sx={{ bgcolor: status.bgcolor, color: status.color, fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5, minWidth: 90, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
//     </Paper>
//   );
// }
import React, { useRef, useEffect } from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";

export default function NoiseGaugeWidget({ value = 0, subLabel = "Daily Average" }) {
  const canvasRef = useRef(null);

  const thresholds = { green: 70, amber: 85, red: 130 };

  const getStatus = () => {
    if (value <= thresholds.green) return { label: "Safe", bgcolor: "#dcfce7", color: "#16a34a" };
    if (value <= thresholds.amber) return { label: "Loud — Caution", bgcolor: "#fef3c7", color: "#d97706" };
    return { label: "Dangerous", bgcolor: "#fee2e2", color: "#dc2626" };
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
    const radius = 80;

    ctx.clearRect(0, 0, width, height);

    // ✅ FIXED: Use -Math.PI to 0 (top semicircle going clockwise)
    // This makes 0% = left side, 50% = top, 100% = right side
    const startAngle = -Math.PI;  // Left side (-180°)
    const endAngle = 0;            // Right side (0°)
    const totalAngle = Math.PI;    // 180° span

    const greenPercent = thresholds.green / thresholds.red;
    const amberPercent = thresholds.amber / thresholds.red;

    const greenAngle = startAngle + (totalAngle * greenPercent);
    const amberAngle = startAngle + (totalAngle * amberPercent);

    // GREEN zone (0-55)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, greenAngle, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#22c55e';
    ctx.stroke();

    // AMBER zone (56-70)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, greenAngle, amberAngle, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // RED zone (71-100)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, amberAngle, endAngle, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    // Tick marks
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (totalAngle * i / 10);
      ctx.beginPath();
      ctx.moveTo(centerX + (radius - 15) * Math.cos(angle), centerY + (radius - 15) * Math.sin(angle));
      ctx.lineTo(centerX + (radius + 5) * Math.cos(angle), centerY + (radius + 5) * Math.sin(angle));
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', centerX - radius - 10, centerY + 5);
    ctx.fillText('65', centerX, centerY - radius + 15);
    ctx.fillText('130', centerX + radius + 10, centerY + 5);

    // NEEDLE - Fixed calculation
    const safeValue = Math.min(Math.max(value, 0), thresholds.red);
    const valuePercent = safeValue / thresholds.red;
    const needleAngle = startAngle + (totalAngle * valuePercent);
    const needleLength = radius - 25;

    console.log(`Needle: ${value}dB = ${(valuePercent*100).toFixed(1)}% = ${needleAngle.toFixed(2)} radians`);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(needleAngle + Math.PI / 2);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
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

    // Center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 0;
    ctx.fill();

  }, [value]);

  return (
    <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)', bgcolor: 'white', p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width : '100%',  minHeight: 240, transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)', transform: 'translateY(-4px)' } }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', mb: 2 }}>📊 Noise Levels</Typography>
      <canvas ref={canvasRef} width={220} height={140} style={{ marginBottom: '12px' }} />
      <Typography sx={{ fontWeight: 700, fontSize: '2.5rem', color: '#1e293b', letterSpacing: '-0.5px', lineHeight: 1, mb: 0.5 }}>
        {value}<Box component="span" sx={{ fontSize: '1.25rem', color: '#94a3b8', fontWeight: 400, ml: 0.5 }}>dB</Box>
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', mb: 1 }}>
        {subLabel}
      </Typography>
      <Chip label={status.label} sx={{ bgcolor: status.bgcolor, color: status.color, fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5, minWidth: 90, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
    </Paper>
  );
}