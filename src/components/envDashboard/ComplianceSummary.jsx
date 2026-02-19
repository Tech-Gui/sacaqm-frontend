import { Grid, Box, Typography } from "@mui/material";

export default function ComplianceSummaryStrip({ compliant = 6, warnings = 2, nonCompliant = 1 }) {
  return (
    <Grid container spacing={3}>
      <Tile 
        color="#22c55e" 
        shadowColor="rgba(34, 197, 94, 0.25)"
        label="Compliant" 
        value={compliant} 
      />
      <Tile 
        color="#f59e0b" 
        shadowColor="rgba(245, 158, 11, 0.25)"
        label="Warnings" 
        value={warnings} 
      />
      <Tile 
        color="#ef4444" 
        shadowColor="rgba(239, 68, 68, 0.25)"
        label="Non-Compliant" 
        value={nonCompliant} 
      />
    </Grid>
  );
}

function Tile({ color, shadowColor, label, value }) {
  return (
    <Grid item xs={12} md={4}>
      <Box 
        sx={{
          bgcolor: color,
          borderRadius: 3, 
          p: 3, 
          textAlign: 'center',
          boxShadow: `0 4px 16px ${shadowColor}`,
          transition: 'all 0.3s ease',
          height: '100%',
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${shadowColor.replace('0.25', '0.35')}`
          }
        }}
      >
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 700, 
            color: 'white',
            fontSize: '3rem',
            lineHeight: 1,
            mb: 1
          }}
        >
          {value}
        </Typography>
        <Typography 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 600,
            fontSize: '1rem',
            letterSpacing: '0.5px'
          }}
        >
          {label}
        </Typography>
      </Box>
    </Grid>
  );
}