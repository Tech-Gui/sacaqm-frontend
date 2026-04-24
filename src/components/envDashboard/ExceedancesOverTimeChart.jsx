import React from "react";
import { Paper, Typography, Box, FormControlLabel, Checkbox, FormGroup } from "@mui/material";
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

export default function ExceedancesOverTimeChart({ hourlyData = [], thresholds = {}, isForecast = false, forecastHourLabels = [], forecastDayLabel = null, hasNoise = true, isSingleDay = false }) {
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

  // Group hourly data by date (or by hour if single day view) and count total exceedances per parameter
  const dailyExceedances = {};

  hourlyData.forEach((record) => {
    const d = new Date(record.timestamp);
    let key, label;
    if (isSingleDay && !isForecast) {
      key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      const h = d.getHours() % 12 || 12;
      const ampm = d.getHours() < 12 ? 'AM' : 'PM';
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      label = `${dateStr}, ${h} ${ampm}`;
    } else {
      key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    if (!dailyExceedances[key]) {
      dailyExceedances[key] = { label, pm1: 0, pm25: 0, pm5: 0, pm10: 0, noise: 0, co2: 0, nox: 0, voc: 0 };
    }

    if (thresholds.pm1 != null && (record.pm1p0 || 0) > thresholds.pm1) dailyExceedances[key].pm1++;
    if (thresholds.pm25 != null && (record.pm2p5 || 0) > thresholds.pm25) dailyExceedances[key].pm25++;
    if (thresholds.pm5 != null && (record.pm4p0 || 0) > thresholds.pm5) dailyExceedances[key].pm5++;
    if (thresholds.pm10 != null && (record.pm10p0 || 0) > thresholds.pm10) dailyExceedances[key].pm10++;
    if (thresholds.noise != null && (record.dba || 0) > thresholds.noise) dailyExceedances[key].noise++;
    if (thresholds.co2 != null && (record.co2 || 0) > thresholds.co2) dailyExceedances[key].co2++;
    if (thresholds.nox != null && (record.nox || 0) > thresholds.nox) dailyExceedances[key].nox++;
    if (thresholds.voc != null && (record.voc || 0) > thresholds.voc) dailyExceedances[key].voc++;
  });



  const allBuckets = Object.values(dailyExceedances);
  // In forecast mode with hourly data: use hour labels directly
  // Otherwise group by day as before
  let labels, mappedValues;
  if (isForecast && forecastHourLabels.length > 0) {
    // For 24-hour forecast, show per-hour data points
    // Each data point is already one hour, so use individual hour labels
    labels = allBuckets.map((b, i) => {
      const d = new Date(hourlyData[i]?.timestamp || '');
      if (!isNaN(d.getTime())) {
        const h = d.getHours() % 12 || 12;
        const ampm = d.getHours() < 12 ? 'AM' : 'PM';
        return `${h} ${ampm}`;
      }
      return forecastHourLabels[i] ?? b.label;
    });
    mappedValues = allBuckets;
  } else {
    labels = allBuckets.map(b => b.label);
    mappedValues = allBuckets;
  }

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
    if (p.key === 'noise' && !hasNoise) return false;
    if (p.key === 'co2' && !hasCO2) return false;
    if (thresholds[thresholdKeyMap[p.key]] == null) return false;
    return true;
  });

  // Build datasets only for visible parameters
  const datasets = filteredParams
    .filter(param => visibleParams[param.key])
    .map(param => ({
      label: param.label,
      data: labels.map((_, i) => mappedValues[i]?.[param.key] ?? 0),
      borderColor: param.color,
      backgroundColor: param.color,
      borderWidth: param.borderWidth,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: 'white',
      pointBorderColor: param.color,
      pointBorderWidth: 2,
      tension: 0.3,
      fill: false
    }));

  const data = {
    labels,
    datasets
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
        display: false, // We use custom checkboxes instead
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        borderRadius: 8,
        titleFont: { size: 12, weight: 600 },
        bodyFont: { size: 11 },
        callbacks: {
          label: (context) => {
            const count = context.parsed.y;
            return `${context.dataset.label}: ${count} ${count === 1 ? 'hour' : 'hours'} exceeded`;
          },
          afterBody: (items) => {
            const total = items.reduce((sum, item) => sum + item.parsed.y, 0);
            return `\nTotal exceedances: ${total} hours`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: 500 },
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        beginAtZero: true,
        ticks: {
          font: { size: 10, weight: 500 },
          color: '#94a3b8',
          callback: (value) => value
        },
        title: {
          display: true,
          text: 'Number of Exceedances (Hours per Day)',
          font: { size: 11, weight: 600 },
          color: '#64748b'
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

  return (
    <Paper sx={{
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      bgcolor: 'white',
      p: 3,
      height: '100%',
      minHeight: 400
    }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{
          fontWeight: 700,
          fontSize: '0.95rem',
          color: '#1e293b',
          mb: 0.5
        }}>
          Total Hourly Exceedances{isForecast ? ' (Forecast)' : ''}
        </Typography>
        <Typography sx={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          fontWeight: 500
        }}>
          {isForecast
            ? `Projected hourly exceedances for next 24 hours`
            : isSingleDay
            ? 'Number of times each parameter exceeded threshold per hour today'
            : `Number of hours each parameter exceeded SAAQIS threshold per day`}
        </Typography>
      </Box>

      {/* Parameter Toggles */}
      <Box sx={{
        mb: 2,
        pb: 2,
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1
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
                  py: 0
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{
                  width: 12,
                  height: 3,
                  bgcolor: param.color,
                  borderRadius: 1
                }} />
                <Typography sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: visibleParams[param.key] ? '#1e293b' : '#94a3b8'
                }}>
                  {param.label}
                </Typography>
              </Box>
            }
            sx={{ m: 0, mr: 1 }}
          />
        ))}
      </Box>

      {/* Chart */}
      <Box sx={{ height: 280 }}>
        {datasets.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#94a3b8'
          }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Select at least one parameter to display
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}