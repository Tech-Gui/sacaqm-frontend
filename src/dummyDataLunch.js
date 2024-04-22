// dummyData.js

const dummyDataLunch = {
  labels: [
    "10:00",
    "10:05",
    "10:10",
    "10:15",
    "10:20",
    "10:25",
    "10:30",
    "10:35",
    "10:40",
    "10:45",
    "10:50",
    "10:55",
  ],
  //Labels are basically timestamps.
  datasets: [
    {
      label: "PM2.5",
      data: [5, 5, 4, 3, 6, 4, 12, 8, 5, 13, 10, 8], // PM readings...
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

export default dummyDataLunch;
