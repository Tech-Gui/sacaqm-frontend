import $ from "jquery";

// test function to see if the database is respoding , returns a list of the sensors
export function loadSensors() {
  $.ajax({
    url: "https://sacaqm.web.cern.ch/dbread.php",
    type: "get",
    data: { cmd: "get_sensors" },
    success: function (data) {
      console.log(data);
    },
  });
}

// formats the date to a way that is compatible with the data in the server
function formatDate(date) {
  return (
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1 < 10 ? "0" : "") +
    (date.getMonth() + 1) +
    "-" +
    (date.getDate() < 10 ? "0" : "") +
    date.getDate()
  );
}

// makes the api call to the database as per the request made by the request function
export function getData(request) {
  var returnedData;
  var p;
  var dates = [];
  var pm1p0 = [];
  var pm2p5 = [];
  var pm4p0 = [];
  var pm10p0 = [];
  var humidity = [];
  var temperature = [];

  $.ajax({
    url: "https://sacaqm.web.cern.ch/dbread.php",
    type: "get",
    data: request,
    success: function (data) {
      // console.log(data);
      var points = JSON.parse(data);

      for (p of points) {
        dates.push(p["timestamp"]);
        var date = new Date();
        date.setFullYear(parseInt(p["timestamp"].split(" ")[0].split("-")[0]));
        date.setMonth(parseInt(p["timestamp"].split(" ")[0].split("-")[1]) - 1);
        date.setDate(parseInt(p["timestamp"].split(" ")[0].split("-")[2]));
        date.setHours(parseInt(p["timestamp"].split(" ")[1].split(":")[0]));
        date.setMinutes(parseInt(p["timestamp"].split(" ")[1].split(":")[1]));
        date.setSeconds(parseInt(p["timestamp"].split(" ")[1].split(":")[2]));
        pm1p0.push({ x: date.getTime(), y: parseFloat(p["pm1p0"]) });
        pm2p5.push({ x: date.getTime(), y: parseFloat(p["pm2p5"]) });
        pm4p0.push({ x: date.getTime(), y: parseFloat(p["pm4p0"]) });
        pm10p0.push({ x: date.getTime(), y: parseFloat(p["pm10p0"]) });
        humidity.push({ x: date.getTime(), y: parseFloat(p["humidity"]) });
        temperature.push({
          x: date.getTime(),
          y: parseFloat(p["temperature"]),
        });
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      // Log the error details here
      console.error("Error:", textStatus, errorThrown);
      console.error("Request:", jqXHR.responseText);
    },
  });

  // calculation of the averages and other data must take place here.
  // console.log(length(temperature))

  return { dates, pm1p0, pm2p5, pm4p0, pm10p0, temperature, humidity };
}

// creates the parameters for the data to be requested
export function requestData(sensorId , period) {
  var request = { cmd: "get_sen55" };

  if(period === "Today"){
    var date = new Date();
    date.setDate(date.getDate()-0.5);
    request["from"]=formatDate(date);
    request["from"]+=" "+date.getHours()+":"+(date.getMinutes()<10?"0":"")+date.getMinutes()+":"+(date.getSeconds()<10?"0":"")+date.getSeconds();
      
  }
  else if(period === "7Days"){
    var date = new Date();
    date.setDate(date.getDate()-7);
    request["from"]=formatDate(date);
  }
  else if(period === "LastDay"){
    var date = new Date();
    date.setDate(date.getDate()-1);
    request["from"]=formatDate(date);

  }
  else{
    var date = new Date();
    date.setDate(date.getDate()-30);
    request["from"]=formatDate(date);
  }

  request["sensor_id"] = sensorId;

  return request;
}
