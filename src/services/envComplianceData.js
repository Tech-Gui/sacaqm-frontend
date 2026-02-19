// src/services/envComplianceData.js
import axios from "axios";

// Ensure axios is initialized (your existing axiosInit sets defaults)
// The axios instance is already configured in your app

// Format date helper
function formatDate(dateObj) {
  return (
    dateObj.getFullYear() +
    "-" +
    (dateObj.getMonth() + 1 < 10 ? "0" : "") +
    (dateObj.getMonth() + 1) +
    "-" +
    (dateObj.getDate() < 10 ? "0" : "") +
    dateObj.getDate()
  );
}

// Calculate trend percentage
const calculateTrend = (currentData, previousData) => {
  if (!previousData || previousData.length === 0) return 0;
  
  const currentAvg = currentData.reduce((sum, val) => sum + val, 0) / currentData.length;
  const previousAvg = previousData.reduce((sum, val) => sum + val, 0) / previousData.length;
  
  if (previousAvg === 0) return 0;
  
  return Math.round(((currentAvg - previousAvg) / previousAvg) * 100);
};

// Get previous period dates for trend calculation
const getPreviousPeriod = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays);
  
  return {
    start: formatDate(prevStart),
    end: formatDate(prevEnd)
  };
};

/**
 * Main function to get Environmental Compliance Dashboard data
 * @param {string} sensorId - Sensor ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} resolutionParam - 'hourly', 'daily', or 'weekly'
 * @returns {Promise} Formatted dashboard data
 */
export async function getEnvComplianceData(sensorId, startDate, endDate, resolutionParam = 'daily') {
  try {
    // Fetch current period data
    const currentResponse = await axios.get('/nodedata/aggregated', {
      params: {
        sensor_id: sensorId,
        start: startDate,
        end: endDate,
        resolution: resolutionParam
      }
    });
    
    const currentData = currentResponse.data;
    
    // Fetch previous period data for trend
    const previousPeriod = getPreviousPeriod(startDate, endDate);
    const previousResponse = await axios.get('/nodedata/aggregated', {
      params: {
        sensor_id: sensorId,
        start: previousPeriod.start,
        end: previousPeriod.end,
        resolution: resolutionParam
      }
    });
    
    const previousData = previousResponse.data;
    
    // Fetch min/max data for each parameter
    const minMaxPromises = [
      axios.get('/nodedata/daily-trend-minmax', {
        params: { sensor_id: sensorId, start: startDate, end: endDate, field: 'pm1p0' }
      }),
      axios.get('/nodedata/daily-trend-minmax', {
        params: { sensor_id: sensorId, start: startDate, end: endDate, field: 'pm2p5' }
      }),
      axios.get('/nodedata/daily-trend-minmax', {
        params: { sensor_id: sensorId, start: startDate, end: endDate, field: 'pm4p0' }
      }),
      axios.get('/nodedata/daily-trend-minmax', {
        params: { sensor_id: sensorId, start: startDate, end: endDate, field: 'pm10p0' }
      }),
      axios.get('/nodedata/daily-trend-minmax', {
        params: { sensor_id: sensorId, start: startDate, end: endDate, field: 'dba' }
      }),
      axios.get('/nodedata/daily-trend-minmax', {
        params: { sensor_id: sensorId, start: startDate, end: endDate, field: 'temperature' }
      })
    ];
    
    const [pm1MinMax, pm25MinMax, pm4MinMax, pm10MinMax, noiseMinMax, tempMinMax] = 
      await Promise.all(minMaxPromises);
    
    // Format chart labels
    const labels = currentData.map(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Format PM Data
    const pmData = {
      pm1: {
        title: "PM1.0 - Daily Average",
        colorType: "orange",
        labels: labels,
        values: currentData.map(d => Math.round(d.pm1p0 || 0)),
        current: Math.round(currentData.reduce((sum, d) => sum + (d.pm1p0 || 0), 0) / currentData.length),
        previous: Math.round(previousData.reduce((sum, d) => sum + (d.pm1p0 || 0), 0) / (previousData.length || 1)),
        trend: calculateTrend(
          currentData.map(d => d.pm1p0 || 0),
          previousData.map(d => d.pm1p0 || 0)
        ),
        min: Math.round(Math.min(...pm1MinMax.data.map(d => d.min))),
        max: Math.round(Math.max(...pm1MinMax.data.map(d => d.max)))
      },
      pm25: {
        title: "PM2.5 - Daily Average",
        colorType: "green",
        labels: labels,
        values: currentData.map(d => Math.round(d.pm2p5 || 0)),
        current: Math.round(currentData.reduce((sum, d) => sum + (d.pm2p5 || 0), 0) / currentData.length),
        previous: Math.round(previousData.reduce((sum, d) => sum + (d.pm2p5 || 0), 0) / (previousData.length || 1)),
        trend: calculateTrend(
          currentData.map(d => d.pm2p5 || 0),
          previousData.map(d => d.pm2p5 || 0)
        ),
        min: Math.round(Math.min(...pm25MinMax.data.map(d => d.min))),
        max: Math.round(Math.max(...pm25MinMax.data.map(d => d.max)))
      },
      pm5: {
        title: "PM5 - Daily Average",
        colorType: "yellow",
        labels: labels,
        values: currentData.map(d => Math.round(d.pm4p0 || 0)),
        current: Math.round(currentData.reduce((sum, d) => sum + (d.pm4p0 || 0), 0) / currentData.length),
        previous: Math.round(previousData.reduce((sum, d) => sum + (d.pm4p0 || 0), 0) / (previousData.length || 1)),
        trend: calculateTrend(
          currentData.map(d => d.pm4p0 || 0),
          previousData.map(d => d.pm4p0 || 0)
        ),
        min: Math.round(Math.min(...pm4MinMax.data.map(d => d.min))),
        max: Math.round(Math.max(...pm4MinMax.data.map(d => d.max)))
      },
      pm10: {
        title: "PM10 - Daily Average",
        colorType: "red",
        labels: labels,
        values: currentData.map(d => Math.round(d.pm10p0 || 0)),
        current: Math.round(currentData.reduce((sum, d) => sum + (d.pm10p0 || 0), 0) / currentData.length),
        previous: Math.round(previousData.reduce((sum, d) => sum + (d.pm10p0 || 0), 0) / (previousData.length || 1)),
        trend: calculateTrend(
          currentData.map(d => d.pm10p0 || 0),
          previousData.map(d => d.pm10p0 || 0)
        ),
        min: Math.round(Math.min(...pm10MinMax.data.map(d => d.min))),
        max: Math.round(Math.max(...pm10MinMax.data.map(d => d.max)))
      }
    };
    
    // Format Noise Data
    const noiseData = {
      current: Math.round(currentData.reduce((sum, d) => sum + (d.dba || 0), 0) / currentData.length),
      labels: labels,
      values: currentData.map(d => Math.round(d.dba || 0))
    };
    
    // Format Temperature Data
    const temperatureData = {
      labels: labels,
      values: currentData.map(d => Math.round(d.temperature || 0)),
      current: Math.round(currentData.reduce((sum, d) => sum + (d.temperature || 0), 0) / currentData.length),
      previous: Math.round(previousData.reduce((sum, d) => sum + (d.temperature || 0), 0) / (previousData.length || 1)),
      trend: calculateTrend(
        currentData.map(d => d.temperature || 0),
        previousData.map(d => d.temperature || 0)
      )
    };
    
    // Calculate Compliance
    const thresholds = {
      pm1: 50,
      pm25: 60,
      pm5: 75,
      pm10: 100,
      noise: 70,
      temperature: 32
    };
    
    const getComplianceStatus = (average, threshold) => {
      if (average <= threshold) return 'Green';
      if (average <= threshold * 1.2) return 'Amber';
      return 'Red';
    };
    
    const complianceStatuses = {
      pm1: getComplianceStatus(pmData.pm1.current, thresholds.pm1),
      pm25: getComplianceStatus(pmData.pm25.current, thresholds.pm25),
      pm5: getComplianceStatus(pmData.pm5.current, thresholds.pm5),
      pm10: getComplianceStatus(pmData.pm10.current, thresholds.pm10),
      noise: getComplianceStatus(noiseData.current, thresholds.noise),
      temp: getComplianceStatus(temperatureData.current, thresholds.temperature)
    };
    
    const complianceSummary = {
      compliant: Object.values(complianceStatuses).filter(s => s === 'Green').length,
      warnings: Object.values(complianceStatuses).filter(s => s === 'Amber').length,
      nonCompliant: Object.values(complianceStatuses).filter(s => s === 'Red').length
    };
    
    // Compliance Table
    const complianceTable = [
      {
        parameter: "PM1.0",
        status: complianceStatuses.pm1,
        exceedances: currentData.filter(d => (d.pm1p0 || 0) > thresholds.pm1).length
      },
      {
        parameter: "PM2.5",
        status: complianceStatuses.pm25,
        exceedances: currentData.filter(d => (d.pm2p5 || 0) > thresholds.pm25).length
      },
      {
        parameter: "PM5",
        status: complianceStatuses.pm5,
        exceedances: currentData.filter(d => (d.pm4p0 || 0) > thresholds.pm5).length
      },
      {
        parameter: "PM10",
        status: complianceStatuses.pm10,
        exceedances: currentData.filter(d => (d.pm10p0 || 0) > thresholds.pm10).length
      },
      {
        parameter: "Noise",
        status: complianceStatuses.noise,
        exceedances: currentData.filter(d => (d.dba || 0) > thresholds.noise).length
      },
      {
        parameter: "Temp",
        status: complianceStatuses.temp,
        exceedances: currentData.filter(d => (d.temperature || 0) > thresholds.temperature).length
      }
    ];
    
    return {
      pmData,
      noiseData,
      temperatureData,
      complianceSummary,
      complianceTable,
      thresholds
    };
    
  } catch (error) {
    console.error('Error fetching environmental compliance data:', error);
    throw error;
  }
}

/**
 * Get list of sensors
 * @returns {Promise} List of sensors
 */
export async function getSensorsList() {
  try {
    // Try to get from your existing endpoint
    const response = await axios.get('/sensors');
    return response.data;
  } catch (error) {
    console.error('Error fetching sensors:', error);
    
    // Fallback: Get distinct sensor_ids from nodedata
    try {
      const response = await axios.get('/nodedata/sensors');
      return response.data;
    } catch (err) {
      // If all fails, return empty array
      console.error('Error fetching sensors from fallback:', err);
      return [];
    }
  }
}

/**
 * Get customers list
 * @returns {Promise} List of customers
 */
export async function getCustomersList() {
  try {
    const response = await axios.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Return empty array if endpoint doesn't exist yet
    return [];
  }
}