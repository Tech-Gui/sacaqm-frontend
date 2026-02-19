import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, TableContainer } from "@mui/material";

export default function ComplianceTable({ data = [] }) {

  const rows = data.length > 0 ? data : [
    { parameter: "PM1.0", status: "Green", exceedances: 0 },
    { parameter: "PM2.5", status: "Green", exceedances: 0 },
    { parameter: "PM5", status: "Amber", exceedances: 2 },
    { parameter: "PM10", status: "Red", exceedances: 1 },
    { parameter: "Noise", status: "Green", exceedances: 0 },
    { parameter: "Temp", status: "Green", exceedances: 0 },
  ];

  const getStatusChip = (status) => {
    const statusConfig = {
      Green: { bgcolor: '#dcfce7', color: '#16a34a' },
      Amber: { bgcolor: '#fef3c7', color: '#d97706' },
      Red: { bgcolor: '#fee2e2', color: '#dc2626' }
    };

    const config = statusConfig[status] || statusConfig.Green;

    return (
      <Chip 
        label={status} 
        size="small"
        sx={{ 
          bgcolor: config.bgcolor,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          minWidth: 80,
          borderRadius: 2
        }} 
      />
    );
  };

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell 
              sx={{ 
                fontWeight: 700, 
                color: '#475569',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: '2px solid #e2e8f0',
                py: 2
              }}
            >
              Parameter
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 700, 
                color: '#475569',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: '2px solid #e2e8f0',
                py: 2
              }}
            >
              Status
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: 700, 
                color: '#475569',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: '2px solid #e2e8f0',
                py: 2
              }}
            >
              Exceedances
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow 
              key={row.parameter}
              sx={{ 
                '&:hover': { bgcolor: '#f8fafc' },
                transition: 'background-color 0.2s ease'
              }}
            >
              <TableCell 
                sx={{ 
                  fontWeight: 500,
                  color: '#1e293b',
                  fontSize: '0.9rem',
                  py: 1.5
                }}
              >
                {row.parameter}
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                {getStatusChip(row.status)}
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  color: '#475569',
                  fontSize: '0.9rem',
                  py: 1.5
                }}
              >
                {row.exceedances}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}