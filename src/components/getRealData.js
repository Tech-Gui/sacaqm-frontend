import { getData, requestData } from "./realData.js";

// export function getSensor(sensor){
//     if(sensor){
//       var request = requestData(sensor);
//     }
//     else{
//       var request = requestData("350457790740979");
//     }

//     var { dates, pm1p0, pm2p5, pm4p0, pm10p0, temperature, humidity } = getData(request);

//     return {dates, pm1p0, pm2p5, pm4p0, pm10p0, temperature, humidity }
// }

export function sendData(sensorId, period) {
  // var request = requestData("350457790740979");
  var request = requestData(sensorId, period);

  var { dates, pm1p0, pm2p5, pm4p0, pm10p0, temperature, humidity } =
    getData(request);

  const Temperature = {
    labels: dates,
    datasets: [
      {
        label: "Temperature",
        data: temperature,
        fill: true,
        backgroundColor: function (context) {
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(88, 130, 239, 1)");
          gradient.addColorStop(0.25, "rgba(88, 130, 239, 0.75)");
          gradient.addColorStop(0.5, "rgba(88, 130, 239, 0.5)");
          gradient.addColorStop(0.75, "rgba(88, 130, 239, 0.25)");
          gradient.addColorStop(1, "rgba(88, 130, 239, 0.0)");
          return gradient;
        },
        borderColor: "#8fbaff",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#8fbaff",
        pointBorderWidth: 2,
      },
    ],
  };

  const Humidity = {
    labels: dates,
    datasets: [
      {
        label: "Humidity",
        data: humidity,
        fill: true,
        backgroundColor: function (context) {
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(88, 130, 239, 1)");
          gradient.addColorStop(0.25, "rgba(88, 130, 239, 0.75)");
          gradient.addColorStop(0.5, "rgba(88, 130, 239, 0.5)");
          gradient.addColorStop(0.75, "rgba(88, 130, 239, 0.25)");
          gradient.addColorStop(1, "rgba(88, 130, 239, 0.0)");
          return gradient;
        },
        borderColor: "#ee6ff7",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ee6ff7",
        pointBorderWidth: 2,
      },
    ],
  };

  const Pm1p0 = {
    labels: dates,
    datasets: [
      {
        label: "Pm1p0",
        data: pm1p0,
        fill: true,
        backgroundColor: function (context) {
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(88, 130, 239, 1)");
          gradient.addColorStop(0.25, "rgba(88, 130, 239, 0.75)");
          gradient.addColorStop(0.5, "rgba(88, 130, 239, 0.5)");
          gradient.addColorStop(0.75, "rgba(88, 130, 239, 0.25)");
          gradient.addColorStop(1, "rgba(88, 130, 239, 0.0)");
          return gradient;
        },
        borderColor: "#a8ff96",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#a8ff96",
        pointBorderWidth: 2,
      },
    ],
  };

  const Pm2p5 = {
    labels: dates,
    datasets: [
      {
        label: "Pm2p5",
        data: pm2p5,
        fill: true,
        backgroundColor: function (context) {
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(88, 130, 239, 1)");
          gradient.addColorStop(0.25, "rgba(88, 130, 239, 0.75)");
          gradient.addColorStop(0.5, "rgba(88, 130, 239, 0.5)");
          gradient.addColorStop(0.75, "rgba(88, 130, 239, 0.25)");
          gradient.addColorStop(1, "rgba(88, 130, 239, 0.0)");
          return gradient;
        },
        borderColor: "#ff3838",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ff3838",
        pointBorderWidth: 2,
      },
    ],
  };

  
  const Pm4p0 = {
    labels: dates,
    datasets: [
      {
        label: "Pm4p0",
        data: pm4p0,
        fill: true,
        backgroundColor: function (context) {
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(88, 130, 239, 1)");
          gradient.addColorStop(0.25, "rgba(88, 130, 239, 0.75)");
          gradient.addColorStop(0.5, "rgba(88, 130, 239, 0.5)");
          gradient.addColorStop(0.75, "rgba(88, 130, 239, 0.25)");
          gradient.addColorStop(1, "rgba(88, 130, 239, 0.0)");
          return gradient;
        },
        borderColor: "#ee6ff7",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#ee6ff7",
        pointBorderWidth: 2,
      },
    ],
  };

  const Pm10p0 = {
    labels: dates,
    datasets: [
      {
        label: "Pm10p0",
        data: pm10p0,
        fill: true,
        backgroundColor: function (context) {
          var ctx = context.chart.ctx;
          var gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(88, 130, 239, 1)");
          gradient.addColorStop(0.25, "rgba(88, 130, 239, 0.75)");
          gradient.addColorStop(0.5, "rgba(88, 130, 239, 0.5)");
          gradient.addColorStop(0.75, "rgba(88, 130, 239, 0.25)");
          gradient.addColorStop(1, "rgba(88, 130, 239, 0.0)");
          return gradient;
        },
        borderColor: "#4e1bb4",
        tension: 0.4,
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "#FFFFFF",
        // pointRadius: 3,
        pointBorderColor: "#4e1bb4",
        pointBorderWidth: 2,
      },
    ],
  };

  return { dates, Pm1p0, Pm2p5, Pm4p0, Pm10p0, Temperature, Humidity };
}
