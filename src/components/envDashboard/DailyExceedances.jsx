import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export default function DailyExceedancesTable({ data = {}, isForecast = false }) {

  const rows = [
    { name: "PM1.0", value: data.pm1 || 0, threshold: 40 },
    { name: "PM2.5", value: data.pm25 || 0, threshold: 40 },
    { name: "PM4.0", value: data.pm5 || 0, threshold: 40 },
    { name: "PM10", value: data.pm10 || 0, threshold: 75 },
  ];

  const total = rows.reduce((acc, r) => acc + r.value, 0);

  const getChip = (val) => {
    if (val === 0) return <Box sx={{ color: '#94a3b8' }}>—</Box>;

    return (
      <Chip
        label={val}
        size="small"
        sx={{
          bgcolor: '#fee2e2',
          color: '#7f1d1d',
          fontWeight: 700,
          fontSize: '0.75rem',
          minWidth: 45,
          height: 26
        }}
      />
    );
  };

  return (
    <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', p: 3 }}>
      
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>
        Daily Exceedances{isForecast ? ' (Forecast)' : ''}
      </Typography>

      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 2 }}>
        Number of days exceeding daily limits
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Parameter</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Threshold</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Days Exceeded</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={row.name} sx={{ bgcolor: idx % 2 ? '#fafafa' : 'white' }}>
                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                <TableCell align="center">{row.threshold} µg/m³</TableCell>
                <TableCell align="center">{getChip(row.value)}</TableCell>
              </TableRow>
            ))}

            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
              <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800 }}>{total}</Typography>
              </TableCell>
            </TableRow>

          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}