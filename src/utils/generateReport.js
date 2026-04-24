import jsPDF from "jspdf";

// ── Color palette ───────────────────────────────────────────────────────────
const COLORS = {
  Green: { r: 22, g: 163, b: 74 },
  Yellow: { r: 202, g: 138, b: 4 },
  Orange: { r: 234, g: 88, b: 28 },
  Red: { r: 220, g: 38, b: 38 },
  header: { r: 30, g: 41, b: 59 }, // dark slate
  subHeader: { r: 71, g: 85, b: 105 },
  lightBg: { r: 248, g: 250, b: 252 },
  white: { r: 255, g: 255, b: 255 },
  border: { r: 226, g: 232, b: 240 },
  accent: { r: 59, g: 130, b: 246 },
  purple: { r: 139, g: 92, b: 246 },
};

const STATUS_LABELS = { Green: "Compliant", Yellow: "Warning", Orange: "Elevated", Red: "Non-Compliant" };

// ── Severity thresholds (matching dashboard logic) ──────────────────────────
const SEVERITY_MULTIPLIERS = {
  moderate: { min: 1.0, max: 1.2, label: "Moderate", color: { r: 254, g: 243, b: 199 }, textColor: { r: 146, g: 64, b: 14 } },
  high: { min: 1.2, max: 1.5, label: "High", color: { r: 254, g: 215, b: 170 }, textColor: { r: 124, g: 45, b: 18 } },
  veryHigh: { min: 1.5, max: Infinity, label: "Very High", color: { r: 254, g: 226, b: 226 }, textColor: { r: 127, g: 29, b: 29 } },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function setColor(doc, c) { doc.setTextColor(c.r, c.g, c.b); }
function setFill(doc, c) { doc.setFillColor(c.r, c.g, c.b); }
function setDraw(doc, c) { doc.setDrawColor(c.r, c.g, c.b); }

function checkPageBreak(doc, y, needed = 30) {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawColorDot(doc, x, y, status) {
  const c = COLORS[status] || COLORS.subHeader;
  setFill(doc, c);
  doc.circle(x, y + 1.5, 2.5, "F");
}

function drawSparkline(doc, x, y, w, h, data, color, xLabels = []) {
  if (!data || data.length < 2) return;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pBottom = 5;
  const pLeft = 8;
  const graphX = x + pLeft;
  const graphY = y;
  const graphW = w - pLeft;
  const graphH = h - pBottom;
  
  const stepX = graphW / (data.length - 1);

  // Draw axes
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(graphX, graphY, graphX, graphY + graphH); // Y axis
  doc.line(graphX, graphY + graphH, graphX + graphW, graphY + graphH); // X axis

  // Y-axis labels
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(String(Math.round(max)), x, graphY + 2); // Max
  doc.text(String(Math.round(min)), x, graphY + graphH); // Min
  
  // X-axis labels
  if (xLabels && xLabels.length >= 2) {
    doc.text(xLabels[0], graphX, graphY + graphH + 4);
    doc.text(xLabels[xLabels.length - 1], graphX + graphW, graphY + graphH + 4, { align: "right" });
  }

  doc.setDrawColor(color.r, color.g, color.b);
  doc.setLineWidth(0.5);

  let prevX = graphX;
  let prevY = graphY + graphH - ((data[0] - min) / range) * graphH;

  for (let i = 1; i < data.length; i++) {
    const curX = graphX + i * stepX;
    const curY = graphY + graphH - ((data[i] - min) / range) * graphH;
    doc.line(prevX, prevY, curX, curY);
    prevX = curX;
    prevY = curY;
  }
}


// ── Main export ─────────────────────────────────────────────────────────────
export default async function generateReport({
  dashData, sensorId, dateLabel, startDate, endDate,
  thresholds, dailyThresholds, dailyExcData, sensorLabel,
  forecastData, showForecast, botpressAnalysis
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const D = dashData;
  if (!D) return;

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  // Header background band
  setFill(doc, COLORS.header);
  doc.rect(0, 0, pageW, 42, "F");

  // Accent stripe
  setFill(doc, COLORS.accent);
  doc.rect(0, 42, pageW, 2, "F");

  // Try to load SACAQM logo
  try {
    const logoModule = await import("../assets/sacaqm_logo.png");
    const logoUrl = logoModule.default || logoModule;
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = logoUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    doc.addImage(dataUrl, "PNG", margin, 6, 30, 30);
  } catch {
    // Fallback: text logo
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.white);
    doc.text("SACAQM", margin, 25);
  }

  // Title text
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.white);
  doc.text("Environmental Compliance Report", margin + 35, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Sensor: ${sensorLabel || sensorId}`, margin + 35, 23);
  doc.text(`Period: ${dateLabel} (${startDate} to ${endDate})`, margin + 35, 28);
  doc.text(`Generated: ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`, margin + 35, 33);

  y = 52;

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.header);
  doc.text("Executive Summary", margin, y);
  y += 2;

  // Underline
  setDraw(doc, COLORS.accent);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + contentW, y);
  y += 6;

  const summary = D.summary || { moderate: 0, high: 0, veryHigh: 0 };

  // Summary boxes
  const boxW = contentW / 3 - 4;
  const boxes = [
    { label: "Moderate Exceedances", value: `${summary.moderate}`, bg: SEVERITY_MULTIPLIERS.moderate.color, textObj: SEVERITY_MULTIPLIERS.moderate.textColor },
    { label: "High Exceedances", value: `${summary.high}`, bg: SEVERITY_MULTIPLIERS.high.color, textObj: SEVERITY_MULTIPLIERS.high.textColor },
    { label: "Very High Exceedances", value: `${summary.veryHigh}`, bg: SEVERITY_MULTIPLIERS.veryHigh.color, textObj: SEVERITY_MULTIPLIERS.veryHigh.textColor },
  ];

  boxes.forEach((box, i) => {
    const bx = margin + i * (boxW + 6);
    setFill(doc, box.bg);
    doc.roundedRect(bx, y, boxW, 18, 2, 2, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    setColor(doc, box.textObj);
    doc.text(box.value, bx + boxW / 2, y + 9, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(box.label, bx + boxW / 2, y + 15, { align: "center" });
  });

  y += 26;

  const totalHours = D.hourlyData?.length || 0;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor(doc, COLORS.subHeader);
  doc.text(`Based on ${totalHours} hourly data points. Exceedance severity is based on designated compliance parameter thresholds.`, margin, y);
  y += 8;

  // ═══════════════════════════════════════════════════════════════════════════
  // AI ENVIRONMENTAL REASONING (BOTPRESS)
  // ═══════════════════════════════════════════════════════════════════════════
  if (botpressAnalysis) {
    y = checkPageBreak(doc, y, 40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.header);
    doc.text("AI Environmental Reasoning", margin, y);
    y += 4;

    // Clean up Botpress payload to extract ONLY the analysis paragraph
    let paragraphs = botpressAnalysis.split('\n').map(p => p.trim()).filter(p => p.length > 0);

    // 1. Remove conversational footers and generic system introductions
    paragraphs = paragraphs.filter(p => {
      const lower = p.toLowerCase();
      return !lower.includes('choose an option below') &&
             !lower.includes('please let me know') &&
             !lower.includes('if you need further details') &&
             !lower.includes('strengths of the ai_r system') &&
             !lower.includes('ai_r makes air quality data') &&
             !lower.includes('public health, risk management, and governance') &&
             !lower.includes('the ai_r system, developed by') &&
             !lower.includes('south african consortium of air quality monitoring');
    });

    // Join remaining paragraphs
    let cleanedText = paragraphs.join('\n\n');

    // Fix Botpress garbled text: the bot inserts & or spaces between every letter for certain lines
    // Step 1: Strip all & characters (bot uses them as letter separators)
    cleanedText = cleanedText.replace(/&/g, '');
    
    // Step 2: Fix spaced-out words (bot sometimes uses spaces instead of &)
    cleanedText = cleanedText.replace(/A v e r a g e/ig, 'Average');
    cleanedText = cleanedText.replace(/T emp e r a t u r e/ig, 'Temperature');
    cleanedText = cleanedText.replace(/H um i d i t y/ig, 'Humidity');
    cleanedText = cleanedText.replace(/C O ‚ ?/ig, 'CO2');
    
    // Step 3: Fix CO2 after & stripping (bot uses ‚ low quote instead of 2)
    cleanedText = cleanedText.replace(/CO\s?[‚,]\s?:?/g, 'CO2:');
    
    // Step 4: Clean up formatting artifacts
    cleanedText = cleanedText.replace(/\/\s?°\s?C/g, '°C');    // Fix "/°C" or "/ ° C" → "°C" 
    cleanedText = cleanedText.replace(/\/\s?%/g, '%');           // Fix "/%" → "%"
    cleanedText = cleanedText.replace(/--/g, '-');               // Fix "--" → "-"
    cleanedText = cleanedText.replace(/  +/g, ' ');              // Collapse double spaces
    
    // Strip markdown asterisks but keep everything else intact
    cleanedText = cleanedText.replace(/\*/g, '').trim();

    if (cleanedText === '') {
      cleanedText = "No valid analysis could be extracted from Botpress.";
    }

    const splitBp = doc.splitTextToSize(cleanedText, contentW - margin * 2 - 6);
    const boxHeight = splitBp.length * 5 + 8;

    // Draw stylish highlight box
    doc.setFillColor(241, 245, 249); // slate 100
    doc.roundedRect(margin, y, contentW, boxHeight, 2, 2, "F");

    // Draw accent border on the left side
    doc.setFillColor(COLORS.purple.r, COLORS.purple.g, COLORS.purple.b);
    doc.roundedRect(margin, y, 3, boxHeight, 1, 1, "F");

    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    setColor(doc, { r: 51, g: 65, b: 85 }); // Slate 700 text color

    doc.text(splitBp, margin + 6, y);
    y += boxHeight;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE STATUS TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.header);
  doc.text("Parameter Compliance Status", margin, y);
  y += 2;
  setDraw(doc, COLORS.accent);
  doc.line(margin, y, margin + contentW, y);
  y += 4;

  // Table header
  const cols = [margin, margin + 35, margin + 65, margin + 95, margin + 125, margin + 155];
  const colLabels = ["Parameter", "Average", "Threshold", "Exceedances", "Status", "Rating"];

  setFill(doc, COLORS.header);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.white);
  colLabels.forEach((label, i) => doc.text(label, cols[i] + 2, y + 5.5));
  y += 10;

  // Table rows
  const table = D.table || [];
  table.forEach((row, idx) => {
    y = checkPageBreak(doc, y, 9);
    if (idx % 2 === 0) {
      setFill(doc, COLORS.lightBg);
      doc.rect(margin, y - 1, contentW, 8, "F");
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.header);
    doc.text(row.parameter, cols[0] + 2, y + 4.5);

    doc.setFont("helvetica", "normal");
    setColor(doc, COLORS.subHeader);

    // Find average for this parameter
    const paramFieldMap = {
      "PM1.0": "pm1p0", "PM2.5": "pm2p5", "PM4.0": "pm4p0", "PM10": "pm10p0",
      "Noise": "dba", "Humidity": "humidity", "CO2": "co2", "NOx": "nox", "VOC": "voc",
      "Temperature": "temperature",
    };
    const field = paramFieldMap[row.parameter];
    const hourly = D.hourlyData || [];
    const avg = field && hourly.length
      ? Math.round(hourly.reduce((s, d) => s + (d[field] || 0), 0) / hourly.length)
      : "—";

    doc.text(String(avg), cols[1] + 2, y + 4.5);

    // Threshold
    const thrMap = {
      "PM1.0": thresholds.pm1, "PM2.5": thresholds.pm25, "PM4.0": thresholds.pm5, "PM10": thresholds.pm10,
      "Noise": thresholds.noise, "Humidity": thresholds.humidity, "CO2": thresholds.co2,
      "NOx": thresholds.nox, "VOC": thresholds.voc, "Temperature": thresholds.temperature,
    };
    const thr = thrMap[row.parameter];
    doc.text(thr != null ? String(thr) : "N/A", cols[2] + 2, y + 4.5);

    // Exceedances
    doc.text(String(row.exceedances), cols[3] + 2, y + 4.5);

    // Status dot
    drawColorDot(doc, cols[4] + 5, y + 2.5, row.status);
    const statusC = COLORS[row.status] || COLORS.subHeader;
    setColor(doc, statusC);
    doc.setFont("helvetica", "bold");
    doc.text(row.status, cols[4] + 10, y + 4.5);

    // Rating
    const rating = STATUS_LABELS[row.status] || row.status;
    doc.text(rating, cols[5] + 2, y + 4.5);

    y += 8;
  });

  y += 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // PM DETAILED ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  y = checkPageBreak(doc, y, 50);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.header);
  doc.text("Particulate Matter (PM) Analysis", margin, y);
  y += 2;
  setDraw(doc, COLORS.accent);
  doc.line(margin, y, margin + contentW, y);
  y += 4;

  // PM table header
  const pmCols = [margin, margin + 28, margin + 48, margin + 68, margin + 92, margin + 118, margin + 148];
  const pmLabels = ["Pollutant", "Avg", "Min", "Max", "Daily Limit", "Exceed. Days", "Status"];

  setFill(doc, COLORS.header);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.white);
  pmLabels.forEach((label, i) => doc.text(label, pmCols[i] + 2, y + 5.5));
  y += 10;

  const pmKeys = [
    { key: "pm1", title: "PM1.0", field: "pm1p0" },
    { key: "pm25", title: "PM2.5", field: "pm2p5" },
    { key: "pm5", title: "PM4.0", field: "pm4p0" },
    { key: "pm10", title: "PM10", field: "pm10p0" },
  ];

  pmKeys.forEach((pm, idx) => {
    y = checkPageBreak(doc, y, 9);
    if (idx % 2 === 0) {
      setFill(doc, COLORS.lightBg);
      doc.rect(margin, y - 1, contentW, 8, "F");
    }

    const widget = D.pmData?.[pm.key];
    const excRow = (dailyExcData || []).find(d => d.key === pm.key);
    const hourly = D.hourlyData || [];
    const vals = hourly.map(d => d[pm.field] || 0);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const min = vals.length ? Math.round(Math.min(...vals)) : 0;
    const max = vals.length ? Math.round(Math.max(...vals)) : 0;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.header);
    doc.text(pm.title, pmCols[0] + 2, y + 4.5);

    doc.setFont("helvetica", "normal");
    setColor(doc, COLORS.subHeader);
    doc.text(`${avg} µg/m³`, pmCols[1] + 2, y + 4.5);
    doc.text(`${min}`, pmCols[2] + 2, y + 4.5);
    doc.text(`${max}`, pmCols[3] + 2, y + 4.5);
    doc.text(`${dailyThresholds?.[pm.key] || "—"} µg/m³`, pmCols[4] + 2, y + 4.5);

    if (excRow) {
      const excColor = excRow.exceedances > 0 ? COLORS.Red : COLORS.Green;
      setColor(doc, excColor);
      doc.setFont("helvetica", "bold");
      doc.text(`${excRow.exceedances} / ${excRow.total}`, pmCols[5] + 2, y + 4.5);
    } else {
      doc.text("—", pmCols[5] + 2, y + 4.5);
    }

    // Status
    const statusRow = (D.table || []).find(r => r.parameter === pm.title);
    const status = statusRow?.status || "—";
    drawColorDot(doc, pmCols[6] + 5, y + 2.5, status);
    const sc = COLORS[status] || COLORS.subHeader;
    setColor(doc, sc);
    doc.setFont("helvetica", "bold");
    doc.text(STATUS_LABELS[status] || status, pmCols[6] + 10, y + 4.5);

    y += 8;
  });

  y += 8;

  // ═══════════════════════════════════════════════════════════════════════════
  // ENVIRONMENTAL PARAMETERS
  // ═══════════════════════════════════════════════════════════════════════════
  y = checkPageBreak(doc, y, 50);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.header);
  doc.text("Environmental Parameters", margin, y);
  y += 2;
  setDraw(doc, COLORS.accent);
  doc.line(margin, y, margin + contentW, y);
  y += 4;

  const envParams = [
    { name: "Temperature", field: "temperature", unit: "°C", thr: thresholds.temperature },
    { name: "Humidity", field: "humidity", unit: "%", thr: thresholds.humidity },
    { name: "CO2", field: "co2", unit: "ppm", thr: thresholds.co2 },
    { name: "NOx", field: "nox", unit: "µg/m³", thr: thresholds.nox },
    { name: "VOC", field: "voc", unit: "index", thr: thresholds.voc },
  ];

  // Filter out params with no data
  const hourly = D.hourlyData || [];
  const activeEnv = envParams.filter(p => hourly.some(d => (d[p.field] || 0) > 0));

  const envCols = [margin, margin + 40, margin + 70, margin + 100, margin + 130, margin + 155];
  const envLabels = ["Parameter", "Average", "Min / Max", "Threshold", "Exceedances", "Status"];

  setFill(doc, COLORS.header);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.white);
  envLabels.forEach((l, i) => doc.text(l, envCols[i] + 2, y + 5.5));
  y += 10;

  activeEnv.forEach((param, idx) => {
    y = checkPageBreak(doc, y, 9);
    if (idx % 2 === 0) {
      setFill(doc, COLORS.lightBg);
      doc.rect(margin, y - 1, contentW, 8, "F");
    }

    const vals = hourly.map(d => d[param.field] || 0).filter(v => v > 0);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const min = vals.length ? Math.round(Math.min(...vals)) : 0;
    const max = vals.length ? Math.round(Math.max(...vals)) : 0;
    const excCount = param.thr != null ? vals.filter(v => v > param.thr).length : "N/A";

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.header);
    doc.text(param.name, envCols[0] + 2, y + 4.5);

    doc.setFont("helvetica", "normal");
    setColor(doc, COLORS.subHeader);
    doc.text(`${avg} ${param.unit}`, envCols[1] + 2, y + 4.5);
    doc.text(`${min} / ${max}`, envCols[2] + 2, y + 4.5);
    doc.text(param.thr != null ? `${param.thr} ${param.unit}` : "N/A", envCols[3] + 2, y + 4.5);
    doc.text(String(excCount), envCols[4] + 2, y + 4.5);

    const statusRow = (D.table || []).find(r => r.parameter === param.name);
    const status = statusRow?.status || "—";
    drawColorDot(doc, envCols[5] + 5, y + 2.5, status);
    const sc = COLORS[status] || COLORS.subHeader;
    setColor(doc, sc);
    doc.setFont("helvetica", "bold");
    doc.text(STATUS_LABELS[status] || status, envCols[5] + 10, y + 4.5);

    y += 8;
  });

  // ── Noise section (if applicable) ─────────────────────────────────────────
  if (D.hasNoise) {
    y += 4;
    y = checkPageBreak(doc, y, 12);

    const noiseVals = hourly.map(d => d.dba || 0).filter(v => v > 0);
    const noiseAvg = noiseVals.length ? Math.round(noiseVals.reduce((a, b) => a + b, 0) / noiseVals.length) : 0;
    const noiseExc = noiseVals.filter(v => v > thresholds.noise).length;

    setFill(doc, { r: 254, g: 243, b: 199 });
    doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(doc, { r: 146, g: 64, b: 14 });
    doc.text(`Noise: Avg ${noiseAvg} dBA | Threshold: ${thresholds.noise} dBA | Exceedances: ${noiseExc} hours`, margin + 4, y + 6.5);
    y += 14;
  }

  y += 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // HOURLY TREND CHARTS
  // ═══════════════════════════════════════════════════════════════════════════
  if (hourly && hourly.length > 0) {
    y = checkPageBreak(doc, y, 40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.header);
    doc.text("Hourly Trend Charts", margin, y);
    y += 2;
    setDraw(doc, COLORS.accent);
    doc.line(margin, y, margin + contentW, y);
    y += 6;

    const chartW = (contentW - 10) / 3;
    const chartH = 20;
    const padding = 2;

    const allChartParams = [
      { name: "PM1.0", field: "pm1p0" },
      { name: "PM2.5", field: "pm2p5" },
      { name: "PM4.0", field: "pm4p0" },
      { name: "PM10", field: "pm10p0" },
      { name: "Temperature", field: "temperature" },
      { name: "Humidity", field: "humidity" },
      { name: "CO2", field: "co2" },
      { name: "NOx", field: "nox" },
      { name: "VOC", field: "voc" }
    ];
    if (D.hasNoise) allChartParams.push({ name: "Noise", field: "dba" });

    // Filter out param if no data exists
    const validParams = allChartParams.filter(cp => hourly.some(d => (d[cp.field]||0) > 0));

    const formatAxisLabel = (ts) => {
      if (!ts) return "";
      const d = new Date(ts);
      const h = d.getHours() % 12 || 12;
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      return `${d.getMonth() + 1}/${d.getDate()} ${h}${ampm}`;
    };

    let xLabels = [];
    if (hourly.length >= 2) {
      xLabels = [formatAxisLabel(hourly[0].timestamp), formatAxisLabel(hourly[hourly.length - 1].timestamp)];
    }

    validParams.forEach((cp, i) => {
      // Row wrap every 3 items
      if (i > 0 && i % 3 === 0) {
        y += chartH + 12;
        y = checkPageBreak(doc, y, chartH + 15);
      }
      
      const col = i % 3;
      const cx = margin + col * (chartW + 5);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setColor(doc, COLORS.header);
      doc.text(`${cp.name}`, cx, y + 2);

      setFill(doc, COLORS.lightBg);
      doc.roundedRect(cx, y + 4, chartW, chartH, 1, 1, "F");
      setDraw(doc, COLORS.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(cx, y + 4, chartW, chartH, 1, 1, "S");

      const plotData = hourly.map(d => d[cp.field] || 0);
      drawSparkline(doc, cx + padding, y + 4 + padding, chartW - padding * 2, chartH - padding * 2, plotData, COLORS.accent, xLabels);
    });

    y += chartH + 12;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEEDANCE SEVERITY BREAKDOWN
  // ═══════════════════════════════════════════════════════════════════════════
  y = checkPageBreak(doc, y, 60);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  setColor(doc, COLORS.header);
  doc.text("Exceedance Severity Breakdown", margin, y);
  y += 2;
  setDraw(doc, COLORS.accent);
  doc.line(margin, y, margin + contentW, y);
  y += 4;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor(doc, COLORS.subHeader);
  const excDesc = "Exceedances are periods where measured parameter levels surpassed established safety thresholds. Consistent or highly severe exceedances pose environmental and health risks, suggesting a need for potential mitigative actions.";
  const splitDesc = doc.splitTextToSize(excDesc, contentW);
  doc.text(splitDesc, margin, y + 2);
  y += splitDesc.length * 4 + 4;

  // For each severity level, compute counts
  const paramFields = [
    { name: "PM1.0", field: "pm1p0", thr: thresholds.pm1 },
    { name: "PM2.5", field: "pm2p5", thr: thresholds.pm25 },
    { name: "PM4.0", field: "pm4p0", thr: thresholds.pm5 },
    { name: "PM10", field: "pm10p0", thr: thresholds.pm10 },
    { name: "Humidity", field: "humidity", thr: thresholds.humidity },
    { name: "CO2", field: "co2", thr: thresholds.co2 },
  ].filter(p => p.thr != null);

  if (D.hasNoise) paramFields.push({ name: "Noise", field: "dba", thr: thresholds.noise });

  Object.entries(SEVERITY_MULTIPLIERS).forEach(([sevKey, sev]) => {
    y = checkPageBreak(doc, y, 20 + paramFields.length * 7);

    // Severity header bar
    setFill(doc, sev.color);
    doc.roundedRect(margin, y, contentW, 7, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(doc, sev.textColor);
    doc.text(`${sev.label} Severity`, margin + 4, y + 5);
    y += 9;

    paramFields.forEach((param, idx) => {
      y = checkPageBreak(doc, y, 8);
      if (idx % 2 === 0) {
        setFill(doc, COLORS.lightBg);
        doc.rect(margin, y - 1, contentW, 7, "F");
      }

      const exceedances = hourly.filter(d => {
        const v = d[param.field] || 0;
        return v > param.thr * sev.min && (sev.max === Infinity || v <= param.thr * sev.max);
      }).length;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      setColor(doc, COLORS.header);
      doc.text(param.name, margin + 4, y + 4);

      // Mini bar
      const barMaxW = 60;
      const barH = 3.5;
      const barX = margin + 45;
      const maxExc = hourly.length || 1;
      const barW = Math.max(1, (exceedances / maxExc) * barMaxW);

      setFill(doc, COLORS.border);
      doc.roundedRect(barX, y + 0.5, barMaxW, barH, 1, 1, "F");
      if (exceedances > 0) {
        setFill(doc, sev.textColor);
        doc.roundedRect(barX, y + 0.5, barW, barH, 1, 1, "F");
      }

      const excColor = exceedances > 0 ? sev.textColor : COLORS.Green;
      setColor(doc, excColor);
      doc.setFont("helvetica", "bold");
      doc.text(`${exceedances} hrs`, barX + barMaxW + 4, y + 4);

      y += 7;
    });

    y += 4;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FORECAST SECTION (if active)
  // ═══════════════════════════════════════════════════════════════════════════
  if (showForecast && forecastData) {
    y += 4;
    y = checkPageBreak(doc, y, 50);

    // Purple accent band
    setFill(doc, COLORS.purple);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.white);
    doc.text("AI Forecast — Next 24 Hours", margin + 4, y + 5.5);
    y += 12;

    const fHourly = forecastData.hourlyData || [];
    const fcParams = [
      { name: "PM1.0", field: "pm1p0", unit: "µg/m³" },
      { name: "PM2.5", field: "pm2p5", unit: "µg/m³" },
      { name: "PM4.0", field: "pm4p0", unit: "µg/m³" },
      { name: "PM10", field: "pm10p0", unit: "µg/m³" },
      { name: "Temperature", field: "temperature", unit: "°C" },
      { name: "Humidity", field: "humidity", unit: "%" },
    ];

    const fcCols = [margin, margin + 45, margin + 80, margin + 115];
    const fcLabels = ["Parameter", "Predicted Avg", "Predicted Min", "Predicted Max"];

    setFill(doc, { r: 109, g: 40, b: 217 });
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(doc, COLORS.white);
    fcLabels.forEach((l, i) => doc.text(l, fcCols[i] + 2, y + 5.5));
    y += 10;

    fcParams.forEach((param, idx) => {
      y = checkPageBreak(doc, y, 9);
      if (idx % 2 === 0) {
        setFill(doc, { r: 245, g: 243, b: 255 });
        doc.rect(margin, y - 1, contentW, 8, "F");
      }

      const vals = fHourly.map(d => d[param.field] || 0);
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      const min = vals.length ? Math.round(Math.min(...vals)) : 0;
      const max = vals.length ? Math.round(Math.max(...vals)) : 0;

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      setColor(doc, COLORS.header);
      doc.text(param.name, fcCols[0] + 2, y + 4.5);

      doc.setFont("helvetica", "normal");
      setColor(doc, COLORS.subHeader);
      doc.text(`${avg} ${param.unit}`, fcCols[1] + 2, y + 4.5);
      doc.text(`${min} ${param.unit}`, fcCols[2] + 2, y + 4.5);
      doc.text(`${max} ${param.unit}`, fcCols[3] + 2, y + 4.5);

      y += 8;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER on every page
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, 285, margin + contentW, 285);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    setColor(doc, COLORS.subHeader);
    doc.text("Report auto-generated by SACAQM Environmental Compliance Dashboard", margin, 290);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, 290, { align: "right" });
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const filename = `SACAQM_Report_${sensorId}_${startDate}_to_${endDate}.pdf`;
  doc.save(filename);
}
