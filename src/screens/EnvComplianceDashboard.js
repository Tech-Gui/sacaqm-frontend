// import React, { useState, useEffect, useContext } from "react";
// import {
//   FormControl, Select, MenuItem, InputLabel, Button, Popover,
//   TextField, CircularProgress, Alert
// } from "@mui/material";
// import { Grid, Box, Typography, Paper, Container } from "@mui/material";
// import axios from "axios";
// import sacaqmLogo from '../assets/sacaqm_logo.png';
// import airsynqLogo from '../assets/airsynq.png';
// import { StationContext } from "../contextProviders/StationContext";
// import PMWidget from "../components/envDashboard/PMWidget";
// import NoiseGauge from "../components/envDashboard/NoiseGauge";
// import NoiseWidget from "../components/envDashboard/NoiseWidget";
// import TempWidget from "../components/envDashboard/TempWidget";
// import ParameterWidget from "../components/envDashboard/ParameterWidget";
// import ExceedancesOverTimeChart from "../components/envDashboard/ExceedancesOverTimeChart";
// import ExceedancesTable from "../components/envDashboard/ExceedancesTable";
// import ExceedancesSeverityChart from "../components/envDashboard/ExceedancesSeverityChart";
// import StationMap from "../components/envDashboard/StationMap";

// const BASE = process.env.REACT_APP_API_BASE;

// // Forecast week labels — computed once at module load, never change
// const _tom = (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0); return d; })();
// const FORECAST_LABELS = Array.from({ length: 7 }, (_, i) => {
//   const d = new Date(_tom); d.setDate(_tom.getDate() + i);
//   return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
// });
// const FORECAST_WEEK_RANGE = `${FORECAST_LABELS[0]} – ${FORECAST_LABELS[6]}`;

// function formatDate(d) {
//   return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
// }
// function calcTrend(curr, prev) {
//   if (!prev?.length) return 0;
//   const ca=curr.reduce((s,v)=>s+v,0)/curr.length, pa=prev.reduce((s,v)=>s+v,0)/prev.length;
//   return pa===0?0:Math.round(((ca-pa)/pa)*100);
// }
// function getPrevPeriod(start, end) {
//   const s=new Date(start), e=new Date(end), days=Math.ceil(Math.abs(e-s)/86400000);
//   const pe=new Date(s); pe.setDate(pe.getDate()-1);
//   const ps=new Date(pe); ps.setDate(ps.getDate()-days);
//   return { start:formatDate(ps), end:formatDate(pe) };
// }
// const AQI_BANDS = {
//   pm25:[{max:103,status:"Green"},{max:128,status:"Yellow"},{max:178,status:"Orange"},{max:Infinity,status:"Red"}],
//   pm10:[{max:190,status:"Green"},{max:240,status:"Yellow"},{max:290,status:"Orange"},{max:Infinity,status:"Red"}],
//   noise:[{max:70,status:"Green"},{max:90,status:"Yellow"},{max:120,status:"Orange"},{max:Infinity,status:"Red"}],
// };
// function statusFor(val, thr, key) {
//   if (thr==null) return "—";
//   const bands=AQI_BANDS[key];
//   if (bands) { for (const b of bands) if (val<=b.max) return b.status; }
//   if (val<=thr) return "Green"; if (val<=thr*1.2) return "Yellow"; if (val<=thr*1.5) return "Orange"; return "Red";
// }
// const avgF = (arr,key) => arr.length?Math.round(arr.reduce((s,d)=>s+(d[key]||0),0)/arr.length):0;
// const sMin  = (arr) => arr?.length?Math.round(Math.min(...arr.map(d=>d.min??0))):0;
// const sMax  = (arr) => arr?.length?Math.round(Math.max(...arr.map(d=>d.max??0))):0;

// const THRESHOLDS = { pm1:103, pm25:103, pm5:103, pm10:190, noise:70, temperature:32, humidity:80, co2:1000, nox:null, voc:null };

// // Remap widget labels to FORECAST_LABELS, keep last 7 values
// function toForecastWidget(w) {
//   if (!w) return null;
//   const v = w.values.length >= 7 ? w.values.slice(-7) : [...Array(7-w.values.length).fill(w.values[0]??0), ...w.values];
//   return { ...w, labels: FORECAST_LABELS, values: v };
// }

// const filterBarSx = {
//   background:'rgba(255,255,255,0.7)', backdropFilter:'blur(20px) saturate(180%)',
//   border:'1px solid rgba(59,130,246,0.2)', p:3, borderRadius:4, mb:3,
//   boxShadow:'0 8px 32px rgba(59,130,246,0.1)', position:'relative', zIndex:10, overflow:'hidden',
//   '&::after':{content:'""',position:'absolute',bottom:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#3b82f6,#6366f1,#0ea5e9)'},
// };
// const selectSx = {
//   bgcolor:"white", borderRadius:2.5,
//   "& .MuiOutlinedInput-notchedOutline":{borderColor:"rgba(59,130,246,0.2)",borderWidth:2},
//   "&:hover .MuiOutlinedInput-notchedOutline":{borderColor:"#3b82f6"},
//   "&.Mui-focused .MuiOutlinedInput-notchedOutline":{borderColor:"#3b82f6",borderWidth:2},
//   fontSize:"0.95rem", fontWeight:500, boxShadow:"0 2px 8px rgba(59,130,246,0.08)",
//   "&:hover":{boxShadow:"0 4px 12px rgba(59,130,246,0.15)"},
// };
// const presetSx = {
//   px:2, py:0.5, fontSize:"0.75rem", fontWeight:600, textTransform:"none",
//   borderRadius:2, border:"2px solid transparent", bgcolor:"rgba(59,130,246,0.1)", color:"#3b82f6",
//   "&:hover":{bgcolor:"#3b82f6",color:"white"},
// };
// const labelSx = {fontSize:"0.75rem",fontWeight:700,color:"#64748b",letterSpacing:"0.5px",textTransform:"uppercase"};
// const fadeIn = (d) => ({
//   animation:`fadeInUp 0.6s ease-out ${d}s`, animationFillMode:"backwards",
//   "@keyframes fadeInUp":{from:{opacity:0,transform:"translateY(30px)"},to:{opacity:1,transform:"translateY(0)"}},
// });

// // Build widget objects from API response arrays
// function buildWidgets(curr, prevData, labels, mm1, mm25, mm4, mm10) {
//   const pmData = {
//     pm1: {title:"PM1.0",labels,values:curr.map(d=>Math.round(d.pm1p0 ||0)),current:avgF(curr,"pm1p0"), trend:calcTrend(curr.map(d=>d.pm1p0 ||0),prevData.map(d=>d.pm1p0 ||0)),min:sMin(mm1), max:sMax(mm1) },
//     pm25:{title:"PM2.5",labels,values:curr.map(d=>Math.round(d.pm2p5 ||0)),current:avgF(curr,"pm2p5"), trend:calcTrend(curr.map(d=>d.pm2p5 ||0),prevData.map(d=>d.pm2p5 ||0)),min:sMin(mm25),max:sMax(mm25)},
//     pm5: {title:"PM4.0",labels,values:curr.map(d=>Math.round(d.pm4p0 ||0)),current:avgF(curr,"pm4p0"), trend:calcTrend(curr.map(d=>d.pm4p0 ||0),prevData.map(d=>d.pm4p0 ||0)),min:sMin(mm4), max:sMax(mm4) },
//     pm10:{title:"PM10", labels,values:curr.map(d=>Math.round(d.pm10p0||0)),current:avgF(curr,"pm10p0"),trend:calcTrend(curr.map(d=>d.pm10p0||0),prevData.map(d=>d.pm10p0||0)),min:sMin(mm10),max:sMax(mm10)},
//   };
//   return {
//     pmData,
//     noiseData:    {labels,values:curr.map(d=>Math.round(d.dba         ||0)),current:avgF(curr,"dba")        },
//     tempData:     {labels,values:curr.map(d=>Math.round(d.temperature ||0)),current:avgF(curr,"temperature"),trend:calcTrend(curr.map(d=>d.temperature||0),prevData.map(d=>d.temperature||0))},
//     humidityData: {labels,values:curr.map(d=>Math.round(d.humidity    ||0)),current:avgF(curr,"humidity"),   trend:calcTrend(curr.map(d=>d.humidity   ||0),prevData.map(d=>d.humidity   ||0))},
//     co2Data:      {labels,values:curr.map(d=>Math.round(d.co2         ||0)),current:avgF(curr,"co2"),        trend:calcTrend(curr.map(d=>d.co2        ||0),prevData.map(d=>d.co2        ||0))},
//     noxData:      {labels,values:curr.map(d=>Math.round(d.nox         ||0)),current:avgF(curr,"nox"),        trend:calcTrend(curr.map(d=>d.nox        ||0),prevData.map(d=>d.nox        ||0))},
//     vocData:      {labels,values:curr.map(d=>Math.round(d.voc         ||0)),current:avgF(curr,"voc"),        trend:calcTrend(curr.map(d=>d.voc        ||0),prevData.map(d=>d.voc        ||0))},
//   };
// }

// export default function EnvComplianceDashboard() {
//   const { stations, loading: stationsLoading } = useContext(StationContext);

//   const [sensorId,        setSensorId]        = useState("");
//   const [startDate,       setStartDate]       = useState(() => { const d=new Date(); d.setDate(d.getDate()-7); return formatDate(d); });
//   const [endDate,         setEndDate]         = useState(() => formatDate(new Date()));
//   const [dateLabel,       setDateLabel]       = useState(() => {
//     const d=new Date(), s=new Date(d); s.setDate(d.getDate()-7);
//     return `${s.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${d.toLocaleDateString("en-US",{month:"short",day:"numeric"})}, ${d.getFullYear()}`;
//   });
//   const [resolution,      setResolution]      = useState("daily");
//   const [dashData,        setDashData]        = useState(null);
//   const [loading,         setLoading]         = useState(false);
//   const [error,           setError]           = useState(null);
//   const [anchor,          setAnchor]          = useState(null);
//   const [showForecast,    setShowForecast]    = useState(false);
//   const [downloadLoading, setDownloadLoading] = useState(false);
//   const [realtimeNoise,   setRealtimeNoise]   = useState(null);

//   // ─── FROZEN FORECAST ──────────────────────────────────────────────────────
//   // Fetched once when sensor loads using last-7-days.
//   // setForecastData is ONLY called inside loadForecast().
//   // Nothing else can change this — not date picker, not anything.
//   const [forecastData, setForecastData] = useState(null);
//   // ──────────────────────────────────────────────────────────────────────────

//   const sensorOptions = (stations||[]).flatMap(st=>
//     (st.sensorIds||[]).map(sid=>({id:sid,label:st.sensorIds.length===1?st.name:`${st.name} – ${sid}`}))
//   );

//   useEffect(()=>{
//     if (sensorOptions.length>0 && !sensorId) setSensorId(sensorOptions[0].id);
//   },[stations]);

//   // Main dashboard fetch — date range changes re-run this, NOT loadForecast
//   useEffect(()=>{ if (sensorId) fetchDashboard(); },[sensorId,startDate,endDate,resolution]);

//   // Forecast fetch — ONLY runs when sensorId changes
//   useEffect(()=>{
//     if (!sensorId) return;
//     setForecastData(null);   // clear old sensor forecast
//     loadForecast(sensorId);  // load fresh 7-day snapshot for new sensor
//   },[sensorId]); // <-- ONLY sensorId, NEVER startDate/endDate

//   // Real-time noise
//   useEffect(()=>{
//     if (!sensorId) return;
//     const poll=async()=>{
//       try{
//         const res=await axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:formatDate(new Date()),end:formatDate(new Date()),resolution:'hourly'}});
//         const recs=res.data||[];
//         for(let i=recs.length-1;i>=0;i--){if((recs[i].dba||0)>0){setRealtimeNoise(Math.round(recs[i].dba));return;}}
//         setRealtimeNoise(null);
//       }catch{setRealtimeNoise(null);}
//     };
//     poll(); const iv=setInterval(poll,5*60*1000); return()=>clearInterval(iv);
//   },[sensorId]);

//   // Load last-7-days snapshot for forecast — stored permanently in forecastData
//   async function loadForecast(sid) {
//     try {
//       const today  = new Date();
//       const fEnd   = formatDate(today);
//       const fStart = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()-7));
//       const prev   = getPrevPeriod(fStart, fEnd);

//       const [cR,hR,pR,mm1R,mm25R,mm4R,mm10R] = await Promise.all([
//         axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sid,start:fStart,end:fEnd,resolution:'daily'}}).catch(()=>({data:[]})),
//         axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sid,start:fStart,end:fEnd,resolution:'hourly'}}).catch(()=>({data:[]})),
//         axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sid,start:prev.start,end:prev.end,resolution:'daily'}}).catch(()=>({data:[]})),
//         axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm1p0'}}).catch(()=>({data:[]})),
//         axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm2p5'}}).catch(()=>({data:[]})),
//         axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm4p0'}}).catch(()=>({data:[]})),
//         axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm10p0'}}).catch(()=>({data:[]})),
//       ]);

//       const curr=cR.data||[], hourly=hR.data||[], prevData=pR.data||[];
//       if (!curr.length) return;

//       const labels = curr.map(item=>new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"}));
//       const widgets = buildWidgets(curr, prevData, labels, mm1R.data||[], mm25R.data||[], mm4R.data||[], mm10R.data||[]);

//       // setForecastData is called ONCE here — this is the only place in the file that calls it
//       setForecastData({
//         pmData: {
//           pm1:  toForecastWidget(widgets.pmData.pm1),
//           pm25: toForecastWidget(widgets.pmData.pm25),
//           pm5:  toForecastWidget(widgets.pmData.pm5),
//           pm10: toForecastWidget(widgets.pmData.pm10),
//         },
//         noiseData:    toForecastWidget(widgets.noiseData),
//         tempData:     toForecastWidget(widgets.tempData),
//         humidityData: toForecastWidget(widgets.humidityData),
//         co2Data:      toForecastWidget(widgets.co2Data),
//         noxData:      toForecastWidget(widgets.noxData),
//         vocData:      toForecastWidget(widgets.vocData),
//         hourlyData:   hourly, // real last-7-days hourly rows, untouched
//       });
//     } catch(e) {
//       console.error("Forecast load failed:", e.message);
//     }
//   }

//   async function fetchDashboard() {
//     setLoading(true); setError(null);
//     try {
//       const prev=getPrevPeriod(startDate,endDate);
//       const [cR,hR,pR]=await Promise.all([
//         axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:startDate,end:endDate,resolution}}),
//         axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:startDate,end:endDate,resolution:'hourly'}}),
//         axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:prev.start,end:prev.end,resolution}}).catch(()=>({data:[]})),
//       ]);
//       const curr=cR.data||[], hourly=hR.data||[], prevData=pR.data||[];
//       if (!curr.length){setError(`No data for "${sensorId}" between ${startDate} and ${endDate}.`);setDashData(null);setLoading(false);return;}

//       const mmF=["pm1p0","pm2p5","pm4p0","pm10p0","dba","temperature","humidity","co2","nox","voc"];
//       const mmRes=await Promise.allSettled(mmF.map(f=>axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sensorId,start:startDate,end:endDate,field:f}})));
//       const [mm1,mm25,mm4,mm10]=mmRes.map(r=>r.status==="fulfilled"?r.value.data||[]:[]);

//       const labels=curr.map(item=>new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"}));
//       const widgets=buildWidgets(curr,prevData,labels,mm1,mm25,mm4,mm10);
//       const {pmData,noiseData,tempData,humidityData,co2Data,noxData,vocData}=widgets;

//       const st={
//         pm1:statusFor(pmData.pm1.current,THRESHOLDS.pm1,"pm25"),   pm25:statusFor(pmData.pm25.current,THRESHOLDS.pm25,"pm25"),
//         pm5:statusFor(pmData.pm5.current,THRESHOLDS.pm5,"pm25"),   pm10:statusFor(pmData.pm10.current,THRESHOLDS.pm10,"pm10"),
//         noise:statusFor(noiseData.current,THRESHOLDS.noise,"noise"),temp:statusFor(tempData.current,THRESHOLDS.temperature),
//         humidity:statusFor(humidityData.current,THRESHOLDS.humidity),co2:statusFor(co2Data.current,THRESHOLDS.co2),
//         nox:statusFor(noxData.current,THRESHOLDS.nox),             voc:statusFor(vocData.current,THRESHOLDS.voc),
//       };

//       setDashData({
//         pmData,noiseData,tempData,humidityData,co2Data,noxData,vocData,hourlyData:hourly,
//         summary:{compliant:Object.values(st).filter(s=>s==="Green").length,warnings:Object.values(st).filter(s=>s==="Yellow"||s==="Orange").length,nonCompliant:Object.values(st).filter(s=>s==="Red").length},
//         table:[
//           {parameter:"PM1.0",   status:st.pm1,      exceedances:hourly.filter(d=>(d.pm1p0   ||0)>THRESHOLDS.pm1).length },
//           {parameter:"PM2.5",   status:st.pm25,     exceedances:hourly.filter(d=>(d.pm2p5   ||0)>THRESHOLDS.pm25).length},
//           {parameter:"PM4.0",   status:st.pm5,      exceedances:hourly.filter(d=>(d.pm4p0   ||0)>THRESHOLDS.pm5).length },
//           {parameter:"PM10",    status:st.pm10,     exceedances:hourly.filter(d=>(d.pm10p0  ||0)>THRESHOLDS.pm10).length},
//           {parameter:"Noise",   status:st.noise,    exceedances:hourly.filter(d=>(d.dba     ||0)>THRESHOLDS.noise).length},
//           {parameter:"Humidity",status:st.humidity, exceedances:hourly.filter(d=>(d.humidity||0)>THRESHOLDS.humidity).length},
//           ...(hourly.some(d=>(d.co2||0)>0)?[{parameter:"CO2",status:st.co2,exceedances:hourly.filter(d=>(d.co2||0)>THRESHOLDS.co2).length}]:[]),
//           {parameter:"NOx",status:st.nox,exceedances:THRESHOLDS.nox!=null?hourly.filter(d=>(d.nox||0)>THRESHOLDS.nox).length:"—"},
//           {parameter:"VOC",status:st.voc,exceedances:THRESHOLDS.voc!=null?hourly.filter(d=>(d.voc||0)>THRESHOLDS.voc).length:"—"},
//         ],
//       });
//       // Capture this result as forecast if forecastData isn't loaded yet
//       // AND the selected range matches last-7-days (startDate = today-7)
//       const _today = new Date();
//       const _last7start = formatDate(new Date(_today.getFullYear(), _today.getMonth(), _today.getDate()-7));
//       if (!forecastData && startDate === _last7start) {
//         setForecastData({
//           pmData:{
//             pm1: toForecastWidget(pmData.pm1), pm25:toForecastWidget(pmData.pm25),
//             pm5: toForecastWidget(pmData.pm5), pm10:toForecastWidget(pmData.pm10),
//           },
//           noiseData:    toForecastWidget(noiseData),
//           tempData:     toForecastWidget(tempData),
//           humidityData: toForecastWidget(humidityData),
//           co2Data:      toForecastWidget(co2Data),
//           noxData:      toForecastWidget(noxData),
//           vocData:      toForecastWidget(vocData),
//           hourlyData:   hourly,
//         });
//       }
//     }catch(err){
//       if(err.response?.status===404)setError("404: Endpoint not found.");
//       else if(err.response?.status===401)setError("401: Unauthorized.");
//       else if(err.code==="ERR_NETWORK")setError("Network error.");
//       else setError(`Error: ${err.message}`);
//     }finally{setLoading(false);}
//   }

//   function applyPreset(p){
//     const t=new Date(); let s,e,label;
//     switch(p){
//       case "today":   s=e=formatDate(t);label="Today";break;
//       case "week":    {const w=new Date(t);w.setDate(w.getDate()-7);s=formatDate(w);e=formatDate(t);label="Last 7 Days";break;}
//       case "month":   s=formatDate(new Date(t.getFullYear(),t.getMonth(),1));e=formatDate(new Date(t.getFullYear(),t.getMonth()+1,0));label="This Month";break;
//       case "quarter": {const q=Math.floor(t.getMonth()/3);s=formatDate(new Date(t.getFullYear(),q*3,1));e=formatDate(new Date(t.getFullYear(),q*3+3,0));label="This Quarter";break;}
//       case "year":    s=formatDate(new Date(t.getFullYear(),0,1));e=formatDate(new Date(t.getFullYear(),11,31));label="This Year";break;
//       default:return;
//     }
//     setStartDate(s);setEndDate(e);setDateLabel(label);setAnchor(null);
//   }
//   function applyCustomRange(){
//     const s=new Date(startDate),e=new Date(endDate),sy=s.getFullYear(),ey=e.getFullYear();
//     const sm=s.toLocaleDateString("en-US",{month:"short",day:"numeric"}),em=e.toLocaleDateString("en-US",{month:"short",day:"numeric"});
//     setDateLabel(sy===ey?`${sm} - ${em}, ${sy}`:`${sm}, ${sy} - ${em}, ${ey}`);setAnchor(null);
//   }

//   const D  = dashData;
//   const F  = forecastData;  // frozen — only changes when sensor changes
//   const FC = showForecast && F;

//   const pw = (key) => FC ? F.pmData[key] : D?.pmData[key];
//   const fw = (key) => FC ? F[key]        : D?.[key];

//   return (
//     <Box onMouseMove={e=>{e.currentTarget.style.setProperty('--mouse-x',`${e.clientX}px`);e.currentTarget.style.setProperty('--mouse-y',`${e.clientY}px`);}}
//       sx={{minHeight:"100vh",position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#e0f2fe 0%,#dbeafe 50%,#e0e7ff 100%)',p:{xs:2,md:3},'--mouse-x':'50%','--mouse-y':'50%'}}>
//       <Box sx={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',background:`radial-gradient(280px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(59,130,246,0.22),transparent 70%),radial-gradient(500px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(99,102,241,0.12),transparent 70%),radial-gradient(800px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(14,165,233,0.07),transparent 70%)`,transition:'background 0.08s ease'}}/>
//       <Box sx={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0,'@keyframes float':{'0%,100%':{transform:'translate(0,0) scale(1)'},'33%':{transform:'translate(30px,-30px) scale(1.1)'},'66%':{transform:'translate(-20px,20px) scale(0.9)'}},'& > div':{position:'absolute',borderRadius:'50%',filter:'blur(80px)',opacity:0.3,animation:'float 20s ease-in-out infinite'},'& > div:nth-of-type(1)':{width:'400px',height:'400px',background:'rgba(59,130,246,0.4)',top:'10%',left:'10%'},'& > div:nth-of-type(2)':{width:'350px',height:'350px',background:'rgba(99,102,241,0.3)',top:'60%',right:'10%',animationDelay:'7s'},'& > div:nth-of-type(3)':{width:'300px',height:'300px',background:'rgba(14,165,233,0.3)',bottom:'10%',left:'40%',animationDelay:'14s'}}}><div/><div/><div/></Box>
//       <Box sx={{position:'fixed',inset:0,backgroundImage:`linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)`,backgroundSize:'50px 50px',pointerEvents:'none',zIndex:0}}/>

//       <Container maxWidth="xl" sx={{position:'relative',zIndex:1}}>
//         <Paper sx={filterBarSx}>
//           <Grid container spacing={3} alignItems="center">
//             <Grid item xs={12} sm={6} md={3}>
//               <FormControl fullWidth size="small">
//                 <InputLabel sx={labelSx}>Sensor</InputLabel>
//                 <Select value={sensorId} label="Sensor" onChange={e=>setSensorId(e.target.value)} sx={selectSx} disabled={loading||stationsLoading}>
//                   {stationsLoading?<MenuItem disabled>Loading sensors...</MenuItem>:sensorOptions.map(o=><MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>)}
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={12} sm={6} md={3}>
//               <Box onClick={loading?undefined:e=>setAnchor(e.currentTarget)} sx={{bgcolor:loading?'#cbd5e1':'#667eea',color:'white',borderRadius:3,px:2.5,py:1,border:`2px solid ${loading?'#cbd5e1':'#667eea'}`,boxShadow:'0 4px 12px rgba(102,126,234,0.3)',cursor:loading?'default':'pointer',display:'flex',flexDirection:'column',alignItems:'flex-start',width:'100%','&:hover':loading?{}:{bgcolor:'#5568d3',borderColor:'#5568d3',transform:'translateY(-2px)'}}}>
//                 <Typography sx={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',opacity:0.8,lineHeight:1}}>📅 Click to Select Dates</Typography>
//                 <Typography sx={{fontSize:'0.88rem',fontWeight:600,mt:0.4,lineHeight:1.2}}>{dateLabel}</Typography>
//               </Box>
//             </Grid>
//             <Grid item xs={12} md={4}>
//               <Box sx={{display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
//                 <Box component="img" src={sacaqmLogo} alt="SACAQM" sx={{height:50,objectFit:'contain',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'}}/>
//                 <Box sx={{width:2,height:40,bgcolor:'rgba(59,130,246,0.3)',borderRadius:1}}/>
//                 <Box component="img" src={airsynqLogo} alt="AirSynQ" sx={{height:40,objectFit:'contain',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'}}/>
//               </Box>
//             </Grid>
//             <Grid item xs={12} md={2}>
//               <Box sx={{display:'flex',flexDirection:'column',gap:1.5}}>
//                 <Button fullWidth onClick={()=>{setDownloadLoading(true);setTimeout(()=>setDownloadLoading(false),1500);}} disabled={downloadLoading||!D} startIcon={downloadLoading?<CircularProgress size={14} sx={{color:'white'}}/>:<span>⬇️</span>} sx={{bgcolor:'#0ea5e9',color:'white',borderRadius:3,py:1,fontSize:'0.8rem',fontWeight:600,textTransform:'none','&:hover':{bgcolor:'#0284c7',transform:'translateY(-2px)'},'&:disabled':{bgcolor:'#cbd5e1',color:'white'}}}>
//                   {downloadLoading?'Generating...':'Download Report'}
//                 </Button>
//                 <Button fullWidth onClick={()=>setShowForecast(p=>!p)} disabled={!D||!F} startIcon={<span>🔮</span>} sx={{bgcolor:showForecast?'#8b5cf6':'white',color:showForecast?'white':'#8b5cf6',borderRadius:3,py:1,fontSize:'0.8rem',fontWeight:600,textTransform:'none',border:'2px solid #8b5cf6','&:hover':{bgcolor:showForecast?'#7c3aed':'rgba(139,92,246,0.08)',transform:'translateY(-2px)'},'&:disabled':{bgcolor:'#f1f5f9',borderColor:'#e2e8f0',color:'#94a3b8'}}}>
//                   {showForecast?'Hide Forecast':'Show Forecast'}
//                 </Button>
//               </Box>
//             </Grid>
//           </Grid>
//         </Paper>

//         <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={()=>setAnchor(null)} anchorOrigin={{vertical:"bottom",horizontal:"right"}} transformOrigin={{vertical:"top",horizontal:"right"}} sx={{"& .MuiPaper-root":{borderRadius:3,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",p:3,mt:1}}}>
//           <Box sx={{minWidth:450}}>
//             <Typography variant="h6" sx={{mb:2,fontWeight:700,color:"#1e293b",fontSize:'1.1rem'}}>📅 Select Date Range</Typography>
//             <Typography sx={{fontSize:'0.75rem',fontWeight:600,color:'#64748b',mb:1,textTransform:'uppercase'}}>Quick Selection</Typography>
//             <Box sx={{display:"flex",gap:1,mb:3,flexWrap:"wrap"}}>
//               {[["today","Today"],["week","Last 7 Days"],["month","This Month"],["quarter","This Quarter"],["year","This Year"]].map(([p,l])=>(
//                 <Button key={p} size="small" onClick={()=>applyPreset(p)} sx={{...presetSx,minWidth:80}}>{l}</Button>
//               ))}
//             </Box>
//             <Typography sx={{fontSize:'0.75rem',fontWeight:600,color:'#64748b',mb:1,textTransform:'uppercase'}}>Custom Range</Typography>
//             <Box sx={{display:"flex",gap:2,mb:3}}>
//               <TextField label="Start Date" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} fullWidth size="small" InputLabelProps={{shrink:true}} sx={{'& .MuiOutlinedInput-root':{borderRadius:2,'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'},'&.Mui-focused .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'}}}}/>
//               <TextField label="End Date" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} inputProps={{min:startDate}} fullWidth size="small" InputLabelProps={{shrink:true}} sx={{'& .MuiOutlinedInput-root':{borderRadius:2,'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'},'&.Mui-focused .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'}}}}/>
//             </Box>
//             <Box sx={{display:"flex",gap:2,justifyContent:"flex-end"}}>
//               <Button onClick={()=>setAnchor(null)} sx={{textTransform:"none",color:'#64748b','&:hover':{bgcolor:'#f1f5f9'}}}>Cancel</Button>
//               <Button variant="contained" onClick={applyCustomRange} sx={{bgcolor:"#667eea",textTransform:"none",px:4,fontWeight:600,"&:hover":{bgcolor:"#5568d3"}}}>Apply</Button>
//             </Box>
//           </Box>
//         </Popover>

//         {loading&&<Box sx={{display:"flex",flexDirection:"column",alignItems:"center",my:8}}><CircularProgress size={60} sx={{color:"#3b82f6"}}/><Typography sx={{mt:2,color:"#3b82f6",fontWeight:600}}>Loading dashboard data...</Typography></Box>}
//         {error&&!loading&&<Alert severity="error" sx={{mb:3,borderRadius:2}} onClose={()=>setError(null)}>{error}</Alert>}

//         {!loading&&D&&(
//           <>
//             {showForecast&&(
//               <Box sx={{mb:3,p:2.5,borderRadius:3,background:'linear-gradient(135deg,rgba(139,92,246,0.14),rgba(99,102,241,0.1))',border:'1.5px solid rgba(139,92,246,0.35)',display:'flex',alignItems:'center',gap:2,boxShadow:'0 4px 20px rgba(139,92,246,0.12)'}}>
//                 <span style={{fontSize:'1.8rem'}}>🤖</span>
//                 <Box sx={{flex:1}}>
//                   <Box sx={{display:'flex',alignItems:'center',gap:1.5,flexWrap:'wrap'}}>
//                     <Typography sx={{fontWeight:800,fontSize:'1.15rem',color:'#5b21b6'}}>AI Forecast Mode Active</Typography>
//                     <Box sx={{px:1.5,py:0.25,borderRadius:10,background:'linear-gradient(90deg,#7c3aed,#6366f1)',display:'inline-flex',alignItems:'center',gap:0.5}}>
//                       <span style={{fontSize:'0.7rem'}}>✦</span>
//                       <Typography sx={{fontSize:'0.78rem',fontWeight:700,color:'white',letterSpacing:'0.5px',textTransform:'uppercase'}}>Powered by AI</Typography>
//                     </Box>
//                   </Box>
//                   <Typography sx={{fontSize:'0.95rem',color:'#6d28d9',mt:0.4}}>
//                     Showing AI-generated forecasts for next week&nbsp;
//                     <Box component="span" sx={{fontWeight:700,color:'#5b21b6'}}>({FORECAST_WEEK_RANGE})</Box>
//                   </Typography>
//                 </Box>
//               </Box>
//             )}

//             <Box sx={{mb:3}}><StationMap/></Box>

//             <Grid container spacing={3} sx={{mb:3}}><Grid item xs={12}><Box sx={fadeIn(0)}>
//               <ExceedancesTable hourlyData={FC?F.hourlyData:D.hourlyData} thresholds={THRESHOLDS} isForecast={showForecast} forecastWeekLabels={FORECAST_LABELS}/>
//             </Box></Grid></Grid>

//             <Grid container spacing={3} sx={{mb:3}}><Grid item xs={12}><Box sx={fadeIn(0.1)}>
//               <ExceedancesOverTimeChart hourlyData={FC?F.hourlyData:D.hourlyData} thresholds={THRESHOLDS} isForecast={showForecast} forecastWeekLabels={FORECAST_LABELS} forecastWeekRange={showForecast?FORECAST_WEEK_RANGE:null}/>
//             </Box></Grid></Grid>

//             <Grid container spacing={3} sx={{mb:3}}>
//               {[{severity:"moderate",title:"Moderate Exceedances",color:"#fbbf24",delay:0.15},{severity:"high",title:"High Exceedances",color:"#fb923c",delay:0.16},{severity:"veryHigh",title:"Very High Exceedances",color:"#ef4444",delay:0.17}].map(({severity,title,color,delay})=>(
//                 <Grid item xs={12} md={4} key={severity}><Box sx={fadeIn(delay)}>
//                   <ExceedancesSeverityChart hourlyData={FC?F.hourlyData:D.hourlyData} thresholds={THRESHOLDS} severity={severity} title={showForecast?`${title} (Forecast)`:title} color={color} isForecast={showForecast} forecastWeekLabels={FORECAST_LABELS}/>
//                 </Box></Grid>
//               ))}
//             </Grid>

//             <Grid container spacing={3} sx={{mb:3}}>
//               {Object.entries(D.pmData).map(([key,widget],idx)=>{
//                 const d=pw(key)||widget;
//                 return (<Grid item xs={12} sm={6} lg={3} key={key}><Box sx={fadeIn(0.2+idx*0.1)}>
//                   <PMWidget title={showForecast?`${widget.title} (Forecast)`:widget.title} labels={d.labels} dataPoints={d.values} threshold={THRESHOLDS[key]} paramKey={key==='pm10'?'pm10':'pm25'} trend={widget.trend}/>
//                 </Box></Grid>);
//               })}
//             </Grid>

//             <Grid container spacing={3} sx={{mb:3,alignItems:'stretch'}}>
//               <Grid item xs={12} md={4} sx={{display:'flex'}}><Box sx={{...fadeIn(0.6),display:'flex',flex:1,width:'100%'}}>
//                 <NoiseGauge value={FC?F.noiseData.current:(realtimeNoise??D.noiseData.current)} subLabel={showForecast?"Forecast Period Average":"Daily Average"}/>
//               </Box></Grid>
//               <Grid item xs={12} md={8} sx={{display:'flex'}}><Box sx={{...fadeIn(0.65),display:'flex',flex:1,width:'100%'}}>
//                 {(()=>{const d=fw("noiseData");return <NoiseWidget title={showForecast?"Noise Levels (Forecast)":"Noise Levels Over Time"} labels={d.labels} data={d.values} threshold={THRESHOLDS.noise}/>;})()}
//               </Box></Grid>
//             </Grid>

//             <Grid container spacing={3} sx={{mb:3}}>
//               <Grid item xs={12} md={D.co2Data.values.some(v=>v>0)?4:6}><Box sx={fadeIn(0.7)}>
//                 {(()=>{const d=fw("tempData");return <TempWidget title={showForecast?"Temperature (Forecast)":"Temperature"} labels={d.labels} data={d.values} threshold={THRESHOLDS.temperature}/>;})()}
//               </Box></Grid>
//               <Grid item xs={12} md={D.co2Data.values.some(v=>v>0)?4:6}><Box sx={fadeIn(0.8)}>
//                 {(()=>{const d=fw("humidityData");return <ParameterWidget title={showForecast?"Humidity (Forecast)":"Humidity"} labels={d.labels} data={d.values} threshold={THRESHOLDS.humidity} unit="%"/>;})()}
//               </Box></Grid>
//               {D.co2Data.values.some(v=>v>0)&&(<Grid item xs={12} md={4}><Box sx={fadeIn(0.9)}>
//                 {(()=>{const d=fw("co2Data");return <ParameterWidget title={showForecast?"CO2 (Forecast)":"CO2"} labels={d.labels} data={d.values} threshold={THRESHOLDS.co2} unit=" ppm"/>;})()}
//               </Box></Grid>)}
//             </Grid>

//             <Grid container spacing={3}>
//               <Grid item xs={12} md={6}><Box sx={fadeIn(1.0)}>
//                 {(()=>{const d=fw("noxData");return <ParameterWidget title={showForecast?"NOx (Forecast)":"NOx"} labels={d.labels} data={d.values} threshold={THRESHOLDS.nox} unit=""/>;})()}
//               </Box></Grid>
//               <Grid item xs={12} md={6}><Box sx={fadeIn(1.1)}>
//                 {(()=>{const d=fw("vocData");return <ParameterWidget title={showForecast?"VOC (Forecast)":"VOC"} labels={d.labels} data={d.values} threshold={THRESHOLDS.voc} unit=""/>;})()}
//               </Box></Grid>
//             </Grid>
//           </>
//         )}
//       </Container>
//     </Box>
//   );
// }
import React, { useState, useEffect, useContext } from "react";
import {
  FormControl, Select, MenuItem, InputLabel, Button, Popover,
  TextField, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip // Added Table Imports
} from "@mui/material";
import { Grid, Box, Typography, Paper, Container } from "@mui/material";
import axios from "axios";
import sacaqmLogo from '../assets/sacaqm_logo.png';
import airsynqLogo from '../assets/airsynq.png';
import { StationContext } from "../contextProviders/StationContext";
import PMWidget from "../components/envDashboard/PMWidget";
import NoiseGauge from "../components/envDashboard/NoiseGauge";
import NoiseWidget from "../components/envDashboard/NoiseWidget";
import TempWidget from "../components/envDashboard/TempWidget";
import ParameterWidget from "../components/envDashboard/ParameterWidget";
import ExceedancesOverTimeChart from "../components/envDashboard/ExceedancesOverTimeChart";
import ExceedancesTable from "../components/envDashboard/ExceedancesTable";
import ExceedancesSeverityChart from "../components/envDashboard/ExceedancesSeverityChart";
import StationMap from "../components/envDashboard/StationMap";

const BASE = process.env.REACT_APP_API_BASE;

// Forecast week labels
const _tom = (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0); return d; })();
const FORECAST_LABELS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(_tom); d.setDate(_tom.getDate() + i);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});
const FORECAST_WEEK_RANGE = `${FORECAST_LABELS[0]} – ${FORECAST_LABELS[6]}`;

function formatDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function calcTrend(curr, prev) {
  if (!prev?.length) return 0;
  const ca=curr.reduce((s,v)=>s+v,0)/curr.length, pa=prev.reduce((s,v)=>s+v,0)/prev.length;
  return pa===0?0:Math.round(((ca-pa)/pa)*100);
}
function getPrevPeriod(start, end) {
  const s=new Date(start), e=new Date(end), days=Math.ceil(Math.abs(e-s)/86400000);
  const pe=new Date(s); pe.setDate(pe.getDate()-1);
  const ps=new Date(pe); ps.setDate(ps.getDate()-days);
  return { start:formatDate(ps), end:formatDate(pe) };
}

const AQI_BANDS = {
  pm25:[{max:103,status:"Green"},{max:128,status:"Yellow"},{max:178,status:"Orange"},{max:Infinity,status:"Red"}],
  pm10:[{max:190,status:"Green"},{max:240,status:"Yellow"},{max:290,status:"Orange"},{max:Infinity,status:"Red"}],
  noise:[{max:70,status:"Green"},{max:90,status:"Yellow"},{max:120,status:"Orange"},{max:Infinity,status:"Red"}],
};

function statusFor(val, thr, key) {
  if (thr==null) return "—";
  const bands=AQI_BANDS[key];
  if (bands) { for (const b of bands) if (val<=b.max) return b.status; }
  if (val<=thr) return "Green"; if (val<=thr*1.2) return "Yellow"; if (val<=thr*1.5) return "Orange"; return "Red";
}
const avgF = (arr,key) => arr.length?Math.round(arr.reduce((s,d)=>s+(d[key]||0),0)/arr.length):0;
const sMin  = (arr) => arr?.length?Math.round(Math.min(...arr.map(d=>d.min??0))):0;
const sMax  = (arr) => arr?.length?Math.round(Math.max(...arr.map(d=>d.max??0))):0;

// Hourly Thresholds
const THRESHOLDS = { pm1:103, pm25:103, pm5:103, pm10:190, noise:70, temperature:32, humidity:80, co2:1000, nox:null, voc:null };
// New Daily Thresholds for PM Widgets & Daily Exceedance Table
const DAILY_THRESHOLDS = { pm1: 40, pm25: 40, pm5: 40, pm10: 75 };

function toForecastWidget(w) {
  if (!w) return null;
  const v = w.values.length >= 7 ? w.values.slice(-7) : [...Array(7-w.values.length).fill(w.values[0]??0), ...w.values];
  return { ...w, labels: FORECAST_LABELS, values: v };
}

const filterBarSx = {
  background:'rgba(255,255,255,0.7)', backdropFilter:'blur(20px) saturate(180%)',
  border:'1px solid rgba(59,130,246,0.2)', p:3, borderRadius:4, mb:3,
  boxShadow:'0 8px 32px rgba(59,130,246,0.1)', position:'relative', zIndex:10, overflow:'hidden',
  '&::after':{content:'""',position:'absolute',bottom:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#3b82f6,#6366f1,#0ea5e9)'},
};
const selectSx = {
  bgcolor:"white", borderRadius:2.5,
  "& .MuiOutlinedInput-notchedOutline":{borderColor:"rgba(59,130,246,0.2)",borderWidth:2},
  "&:hover .MuiOutlinedInput-notchedOutline":{borderColor:"#3b82f6"},
  "&.Mui-focused .MuiOutlinedInput-notchedOutline":{borderColor:"#3b82f6",borderWidth:2},
  fontSize:"0.95rem", fontWeight:500, boxShadow:"0 2px 8px rgba(59,130,246,0.08)",
  "&:hover":{boxShadow:"0 4px 12px rgba(59,130,246,0.15)"},
};
const presetSx = {
  px:2, py:0.5, fontSize:"0.75rem", fontWeight:600, textTransform:"none",
  borderRadius:2, border:"2px solid transparent", bgcolor:"rgba(59,130,246,0.1)", color:"#3b82f6",
  "&:hover":{bgcolor:"#3b82f6",color:"white"},
};
const labelSx = {fontSize:"0.75rem",fontWeight:700,color:"#64748b",letterSpacing:"0.5px",textTransform:"uppercase"};
const fadeIn = (d) => ({
  animation:`fadeInUp 0.6s ease-out ${d}s`, animationFillMode:"backwards",
  "@keyframes fadeInUp":{from:{opacity:0,transform:"translateY(30px)"},to:{opacity:1,transform:"translateY(0)"}},
});

function buildWidgets(curr, prevData, labels, mm1, mm25, mm4, mm10) {
  const pmData = {
    pm1: {title:"PM1.0",labels,values:curr.map(d=>Math.round(d.pm1p0 ||0)),current:avgF(curr,"pm1p0"), trend:calcTrend(curr.map(d=>d.pm1p0 ||0),prevData.map(d=>d.pm1p0 ||0)),min:sMin(mm1), max:sMax(mm1) },
    pm25:{title:"PM2.5",labels,values:curr.map(d=>Math.round(d.pm2p5 ||0)),current:avgF(curr,"pm2p5"), trend:calcTrend(curr.map(d=>d.pm2p5 ||0),prevData.map(d=>d.pm2p5 ||0)),min:sMin(mm25),max:sMax(mm25)},
    pm5: {title:"PM4.0",labels,values:curr.map(d=>Math.round(d.pm4p0 ||0)),current:avgF(curr,"pm4p0"), trend:calcTrend(curr.map(d=>d.pm4p0 ||0),prevData.map(d=>d.pm4p0 ||0)),min:sMin(mm4), max:sMax(mm4) },
    pm10:{title:"PM10", labels,values:curr.map(d=>Math.round(d.pm10p0||0)),current:avgF(curr,"pm10p0"),trend:calcTrend(curr.map(d=>d.pm10p0||0),prevData.map(d=>d.pm10p0||0)),min:sMin(mm10),max:sMax(mm10)},
  };
  return {
    pmData,
    noiseData:    {labels,values:curr.map(d=>Math.round(d.dba         ||0)),current:avgF(curr,"dba")        },
    tempData:     {labels,values:curr.map(d=>Math.round(d.temperature ||0)),current:avgF(curr,"temperature"),trend:calcTrend(curr.map(d=>d.temperature||0),prevData.map(d=>d.temperature||0))},
    humidityData: {labels,values:curr.map(d=>Math.round(d.humidity    ||0)),current:avgF(curr,"humidity"),   trend:calcTrend(curr.map(d=>d.humidity   ||0),prevData.map(d=>d.humidity   ||0))},
    co2Data:      {labels,values:curr.map(d=>Math.round(d.co2         ||0)),current:avgF(curr,"co2"),        trend:calcTrend(curr.map(d=>d.co2        ||0),prevData.map(d=>d.co2        ||0))},
    noxData:      {labels,values:curr.map(d=>Math.round(d.nox         ||0)),current:avgF(curr,"nox"),        trend:calcTrend(curr.map(d=>d.nox        ||0),prevData.map(d=>d.nox        ||0))},
    vocData:      {labels,values:curr.map(d=>Math.round(d.voc         ||0)),current:avgF(curr,"voc"),        trend:calcTrend(curr.map(d=>d.voc        ||0),prevData.map(d=>d.voc        ||0))},
  };
}

export default function EnvComplianceDashboard() {
  const { stations, loading: stationsLoading } = useContext(StationContext);

  const [sensorId,        setSensorId]        = useState("");
  const [startDate,       setStartDate]       = useState(() => { const d=new Date(); d.setDate(d.getDate()-7); return formatDate(d); });
  const [endDate,         setEndDate]         = useState(() => formatDate(new Date()));
  const [dateLabel,       setDateLabel]       = useState(() => {
    const d=new Date(), s=new Date(d); s.setDate(d.getDate()-7);
    return `${s.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${d.toLocaleDateString("en-US",{month:"short",day:"numeric"})}, ${d.getFullYear()}`;
  });
  const [resolution,      setResolution]      = useState("daily");
  const [dashData,        setDashData]        = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  const [anchor,          setAnchor]          = useState(null);
  const [showForecast,    setShowForecast]    = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [realtimeNoise,   setRealtimeNoise]   = useState(null);

  const [forecastData, setForecastData] = useState(null);

  const sensorOptions = (stations||[]).flatMap(st=>
    (st.sensorIds||[]).map(sid=>({id:sid,label:st.sensorIds.length===1?st.name:`${st.name} – ${sid}`}))
  );

  useEffect(()=>{
    if (sensorOptions.length>0 && !sensorId) setSensorId(sensorOptions[0].id);
  },[stations]);

  useEffect(()=>{ if (sensorId) fetchDashboard(); },[sensorId,startDate,endDate,resolution]);

  useEffect(()=>{
    if (!sensorId) return;
    setForecastData(null);
    loadForecast(sensorId);
  },[sensorId]);

  useEffect(()=>{
    if (!sensorId) return;
    const poll=async()=>{
      try{
        const res=await axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:formatDate(new Date()),end:formatDate(new Date()),resolution:'hourly'}});
        const recs=res.data||[];
        for(let i=recs.length-1;i>=0;i--){if((recs[i].dba||0)>0){setRealtimeNoise(Math.round(recs[i].dba));return;}}
        setRealtimeNoise(null);
      }catch{setRealtimeNoise(null);}
    };
    poll(); const iv=setInterval(poll,5*60*1000); return()=>clearInterval(iv);
  },[sensorId]);

  async function loadForecast(sid) {
    try {
      const today  = new Date();
      const fEnd   = formatDate(today);
      const fStart = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()-7));
      const prev   = getPrevPeriod(fStart, fEnd);

      const [cR,hR,pR,mm1R,mm25R,mm4R,mm10R] = await Promise.all([
        axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sid,start:fStart,end:fEnd,resolution:'daily'}}).catch(()=>({data:[]})),
        axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sid,start:fStart,end:fEnd,resolution:'hourly'}}).catch(()=>({data:[]})),
        axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sid,start:prev.start,end:prev.end,resolution:'daily'}}).catch(()=>({data:[]})),
        axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm1p0'}}).catch(()=>({data:[]})),
        axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm2p5'}}).catch(()=>({data:[]})),
        axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm4p0'}}).catch(()=>({data:[]})),
        axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sid,start:fStart,end:fEnd,field:'pm10p0'}}).catch(()=>({data:[]})),
      ]);

      const curr=cR.data||[], hourly=hR.data||[], prevData=pR.data||[];
      if (!curr.length) return;

      const labels = curr.map(item=>new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"}));
      const widgets = buildWidgets(curr, prevData, labels, mm1R.data||[], mm25R.data||[], mm4R.data||[], mm10R.data||[]);

      setForecastData({
        pmData: {
          pm1:  toForecastWidget(widgets.pmData.pm1),
          pm25: toForecastWidget(widgets.pmData.pm25),
          pm5:  toForecastWidget(widgets.pmData.pm5),
          pm10: toForecastWidget(widgets.pmData.pm10),
        },
        noiseData:    toForecastWidget(widgets.noiseData),
        tempData:     toForecastWidget(widgets.tempData),
        humidityData: toForecastWidget(widgets.humidityData),
        co2Data:      toForecastWidget(widgets.co2Data),
        noxData:      toForecastWidget(widgets.noxData),
        vocData:      toForecastWidget(widgets.vocData),
        hourlyData:   hourly, 
      });
    } catch(e) {
      console.error("Forecast load failed:", e.message);
    }
  }

  async function fetchDashboard() {
    setLoading(true); setError(null);
    try {
      const prev=getPrevPeriod(startDate,endDate);
      const [cR,hR,pR]=await Promise.all([
        axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:startDate,end:endDate,resolution}}),
        axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:startDate,end:endDate,resolution:'hourly'}}),
        axios.get(`${BASE}/api/nodedata/aggregated`,{params:{sensor_id:sensorId,start:prev.start,end:prev.end,resolution}}).catch(()=>({data:[]})),
      ]);
      const curr=cR.data||[], hourly=hR.data||[], prevData=pR.data||[];
      if (!curr.length){setError(`No data for "${sensorId}" between ${startDate} and ${endDate}.`);setDashData(null);setLoading(false);return;}

      const mmF=["pm1p0","pm2p5","pm4p0","pm10p0","dba","temperature","humidity","co2","nox","voc"];
      const mmRes=await Promise.allSettled(mmF.map(f=>axios.get(`${BASE}/api/nodedata/daily-trend-minmax`,{params:{sensor_id:sensorId,start:startDate,end:endDate,field:f}})));
      const [mm1,mm25,mm4,mm10]=mmRes.map(r=>r.status==="fulfilled"?r.value.data||[]:[]);

      const labels=curr.map(item=>new Date(item.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"}));
      const widgets=buildWidgets(curr,prevData,labels,mm1,mm25,mm4,mm10);
      const {pmData,noiseData,tempData,humidityData,co2Data,noxData,vocData}=widgets;

      const st={
        pm1:statusFor(pmData.pm1.current,THRESHOLDS.pm1,"pm25"),   pm25:statusFor(pmData.pm25.current,THRESHOLDS.pm25,"pm25"),
        pm5:statusFor(pmData.pm5.current,THRESHOLDS.pm5,"pm25"),   pm10:statusFor(pmData.pm10.current,THRESHOLDS.pm10,"pm10"),
        noise:statusFor(noiseData.current,THRESHOLDS.noise,"noise"),temp:statusFor(tempData.current,THRESHOLDS.temperature),
        humidity:statusFor(humidityData.current,THRESHOLDS.humidity),co2:statusFor(co2Data.current,THRESHOLDS.co2),
        nox:statusFor(noxData.current,THRESHOLDS.nox),             voc:statusFor(vocData.current,THRESHOLDS.voc),
      };

      setDashData({
        pmData,noiseData,tempData,humidityData,co2Data,noxData,vocData,hourlyData:hourly,
        summary:{compliant:Object.values(st).filter(s=>s==="Green").length,warnings:Object.values(st).filter(s=>s==="Yellow"||s==="Orange").length,nonCompliant:Object.values(st).filter(s=>s==="Red").length},
        table:[
          {parameter:"PM1.0",   status:st.pm1,      exceedances:hourly.filter(d=>(d.pm1p0   ||0)>THRESHOLDS.pm1).length },
          {parameter:"PM2.5",   status:st.pm25,     exceedances:hourly.filter(d=>(d.pm2p5   ||0)>THRESHOLDS.pm25).length},
          {parameter:"PM4.0",   status:st.pm5,      exceedances:hourly.filter(d=>(d.pm4p0   ||0)>THRESHOLDS.pm5).length },
          {parameter:"PM10",    status:st.pm10,     exceedances:hourly.filter(d=>(d.pm10p0  ||0)>THRESHOLDS.pm10).length},
          {parameter:"Noise",   status:st.noise,    exceedances:hourly.filter(d=>(d.dba     ||0)>THRESHOLDS.noise).length},
          {parameter:"Humidity",status:st.humidity, exceedances:hourly.filter(d=>(d.humidity||0)>THRESHOLDS.humidity).length},
          ...(hourly.some(d=>(d.co2||0)>0)?[{parameter:"CO2",status:st.co2,exceedances:hourly.filter(d=>(d.co2||0)>THRESHOLDS.co2).length}]:[]),
          {parameter:"NOx",status:st.nox,exceedances:THRESHOLDS.nox!=null?hourly.filter(d=>(d.nox||0)>THRESHOLDS.nox).length:"—"},
          {parameter:"VOC",status:st.voc,exceedances:THRESHOLDS.voc!=null?hourly.filter(d=>(d.voc||0)>THRESHOLDS.voc).length:"—"},
        ],
      });
      
      const _today = new Date();
      const _last7start = formatDate(new Date(_today.getFullYear(), _today.getMonth(), _today.getDate()-7));
      if (!forecastData && startDate === _last7start) {
        setForecastData({
          pmData:{
            pm1: toForecastWidget(pmData.pm1), pm25:toForecastWidget(pmData.pm25),
            pm5: toForecastWidget(pmData.pm5), pm10:toForecastWidget(pmData.pm10),
          },
          noiseData:    toForecastWidget(noiseData),
          tempData:     toForecastWidget(tempData),
          humidityData: toForecastWidget(humidityData),
          co2Data:      toForecastWidget(co2Data),
          noxData:      toForecastWidget(noxData),
          vocData:      toForecastWidget(vocData),
          hourlyData:   hourly,
        });
      }
    }catch(err){
      if(err.response?.status===404)setError("404: Endpoint not found.");
      else if(err.response?.status===401)setError("401: Unauthorized.");
      else if(err.code==="ERR_NETWORK")setError("Network error.");
      else setError(`Error: ${err.message}`);
    }finally{setLoading(false);}
  }

  function applyPreset(p){
    const t=new Date(); let s,e,label;
    switch(p){
      case "today":   s=e=formatDate(t);label="Today";break;
      case "week":    {const w=new Date(t);w.setDate(w.getDate()-7);s=formatDate(w);e=formatDate(t);label="Last 7 Days";break;}
      case "month":   s=formatDate(new Date(t.getFullYear(),t.getMonth(),1));e=formatDate(new Date(t.getFullYear(),t.getMonth()+1,0));label="This Month";break;
      case "quarter": {const q=Math.floor(t.getMonth()/3);s=formatDate(new Date(t.getFullYear(),q*3,1));e=formatDate(new Date(t.getFullYear(),q*3+3,0));label="This Quarter";break;}
      case "year":    s=formatDate(new Date(t.getFullYear(),0,1));e=formatDate(new Date(t.getFullYear(),11,31));label="This Year";break;
      default:return;
    }
    setStartDate(s);setEndDate(e);setDateLabel(label);setAnchor(null);
  }
  function applyCustomRange(){
    const s=new Date(startDate),e=new Date(endDate),sy=s.getFullYear(),ey=e.getFullYear();
    const sm=s.toLocaleDateString("en-US",{month:"short",day:"numeric"}),em=e.toLocaleDateString("en-US",{month:"short",day:"numeric"});
    setDateLabel(sy===ey?`${sm} - ${em}, ${sy}`:`${sm}, ${sy} - ${em}, ${ey}`);setAnchor(null);
  }

  const D  = dashData;
  const F  = forecastData;  
  const FC = showForecast && F;

  const pw = (key) => FC ? F.pmData[key] : D?.pmData[key];
  const fw = (key) => FC ? F[key]        : D?.[key];

  // Dynamically calculate the daily exceedances mapping
  const dailyExcData = D ? [
    { name: 'PM1.0', key: 'pm1', limit: DAILY_THRESHOLDS.pm1 },
    { name: 'PM2.5', key: 'pm25', limit: DAILY_THRESHOLDS.pm25 },
    { name: 'PM4.0', key: 'pm5', limit: DAILY_THRESHOLDS.pm5 },
    { name: 'PM10', key: 'pm10', limit: DAILY_THRESHOLDS.pm10 },
  ].map(param => {
    const values = pw(param.key)?.values || [];
    const excCount = values.filter(v => v > param.limit).length;
    return { ...param, exceedances: excCount, total: values.length };
  }) : [];

  return (
    <Box onMouseMove={e=>{e.currentTarget.style.setProperty('--mouse-x',`${e.clientX}px`);e.currentTarget.style.setProperty('--mouse-y',`${e.clientY}px`);}}
      sx={{minHeight:"100vh",position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#e0f2fe 0%,#dbeafe 50%,#e0e7ff 100%)',p:{xs:2,md:3},'--mouse-x':'50%','--mouse-y':'50%'}}>
      <Box sx={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',background:`radial-gradient(280px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(59,130,246,0.22),transparent 70%),radial-gradient(500px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(99,102,241,0.12),transparent 70%),radial-gradient(800px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(14,165,233,0.07),transparent 70%)`,transition:'background 0.08s ease'}}/>
      <Box sx={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0,'@keyframes float':{'0%,100%':{transform:'translate(0,0) scale(1)'},'33%':{transform:'translate(30px,-30px) scale(1.1)'},'66%':{transform:'translate(-20px,20px) scale(0.9)'}},'& > div':{position:'absolute',borderRadius:'50%',filter:'blur(80px)',opacity:0.3,animation:'float 20s ease-in-out infinite'},'& > div:nth-of-type(1)':{width:'400px',height:'400px',background:'rgba(59,130,246,0.4)',top:'10%',left:'10%'},'& > div:nth-of-type(2)':{width:'350px',height:'350px',background:'rgba(99,102,241,0.3)',top:'60%',right:'10%',animationDelay:'7s'},'& > div:nth-of-type(3)':{width:'300px',height:'300px',background:'rgba(14,165,233,0.3)',bottom:'10%',left:'40%',animationDelay:'14s'}}}><div/><div/><div/></Box>
      <Box sx={{position:'fixed',inset:0,backgroundImage:`linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px)`,backgroundSize:'50px 50px',pointerEvents:'none',zIndex:0}}/>

      <Container maxWidth="xl" sx={{position:'relative',zIndex:1}}>
        <Paper sx={filterBarSx}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={labelSx}>Sensor</InputLabel>
                <Select value={sensorId} label="Sensor" onChange={e=>setSensorId(e.target.value)} sx={selectSx} disabled={loading||stationsLoading}>
                  {stationsLoading?<MenuItem disabled>Loading sensors...</MenuItem>:sensorOptions.map(o=><MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box onClick={loading?undefined:e=>setAnchor(e.currentTarget)} sx={{bgcolor:loading?'#cbd5e1':'#667eea',color:'white',borderRadius:3,px:2.5,py:1,border:`2px solid ${loading?'#cbd5e1':'#667eea'}`,boxShadow:'0 4px 12px rgba(102,126,234,0.3)',cursor:loading?'default':'pointer',display:'flex',flexDirection:'column',alignItems:'flex-start',width:'100%','&:hover':loading?{}:{bgcolor:'#5568d3',borderColor:'#5568d3',transform:'translateY(-2px)'}}}>
                <Typography sx={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',opacity:0.8,lineHeight:1}}>📅 Click to Select Dates</Typography>
                <Typography sx={{fontSize:'0.88rem',fontWeight:600,mt:0.4,lineHeight:1.2}}>{dateLabel}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
                <Box component="img" src={sacaqmLogo} alt="SACAQM" sx={{height:50,objectFit:'contain',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'}}/>
                <Box sx={{width:2,height:40,bgcolor:'rgba(59,130,246,0.3)',borderRadius:1}}/>
                <Box component="img" src={airsynqLogo} alt="AirSynQ" sx={{height:40,objectFit:'contain',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'}}/>
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{display:'flex',flexDirection:'column',gap:1.5}}>
                <Button fullWidth onClick={()=>{setDownloadLoading(true);setTimeout(()=>setDownloadLoading(false),1500);}} disabled={downloadLoading||!D} startIcon={downloadLoading?<CircularProgress size={14} sx={{color:'white'}}/>:<span>⬇️</span>} sx={{bgcolor:'#0ea5e9',color:'white',borderRadius:3,py:1,fontSize:'0.8rem',fontWeight:600,textTransform:'none','&:hover':{bgcolor:'#0284c7',transform:'translateY(-2px)'},'&:disabled':{bgcolor:'#cbd5e1',color:'white'}}}>
                  {downloadLoading?'Generating...':'Download Report'}
                </Button>
                <Button fullWidth onClick={()=>setShowForecast(p=>!p)} disabled={!D||!F} startIcon={<span>🔮</span>} sx={{bgcolor:showForecast?'#8b5cf6':'white',color:showForecast?'white':'#8b5cf6',borderRadius:3,py:1,fontSize:'0.8rem',fontWeight:600,textTransform:'none',border:'2px solid #8b5cf6','&:hover':{bgcolor:showForecast?'#7c3aed':'rgba(139,92,246,0.08)',transform:'translateY(-2px)'},'&:disabled':{bgcolor:'#f1f5f9',borderColor:'#e2e8f0',color:'#94a3b8'}}}>
                  {showForecast?'Hide Forecast':'Show Forecast'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={()=>setAnchor(null)} anchorOrigin={{vertical:"bottom",horizontal:"right"}} transformOrigin={{vertical:"top",horizontal:"right"}} sx={{"& .MuiPaper-root":{borderRadius:3,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",p:3,mt:1}}}>
          <Box sx={{minWidth:450}}>
            <Typography variant="h6" sx={{mb:2,fontWeight:700,color:"#1e293b",fontSize:'1.1rem'}}>📅 Select Date Range</Typography>
            <Typography sx={{fontSize:'0.75rem',fontWeight:600,color:'#64748b',mb:1,textTransform:'uppercase'}}>Quick Selection</Typography>
            <Box sx={{display:"flex",gap:1,mb:3,flexWrap:"wrap"}}>
              {[["today","Today"],["week","Last 7 Days"],["month","This Month"],["quarter","This Quarter"],["year","This Year"]].map(([p,l])=>(
                <Button key={p} size="small" onClick={()=>applyPreset(p)} sx={{...presetSx,minWidth:80}}>{l}</Button>
              ))}
            </Box>
            <Typography sx={{fontSize:'0.75rem',fontWeight:600,color:'#64748b',mb:1,textTransform:'uppercase'}}>Custom Range</Typography>
            <Box sx={{display:"flex",gap:2,mb:3}}>
              <TextField label="Start Date" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} fullWidth size="small" InputLabelProps={{shrink:true}} sx={{'& .MuiOutlinedInput-root':{borderRadius:2,'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'},'&.Mui-focused .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'}}}}/>
              <TextField label="End Date" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} inputProps={{min:startDate}} fullWidth size="small" InputLabelProps={{shrink:true}} sx={{'& .MuiOutlinedInput-root':{borderRadius:2,'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'},'&.Mui-focused .MuiOutlinedInput-notchedOutline':{borderColor:'#667eea'}}}}/>
            </Box>
            <Box sx={{display:"flex",gap:2,justifyContent:"flex-end"}}>
              <Button onClick={()=>setAnchor(null)} sx={{textTransform:"none",color:'#64748b','&:hover':{bgcolor:'#f1f5f9'}}}>Cancel</Button>
              <Button variant="contained" onClick={applyCustomRange} sx={{bgcolor:"#667eea",textTransform:"none",px:4,fontWeight:600,"&:hover":{bgcolor:"#5568d3"}}}>Apply</Button>
            </Box>
          </Box>
        </Popover>

        {loading&&<Box sx={{display:"flex",flexDirection:"column",alignItems:"center",my:8}}><CircularProgress size={60} sx={{color:"#3b82f6"}}/><Typography sx={{mt:2,color:"#3b82f6",fontWeight:600}}>Loading dashboard data...</Typography></Box>}
        {error&&!loading&&<Alert severity="error" sx={{mb:3,borderRadius:2}} onClose={()=>setError(null)}>{error}</Alert>}

        {!loading&&D&&(
          <>
            {showForecast&&(
              <Box sx={{mb:3,p:2.5,borderRadius:3,background:'linear-gradient(135deg,rgba(139,92,246,0.14),rgba(99,102,241,0.1))',border:'1.5px solid rgba(139,92,246,0.35)',display:'flex',alignItems:'center',gap:2,boxShadow:'0 4px 20px rgba(139,92,246,0.12)'}}>
                <span style={{fontSize:'1.8rem'}}>🤖</span>
                <Box sx={{flex:1}}>
                  <Box sx={{display:'flex',alignItems:'center',gap:1.5,flexWrap:'wrap'}}>
                    <Typography sx={{fontWeight:800,fontSize:'1.15rem',color:'#5b21b6'}}>AI Forecast Mode Active</Typography>
                    <Box sx={{px:1.5,py:0.25,borderRadius:10,background:'linear-gradient(90deg,#7c3aed,#6366f1)',display:'inline-flex',alignItems:'center',gap:0.5}}>
                      <span style={{fontSize:'0.7rem'}}>✦</span>
                      <Typography sx={{fontSize:'0.78rem',fontWeight:700,color:'white',letterSpacing:'0.5px',textTransform:'uppercase'}}>Powered by AI</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{fontSize:'0.95rem',color:'#6d28d9',mt:0.4}}>
                    Showing AI-generated forecasts for next week&nbsp;
                    <Box component="span" sx={{fontWeight:700,color:'#5b21b6'}}>({FORECAST_WEEK_RANGE})</Box>
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{mb:3}}><StationMap/></Box>

            <Grid container spacing={3} sx={{mb:3}}><Grid item xs={12}><Box sx={fadeIn(0)}>
              <ExceedancesTable hourlyData={FC?F.hourlyData:D.hourlyData} thresholds={THRESHOLDS} isForecast={showForecast} forecastWeekLabels={FORECAST_LABELS}/>
            </Box></Grid></Grid>

            <Grid container spacing={3} sx={{mb:3}}><Grid item xs={12}><Box sx={fadeIn(0.1)}>
              <ExceedancesOverTimeChart hourlyData={FC?F.hourlyData:D.hourlyData} thresholds={THRESHOLDS} isForecast={showForecast} forecastWeekLabels={FORECAST_LABELS} forecastWeekRange={showForecast?FORECAST_WEEK_RANGE:null}/>
            </Box></Grid></Grid>

            <Grid container spacing={3} sx={{mb:3}}>
              {[{severity:"moderate",title:"Moderate Exceedances",color:"#fbbf24",delay:0.15},{severity:"high",title:"High Exceedances",color:"#fb923c",delay:0.16},{severity:"veryHigh",title:"Very High Exceedances",color:"#ef4444",delay:0.17}].map(({severity,title,color,delay})=>(
                <Grid item xs={12} md={4} key={severity}><Box sx={fadeIn(delay)}>
                  <ExceedancesSeverityChart hourlyData={FC?F.hourlyData:D.hourlyData} thresholds={THRESHOLDS} severity={severity} title={showForecast?`${title} (Forecast)`:title} color={color} isForecast={showForecast} forecastWeekLabels={FORECAST_LABELS}/>
                </Box></Grid>
              ))}
            </Grid>

            {/* NEW DAILY EXCEEDANCES TABLE */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Box sx={fadeIn(0.18)}>
                  <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>
                      {showForecast ? "Daily PM Exceedances (Forecast)" : "Daily PM Exceedances"}
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Parameter</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Daily Limit</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Exceedance Days</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dailyExcData.map(row => (
                            <TableRow key={row.key}>
                              <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                              <TableCell>{row.limit} µg/m³</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${row.exceedances} / ${row.total} Days`}
                                  size="small"
                                  sx={{
                                    bgcolor: row.exceedances > 0 ? '#fee2e2' : '#dcfce7',
                                    color: row.exceedances > 0 ? '#dc2626' : '#16a34a',
                                    fontWeight: 700
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{mb:3}}>
              {Object.entries(D.pmData).map(([key,widget],idx)=>{
                const d=pw(key)||widget;
                return (<Grid item xs={12} sm={6} lg={3} key={key}><Box sx={fadeIn(0.2+idx*0.1)}>
                  <PMWidget 
                    title={showForecast ? `${widget.title} (Forecast)` : widget.title} 
                    labels={d.labels} 
                    dataPoints={d.values} 
                    threshold={DAILY_THRESHOLDS[key]} // Replaced THRESHOLDS with DAILY_THRESHOLDS
                    trend={widget.trend}
                  />
                </Box></Grid>);
              })}
            </Grid>

            <Grid container spacing={3} sx={{mb:3,alignItems:'stretch'}}>
              <Grid item xs={12} md={4} sx={{display:'flex'}}><Box sx={{...fadeIn(0.6),display:'flex',flex:1,width:'100%'}}>
                <NoiseGauge value={FC?F.noiseData.current:(realtimeNoise??D.noiseData.current)} subLabel={showForecast?"Forecast Period Average":"Daily Average"}/>
              </Box></Grid>
              <Grid item xs={12} md={8} sx={{display:'flex'}}><Box sx={{...fadeIn(0.65),display:'flex',flex:1,width:'100%'}}>
                {(()=>{const d=fw("noiseData");return <NoiseWidget title={showForecast?"Noise Levels (Forecast)":"Noise Levels Over Time"} labels={d.labels} data={d.values} threshold={THRESHOLDS.noise}/>;})()}
              </Box></Grid>
            </Grid>

            <Grid container spacing={3} sx={{mb:3}}>
              <Grid item xs={12} md={D.co2Data.values.some(v=>v>0)?4:6}><Box sx={fadeIn(0.7)}>
                {(()=>{const d=fw("tempData");return <TempWidget title={showForecast?"Temperature (Forecast)":"Temperature"} labels={d.labels} data={d.values} threshold={THRESHOLDS.temperature}/>;})()}
              </Box></Grid>
              <Grid item xs={12} md={D.co2Data.values.some(v=>v>0)?4:6}><Box sx={fadeIn(0.8)}>
                {(()=>{const d=fw("humidityData");return <ParameterWidget title={showForecast?"Humidity (Forecast)":"Humidity"} labels={d.labels} data={d.values} threshold={THRESHOLDS.humidity} unit="%"/>;})()}
              </Box></Grid>
              {D.co2Data.values.some(v=>v>0)&&(<Grid item xs={12} md={4}><Box sx={fadeIn(0.9)}>
                {(()=>{const d=fw("co2Data");return <ParameterWidget title={showForecast?"CO2 (Forecast)":"CO2"} labels={d.labels} data={d.values} threshold={THRESHOLDS.co2} unit=" ppm"/>;})()}
              </Box></Grid>)}
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Box sx={fadeIn(1.0)}>
                {(()=>{const d=fw("noxData");return <ParameterWidget title={showForecast?"NOx (Forecast)":"NOx"} labels={d.labels} data={d.values} threshold={THRESHOLDS.nox} unit=""/>;})()}
              </Box></Grid>
              <Grid item xs={12} md={6}><Box sx={fadeIn(1.1)}>
                {(()=>{const d=fw("vocData");return <ParameterWidget title={showForecast?"VOC (Forecast)":"VOC"} labels={d.labels} data={d.values} threshold={THRESHOLDS.voc} unit=""/>;})()}
              </Box></Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}