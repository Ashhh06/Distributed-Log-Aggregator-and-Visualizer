import fetch from "node-fetch";

const levels = ["INFO", "ERROR", "WARN"];

setInterval(async () => {

  const log = {
    service: "payment",
    level: levels[Math.floor(Math.random() * levels.length)],
    message: "payment event",
    timestamp: Date.now()
  };

  await fetch("http://localhost:3000/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(log)
  });

  console.log("Payment log sent");

}, 1500);
