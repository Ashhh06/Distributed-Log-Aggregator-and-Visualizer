import fetch from "node-fetch";

const services = ["auth"];
const levels = ["INFO", "ERROR", "DEBUG", "WARN"];

function randomLevel() {
    return levels[Math.floor(Math.random() * levels.length)];
}

setInterval(async () => {
    const log = {
        service: "auth",
        level: randomLevel(),
        message: "auth event",
        timestamp: Date.now()
    };

    await fetch("http://localhost:3000/logs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(log)
    });

    console.log("Auth log sent");
}, 1000);