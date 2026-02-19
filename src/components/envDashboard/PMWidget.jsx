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

// ✅ Determine color based on ACTUAL compliance status vs threshold
const getStatusColor = (avg, threshold) => {
  if (avg <= threshold) {
    // Green: Compliant
    return {
      borderColor: '#22c55e',
      chartBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      badgeBg: '#dcfce7',
      badgeColor: '#16a34a',
      label: 'Normal',
      status: 'Green'
    };
  } else if (avg <= threshold * 1.2) {
    // Amber: Warning (within 20% above threshold)
    return {
      borderColor: '#f59e0b',
      chartBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      badgeBg: '#fef3c7',
      badgeColor: '#d97706',
      label: 'Warning',
      status: 'Amber'
    };
  } else {
    // Red: Non-compliant (>20% above threshold)
    return {
      borderColor: '#ef4444',
      chartBg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      badgeBg: '#fee2e2',
      badgeColor: '#dc2626',
      label: 'Alert',
      status: 'Red'
    };
  }
};

// Card styling based on status color
const getCardSx = (statusColor) => ({
  borderRadius: 4,
  borderTop: `4px solid ${statusColor.borderColor}`,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  height: '100%',
  bgcolor: 'white',
  transition: 'all 0.4s ease',
  '&:hover': {
    boxShadow: `0 12px 40px rgba(0, 0, 0, 0.15)`,
    transform: 'translateY(-8px) scale(1.02)',
  }
});

// Animated Counter
function useCountUp(end, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime, animationFrame;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return count;
}

export default function PMChartWidget({
  title,
  dataPoints,
  labels,
  threshold,
  colorType = "green", // ⚠️ IGNORED — color now determined by threshold compliance
  trend = 0
}) {
  const avg = Math.round(dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length);
  const animatedValue = useCountUp(avg, 1200);
  
  // ✅ Determine color based on compliance status
  const statusColor = getStatusColor(avg, threshold);
  const isExceeding = avg > threshold;
  
  const minValue = Math.min(...dataPoints);
  const maxValue = Math.max(...dataPoints);

  const createGradient = (ctx, chartArea, color) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, `${color}10`);
    gradient.addColorStop(0.5, `${color}30`);
    gradient.addColorStop(1, `${color}50`);
    return gradient;
  };

  const data = {
    labels,
    datasets: [{
      data: dataPoints,
      backgroundColor: (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return statusColor.borderColor + '20';
        return createGradient(ctx, chartArea, statusColor.borderColor);
      },
      borderColor: statusColor.borderColor,
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 3,
      pointHoverBackgroundColor: 'white',
      pointHoverBorderColor: statusColor.borderColor,
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
          threshold: {
            type: "line",
            yMin: threshold,
            yMax: threshold,
            borderColor: 'rgba(0, 0, 0, 0.3)',
            borderDash: [8, 4],
            borderWidth: 2,
            label: {
              display: true,
              content: `Threshold: ${threshold}`,
              position: 'end',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              font: { size: 10, weight: 700 },
              padding: 6,
              borderRadius: 6
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          display: true,
          font: { size: 9, weight: 500 },
          color: '#94a3b8',
          maxRotation: 0,
          autoSkipPadding: 10
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false
        },
        ticks: {
          font: { size: 10, weight: 500 },
          color: '#94a3b8',
          count: 5,
          padding: 8
        }
      }
    }
  };

  const getTrendIcon = () => trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  const getTrendColor = () => trend > 0 ? '#ef4444' : trend < 0 ? '#22c55e' : '#94a3b8';

  return (
    <Paper sx={getCardSx(statusColor)}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography sx={{ 
            fontWeight: 700, 
            fontSize: '0.75rem', 
            color: '#64748b', 
            letterSpacing: '0.8px', 
            textTransform: 'uppercase', 
            flex: 1 
          }}>
            {title}
          </Typography>
          
          {/* ✅ Status chip now reflects actual compliance */}
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
              '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } }
            }}
          />
        </Box>

        {/* Chart */}
        <Box sx={{ 
          background: statusColor.chartBg, 
          borderRadius: 3, 
          p: 2, 
          mb: 2.5, 
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.06)' 
        }}>
          <Line data={data} options={options} />
        </Box>

        {/* Value + Trend */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Typography sx={{ 
            fontWeight: 800, 
            fontSize: '2.25rem', 
            background: isExceeding 
              ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
              : 'linear-gradient(135deg, #1e293b, #334155)', 
            backgroundClip: 'text', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            lineHeight: 1 
          }}>
            {animatedValue}
          </Typography>
          <Box component="span" sx={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500, mt: 0.5 }}>
            µg/m³
          </Box>
          
          {trend !== 0 && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              ml: 1, 
              color: getTrendColor(), 
              bgcolor: `${getTrendColor()}15`, 
              px: 1, 
              py: 0.5, 
              borderRadius: 1.5 
            }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{getTrendIcon()}</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, ml: 0.3 }}>{Math.abs(trend)}%</Typography>
            </Box>
          )}
        </Box>

        {/* Min/Max */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, pt: 2, borderTop: '2px solid #f1f5f9' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ 
              fontSize: '0.65rem', 
              color: '#94a3b8', 
              fontWeight: 700, 
              mb: 0.5, 
              textTransform: 'uppercase' 
            }}>
              Min
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#22c55e', fontWeight: 800 }}>
              {minValue}
            </Typography>
          </Box>
          
          <Box sx={{ width: '2px', bgcolor: '#e2e8f0' }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ 
              fontSize: '0.65rem', 
              color: '#94a3b8', 
              fontWeight: 700, 
              mb: 0.5, 
              textTransform: 'uppercase' 
            }}>
              Max
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#ef4444', fontWeight: 800 }}>
              {maxValue}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}