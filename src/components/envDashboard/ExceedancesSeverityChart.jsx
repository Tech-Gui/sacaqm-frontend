import React from "react";
import { Paper, Typography, Box, FormControlLabel, Checkbox } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ExceedancesSeverityChart({ 
  hourlyData = [], 
  thresholds = {}, 
  severity = "moderate", // "moderate", "high", "veryHigh"
  title = "Exceedances",
  color = "#fbbf24"
}) {
  
  const [visibleParams, setVisibleParams] = React.useState({
    pm25: true,
    pm10: true,
    noise: true,
    nox: true,
    // Start with most important parameters visible
    pm1: false,
    pm5: false,
    co2: false,
    voc: false,
  });

  // Calculate which severity level to count
  const getExceedanceLevel = (value, threshold) => {
    if (threshold == null) return null;
    if (value <= threshold) return null;
    if (value <= threshold * 1.2) return "moderate";
    if (value <= threshold * 1.5) return "high";
    return "veryHigh";
  };

  // Group hourly data by date and count exceedances per parameter at this severity
  const dailyExceedances = {};
  
  hourlyData.forEach((record) => {
    const date = new Date(record.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    if (!dailyExceedances[date]) {
      dailyExceedances[date] = {
        pm1: 0,
        pm25: 0,
        pm5: 0,
        pm10: 0,
        noise: 0,
        co2: 0,
        nox: 0,
        voc: 0,
      };
    }
    
    // Count exceedances per parameter at this severity level
    const checkParam = (value, threshold, param) => {
      const level = getExceedanceLevel(value || 0, threshold);
      if (level === severity) {
        dailyExceedances[date][param]++;
      }
    };
    
    checkParam(record.pm1p0, thresholds.pm1, 'pm1');
    checkParam(record.pm2p5, thresholds.pm25, 'pm25');
    checkParam(record.pm4p0, thresholds.pm5, 'pm5');
    checkParam(record.pm10p0, thresholds.pm10, 'pm10');
    checkParam(record.dba, thresholds.noise, 'noise');
    checkParam(record.co2, thresholds.co2, 'co2');
    checkParam(record.nox, thresholds.nox, 'nox');
    checkParam(record.voc, thresholds.voc, 'voc');
  });

  const labels = Object.keys(dailyExceedances);

  // Define parameters with colors
  const parameterConfig = [
    { key: 'pm1', label: 'PM1.0', color: '#b47f02', borderWidth: 2 },
    { key: 'pm25', label: 'PM2.5', color: '#ef4444', borderWidth: 3 },
    { key: 'pm5', label: 'PM4.0', color: '#ec4899', borderWidth: 2 },
    { key: 'pm10', label: 'PM10', color: '#ffcc00', borderWidth: 3 },
    { key: 'noise', label: 'Noise', color: '#8b5cf6', borderWidth: 3 },
    { key: 'co2', label: 'CO2', color: '#10b981', borderWidth: 2 },
    { key: 'nox', label: 'NOx', color: '#3b82f6', borderWidth: 3 },
    { key: 'voc', label: 'VOC', color: '#6366f1', borderWidth: 2 },
  ];

  // Filter out CO2 if no data, and filter out params with no threshold
  const hasCO2 = hourlyData.some(d => (d.co2 || 0) > 0);
  const thresholdKeyMap = { pm1: 'pm1', pm25: 'pm25', pm5: 'pm5', pm10: 'pm10', noise: 'noise', co2: 'co2', nox: 'nox', voc: 'voc' };
  const filteredParams = parameterConfig.filter(p => {
    if (p.key === 'co2' && !hasCO2) return false;
    if (thresholds[thresholdKeyMap[p.key]] == null) return false;
    return true;
  });

  // Build datasets only for visible parameters
  const datasets = filteredParams
    .filter(param => visibleParams[param.key])
    .map(param => ({
      label: param.label,
      data: labels.map(date => dailyExceedances[date][param.key]),
      borderColor: param.color,
      backgroundColor: param.color + '30',
      borderWidth: param.borderWidth,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: 'white',
      pointBorderColor: param.color,
      pointBorderWidth: 2,
      tension: 0.3,
      fill: true
    }));

  const chartData = {
    labels,
    datasets
  };

  const rangeLabels = {
    moderate: "1.0x - 1.2x",
    high: "1.2x - 1.5x",
    veryHigh: "1.5x+"
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        borderRadius: 8,
        titleFont: { size: 11, weight: 600 },
        bodyFont: { size: 10 },
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y} exceedances`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 9, weight: 500 },
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: { size: 9, weight: 500 },
          color: '#94a3b8'
        }
      }
    }
  };

  const handleToggle = (paramKey) => {
    setVisibleParams(prev => ({
      ...prev,
      [paramKey]: !prev[paramKey]
    }));
  };

  // Calculate total across all visible parameters
  const total = datasets.reduce((sum, dataset) => {
    return sum + dataset.data.reduce((a, b) => a + b, 0);
  }, 0);

  return (
    <Paper sx={{ 
      borderRadius: 3, 
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      bgcolor: 'white',
      p: 2.5,
      height: '100%',
      minHeight: 340
    }}>
      {/* Header */}
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ 
          fontWeight: 700, 
          fontSize: '0.85rem',
          color: '#1e293b',
          mb: 0.3
        }}>
          {title}
        </Typography>
        <Typography sx={{ 
          fontSize: '0.65rem',
          color: '#94a3b8',
          fontWeight: 500
        }}>
          Range: {rangeLabels[severity]} threshold
        </Typography>
      </Box>

      {/* Parameter Toggles */}
      <Box sx={{ 
        mb: 1.5, 
        pb: 1.5, 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5
      }}>
        {filteredParams.map(param => (
          <FormControlLabel
            key={param.key}
            control={
              <Checkbox
                checked={visibleParams[param.key]}
                onChange={() => handleToggle(param.key)}
                size="small"
                sx={{
                  color: param.color,
                  '&.Mui-checked': { color: param.color },
                  py: 0,
                  '& .MuiSvgIcon-root': { fontSize: 16 }
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Box sx={{ 
                  width: 10, 
                  height: 2.5, 
                  bgcolor: param.color, 
                  borderRadius: 1 
                }} />
                <Typography sx={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 600, 
                  color: visibleParams[param.key] ? '#1e293b' : '#94a3b8'
                }}>
                  {param.label}
                </Typography>
              </Box>
            }
            sx={{ m: 0, mr: 0.5 }}
          />
        ))}
      </Box>

      {/* Chart */}
      <Box sx={{ height: 160, mb: 1.5 }}>
        {datasets.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#94a3b8'
          }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              Select parameters to display
            </Typography>
          </Box>
        )}
      </Box>

      {/* Total */}
      <Box sx={{ 
        textAlign: 'center',
        pt: 1.5,
        borderTop: '2px solid #f1f5f9'
      }}>
        <Typography sx={{ 
          fontSize: '0.6rem', 
          color: '#94a3b8', 
          fontWeight: 700, 
          mb: 0.3, 
          textTransform: 'uppercase' 
        }}>
          Total Exceedances
        </Typography>
        <Typography sx={{ 
          fontSize: '1.5rem', 
          fontWeight: 800, 
          color: color, 
          lineHeight: 1 
        }}>
          {total}
        </Typography>
      </Box>
    </Paper>
  );
}