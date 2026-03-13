import React, { useState, useEffect } from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  annotationPlugin
);

// SA AQI 4-colour bands
const PM_ZONES = {
  pm25: [
    { max: 103,      color: '#22c55e', chartBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', badgeBg: '#dcfce7', badgeColor: '#16a34a', label: 'Normal'   },
    { max: 128,      color: '#eab308', chartBg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', badgeBg: '#fef9c3', badgeColor: '#854d0e', label: 'Moderate' },
    { max: 178,      color: '#f97316', chartBg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', badgeBg: '#ffedd5', badgeColor: '#c2410c', label: 'High'  },
    { max: Infinity, color: '#ef4444', chartBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', badgeBg: '#fee2e2', badgeColor: '#dc2626', label: 'Very High'    },
  ],
  pm10: [
    { max: 190,      color: '#22c55e', chartBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', badgeBg: '#dcfce7', badgeColor: '#16a34a', label: 'Normal'   },
    { max: 240,      color: '#eab308', chartBg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', badgeBg: '#fef9c3', badgeColor: '#854d0e', label: 'Moderate' },
    { max: 290,      color: '#f97316', chartBg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', badgeBg: '#ffedd5', badgeColor: '#c2410c', label: 'High'  },
    { max: Infinity, color: '#ef4444', chartBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', badgeBg: '#fee2e2', badgeColor: '#dc2626', label: 'Very High'    },
  ],
};

const getZones  = (pk) => PM_ZONES[pk] || PM_ZONES.pm25;
const getStatus = (avg, pk) => { for (const z of getZones(pk)) { if (avg <= z.max) return z; } return getZones(pk).at(-1); };

const getCardSx = (sc) => ({
  borderRadius: 4,
  borderTop: `4px solid ${sc.color}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  height: '100%',
  bgcolor: 'white',
  transition: 'all 0.4s ease',
  '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.15)', transform: 'translateY(-8px) scale(1.02)' }
});

function useCountUp(end, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime, raf;
    const tick = (now) => {
      if (!startTime) startTime = now;
      const p = Math.min((now - startTime) / duration, 1);
      setCount(Math.floor(p * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return count;
}

export default function PMChartWidget({
  title,
  dataPoints,
  labels,
  threshold,
  paramKey = "pm25",
  trend = 0
}) {
  const avg          = Math.round(dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length);
  const animatedValue= useCountUp(avg, 1200);
  const statusColor  = getStatus(avg, paramKey);
  const isExceeding  = avg > threshold;
  const minValue     = Math.min(...dataPoints);
  const maxValue     = Math.max(...dataPoints);

  const createGradient = (ctx, chartArea, color) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, `${color}10`);
    gradient.addColorStop(0.5, `${color}30`);
    gradient.addColorStop(1, `${color}50`);
    return gradient;
  };

  // Single solid-color line based on avg status — same as original, just 4 colors now
  const chartData = {
    labels,
    datasets: [{
      data: dataPoints,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return statusColor.color + '20';
        return createGradient(ctx, chartArea, statusColor.color);
      },
      borderColor: statusColor.color,
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 3,
      pointHoverBackgroundColor: 'white',
      pointHoverBorderColor: statusColor.color,
      fill: true
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.3,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 14,
        borderRadius: 10,
        titleFont: { size: 13, weight: 700 },
        bodyFont: { size: 12, weight: 500 },
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} µg/m³`,
          afterLabel: (ctx) => {
            const diff = ctx.parsed.y - threshold;
            return diff > 0 ? `⚠️ ${diff} above threshold` : `✓ ${Math.abs(diff)} below threshold`;
          }
        }
      },
      annotation: {
        annotations: {
          thresholdLine: {
            type: 'line',
            yMin: threshold,
            yMax: threshold,
            borderColor: 'rgba(0,0,0,0.3)',
            borderDash: [8, 4],
            borderWidth: 2,
            label: { display: false }
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { display: true, font: { size: 9, weight: 500 }, color: '#94a3b8', maxRotation: 0, autoSkipPadding: 10 }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
        title: { display: true, text: 'µg/m³', color: '#64748b', font: { size: 11, weight: 650 }, padding: { bottom: 4 } },
        ticks: { font: { size: 10, weight: 500 }, color: '#94a3b8', count: 5, padding: 8, callback: (v) => v }
      }
    }
  };

  return (
    <Paper sx={getCardSx(statusColor)}>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase', flex: 1 }}>
            {title}
          </Typography>
          <Chip
            label={statusColor.label}
            size="small"
            sx={{
              bgcolor: statusColor.badgeBg,
              color: statusColor.badgeColor,
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 22,
              borderRadius: 1.5,
              animation: isExceeding ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.7 } }
            }}
          />
        </Box>

        {/* Chart inside tinted background */}
        <Box sx={{ background: statusColor.chartBg, borderRadius: 3, p: 2, mb: 2.5, boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)' }}>
          <Line data={chartData} options={options} />
        </Box>

        {/* Animated avg value */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '2.25rem', color: statusColor.color, lineHeight: 1 }}>
            {animatedValue}
          </Typography>
          <Box component="span" sx={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500, mt: 0.5 }}>µg/m³</Box>
        </Box>

        {/* Daily Average label */}
        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Daily Average
        </Typography>

        {/* Min / Max */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, pt: 2, borderTop: '2px solid #f1f5f9' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Min</Typography>
            <Typography sx={{ fontSize: '1rem', color: '#22c55e', fontWeight: 800 }}>{minValue}</Typography>
          </Box>
          <Box sx={{ width: '2px', bgcolor: '#e2e8f0' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>Max</Typography>
            <Typography sx={{ fontSize: '1rem', color: '#ef4444', fontWeight: 800 }}>{maxValue}</Typography>
          </Box>
        </Box>

      </Box>
    </Paper>
  );
}