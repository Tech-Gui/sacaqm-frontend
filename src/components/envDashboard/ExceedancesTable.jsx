import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow 
} from "@mui/material";

export default function ExceedancesTable({ hourlyData = [], thresholds = {} }) {
  
  // Calculate exceedances for each parameter at 3 severity levels
  const calculateExceedances = (field, threshold) => {
    let moderate = 0;  // 1.0x - 1.2x
    let high = 0;      // 1.2x - 1.5x
    let veryHigh = 0;  // 1.5x+
    
    hourlyData.forEach((record) => {
      const value = record[field] || 0;
      
      if (value > threshold && value <= threshold * 1.2) {
        moderate++;
      } else if (value > threshold * 1.2 && value <= threshold * 1.5) {
        high++;
      } else if (value > threshold * 1.5) {
        veryHigh++;
      }
    });
    
    return { moderate, high, veryHigh, total: moderate + high + veryHigh };
  };

  // Define parameters with their field names and display info
  const parameters = [
    { name: "PM1.0", field: "pm1p0", threshold: thresholds.pm1, unit: "µg/m³" },
    { name: "PM2.5", field: "pm2p5", threshold: thresholds.pm25, unit: "µg/m³" },
    { name: "PM4.0", field: "pm4p0", threshold: thresholds.pm5, unit: "µg/m³" },
    { name: "PM10", field: "pm10p0", threshold: thresholds.pm10, unit: "µg/m³" },
    { name: "Noise", field: "dba", threshold: thresholds.noise, unit: "dB" },
    { name: "Temperature", field: "temperature", threshold: thresholds.temperature, unit: "°C" },
    { name: "Humidity", field: "humidity", threshold: thresholds.humidity, unit: "%" },
    { name: "CO2", field: "co2", threshold: thresholds.co2, unit: "ppm" },
    { name: "NOx", field: "nox", threshold: thresholds.nox, unit: "ppb" },
    { name: "VOC", field: "voc", threshold: thresholds.voc, unit: "" },
  ];

  // Calculate exceedances for all parameters
  const rows = parameters.map((param) => ({
    ...param,
    exceedances: calculateExceedances(param.field, param.threshold)
  }));

  // Filter out CO2 if no data
  const filteredRows = rows.filter(row => {
    if (row.field === 'co2') {
      return hourlyData.some(d => (d.co2 || 0) > 0);
    }
    return true;
  });

  // Calculate totals
  const totals = filteredRows.reduce((acc, row) => ({
    moderate: acc.moderate + row.exceedances.moderate,
    high: acc.high + row.exceedances.high,
    veryHigh: acc.veryHigh + row.exceedances.veryHigh,
    total: acc.total + row.exceedances.total
  }), { moderate: 0, high: 0, veryHigh: 0, total: 0 });

  const getSeverityChip = (count, level) => {
    if (count === 0) return <Box sx={{ color: '#94a3b8', fontWeight: 500 }}>—</Box>;
    
    const colors = {
      moderate: { bg: '#fef3c7', color: '#92400e' },
      high: { bg: '#fed7aa', color: '#7c2d12' },
      veryHigh: { bg: '#fee2e2', color: '#7f1d1d' }
    };
    
    return (
      <Chip 
        label={count}
        size="small"
        sx={{
          bgcolor: colors[level].bg,
          color: colors[level].color,
          fontWeight: 700,
          fontSize: '0.75rem',
          minWidth: 45,
          height: 26
        }}
      />
    );
  };

  return (
    <Paper sx={{ 
      borderRadius: 3, 
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      bgcolor: 'white',
      p: 3,
      height: '100%'
    }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ 
          fontWeight: 700, 
          fontSize: '0.95rem',
          color: '#1e293b',
          mb: 0.5
        }}>
          Exceedances by Parameter & Severity
        </Typography>
        <Typography sx={{ 
          fontSize: '0.75rem',
          color: '#94a3b8',
          fontWeight: 500
        }}>
          Hourly threshold violations over selected period ({hourlyData.length} hours analyzed)
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                Parameter
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                Threshold
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#92400e', borderBottom: '2px solid #e2e8f0', bgcolor: '#fef3c7' }}>
                Moderate<br/>
                <Box component="span" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>1.0x - 1.2x</Box>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#7c2d12', borderBottom: '2px solid #e2e8f0', bgcolor: '#fed7aa' }}>
                High<br/>
                <Box component="span" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>1.2x - 1.5x</Box>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#7f1d1d', borderBottom: '2px solid #e2e8f0', bgcolor: '#fee2e2' }}>
                Very High<br/>
                <Box component="span" sx={{ fontSize: '0.65rem', fontWeight: 500 }}>1.5x+</Box>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', borderBottom: '2px solid #e2e8f0', bgcolor: '#f1f5f9' }}>
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row, idx) => (
              <TableRow 
                key={row.name}
                sx={{ 
                  '&:hover': { bgcolor: '#f8fafc' },
                  bgcolor: idx % 2 === 0 ? 'white' : '#fafafa'
                }}
              >
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b' }}>
                  {row.name}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  {row.threshold} {row.unit}
                </TableCell>
                <TableCell align="center">
                  {getSeverityChip(row.exceedances.moderate, 'moderate')}
                </TableCell>
                <TableCell align="center">
                  {getSeverityChip(row.exceedances.high, 'high')}
                </TableCell>
                <TableCell align="center">
                  {getSeverityChip(row.exceedances.veryHigh, 'veryHigh')}
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={row.exceedances.total}
                    size="small"
                    sx={{
                      bgcolor: row.exceedances.total > 0 ? '#e2e8f0' : 'transparent',
                      color: '#1e293b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      minWidth: 45,
                      height: 26
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            <TableRow sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                TOTAL
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                —
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#92400e' }}>
                  {totals.moderate}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#7c2d12' }}>
                  {totals.high}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#7f1d1d' }}>
                  {totals.veryHigh}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>
                  {totals.total}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}