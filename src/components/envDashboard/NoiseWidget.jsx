import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip,
  Filler 
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, annotationPlugin);

const cardSx = {
  borderRadius: 3, 
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  bgcolor: 'white',
  p: 2.5,
  height: '100%',
  width: '100%',
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-4px)',
  }
};

export default function NoiseWidget({ 
  title = "Noise Levels", 
  labels = [], 
  data = [], 
  threshold = 70 
}) {
  const avg = data.length ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;

  const createGradient = (ctx, chartArea) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(251, 146, 60, 0.1)');
    gradient.addColorStop(1, 'rgba(251, 146, 60, 0.3)');
    return gradient;
  };

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: (context) => {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        if (!chartArea) return 'rgba(251, 146, 60, 0.15)';
        return createGradient(ctx, chartArea);
      },
      borderColor: '#fb923c',
      borderWidth: 2.5,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBorderWidth: 2,
      pointHoverBackgroundColor: 'white',
      pointHoverBorderColor: '#fb923c',
      fill: true
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        borderRadius: 8,
        titleFont: { size: 12, weight: 600 },
        bodyFont: { size: 11 },
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} dB`
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
          autoSkipPadding: 15
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        title: {
          display: true,
          text: 'dB',
          color: '#64748b',
          font: { size: 13, weight: 600 },
          padding: { bottom: 4 }
        },
        ticks: {
          font: { size: 10 },
          color: '#94a3b8',
          count: 5,
          padding: 8
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <Paper sx={cardSx}>
      {/* Title */}
      <Typography 
        sx={{ 
          fontWeight: 600, 
          fontSize: '0.75rem',
          color: '#64748b',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          mb: 1.5
        }}
      >
        {title}
      </Typography>

      {/* Chart */}
      <Box sx={{ mb: 1.5, flex: 1, minHeight: 0 }}>
        <Line data={chartData} options={options} />
      </Box>

      {/* Value */}
      <Typography 
        align="center" 
        sx={{ 
          fontWeight: 700,
          fontSize: '2rem',
          color: '#1e293b',
          letterSpacing: '-0.5px',
          lineHeight: 1
        }}
      >
        {avg}
        <Box 
          component="span" 
          sx={{ 
            fontSize: '1rem', 
            color: '#94a3b8',
            fontWeight: 400,
            ml: 0.5
          }}
        >
          dB
        </Box>
      </Typography>
      <Typography
        align="center"
        sx={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#94a3b8',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          mt: 0.5,
        }}
      >
        Daily Average
      </Typography>
    </Paper>
  );
}