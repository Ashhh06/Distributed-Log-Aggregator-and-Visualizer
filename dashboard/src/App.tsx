import { useState, useEffect } from "react";

function App() {
  const [logs, setLogs] = useState<any[]>([]);
  const [service, setService] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 2000);

    return () => clearInterval(interval);
  }, [service, level]);

  const fetchLogs = async () => {
    const query: any = {};

    if (service) query.service = service;
    if (level) query.level = level;

    const res = await fetch("http://localhost:3000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query)
    });

    const data = await res.json();
    console.log("Logs received:", data);

    setLogs(data);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "#ff4d4f"; 
      case "WARN":
        return "#faad14"; 
      case "INFO":
        return "#52c41a";
      case "DEBUG":
        return "#8c8c8c";
      default:
        return "black";
    }
  };


  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>

      <h1>Distributed Log Aggregator and Visualizer</h1>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>

        <input
          placeholder="Service (auth/payment)"
          value={service}
          onChange={(e) => setService(e.target.value)}
        />

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        <button
          onClick={fetchLogs}
          style={{ marginLeft: "10px" }}
        >
          Search
        </button>

      </div>

      {/* Logs Table */}

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Service</th>
            <th>Level</th>
            <th>Message</th>
            <th>Timestamp</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log, i) => (
            <tr key={i}>
              <td>{log.service}</td>
              <td style={{ color: getLevelColor(log.level), fontWeight: "bold" }}>{log.level}</td>
              <td>{log.message}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default App;