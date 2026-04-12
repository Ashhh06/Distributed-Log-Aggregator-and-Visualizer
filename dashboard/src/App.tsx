import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

function App() {
  const [logs, setLogs] = useState<any[]>([]);
  const [service, setService] = useState("");
  const [level, setLevel] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [service, level, startTime, endTime]);

  const fetchLogs = async () => {
    const query: any = {};
    if (service) query.service = service;
    if (level) query.level = level;
    if (startTime) query.startTime = new Date(startTime).getTime();
    if (endTime) query.endTime = new Date(endTime).getTime();

    const res = await fetch("http://localhost:3000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });

    const data = await res.json();
    setLogs(data);
  };

  const stats = {
    INFO: logs.filter((l) => l.level === "INFO").length,
    WARN: logs.filter((l) => l.level === "WARN").length,
    ERROR: logs.filter((l) => l.level === "ERROR").length,
    DEBUG: logs.filter((l) => l.level === "DEBUG").length,
  };

  const chartData = [
    { level: "INFO", count: stats.INFO },
    { level: "WARN", count: stats.WARN },
    { level: "ERROR", count: stats.ERROR },
    { level: "DEBUG", count: stats.DEBUG },
  ];

  // 🔥 Better grouping (by minute instead of raw seconds)
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
  const timeMap = new Map();
  sortedLogs.forEach((log) => {
    const date = new Date(log.timestamp);
    const key = date.toLocaleTimeString(); // cleaner buckets
    timeMap.set(key, (timeMap.get(key) || 0) + 1);
  });

  const timeChartData = Array.from(timeMap.entries()).map(
    ([time, count]) => ({ time, count })
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "#ef4444";
      case "WARN":
        return "#f59e0b";
      case "INFO":
        return "#22c55e";
      case "DEBUG":
        return "#94a3b8";
      default:
        return "#ffffff";
    }
  };

  return (
    <div
      style={{
        background: "#0a0f1c",
        color: "#e5e7eb",
        minHeight: "100vh",
        width: "100%",
        padding: "30px",
        boxSizing: "border-box",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ marginBottom: "25px" }}>
        Log Aggregation Dashboard
      </h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", flexWrap: "wrap" }}>
        <input placeholder="Service" value={service} onChange={(e) => setService(e.target.value)} />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="DEBUG">DEBUG</option>
        </select>
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <button onClick={fetchLogs}>Search</button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
        {Object.entries(stats).map(([key, val]) => (
          <div
            key={key}
            style={{
              background: "#121a2b",
              padding: "18px",
              borderRadius: "8px",
              minWidth: "120px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#9ca3af" }}>{key}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>

        {/* Log Levels */}
        <div style={{ flex: 1, minWidth: "300px", background: "#121a2b", padding: "20px", borderRadius: "8px" }}>
          <h3 style={{ marginBottom: "10px" }}>Log Levels</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="#1f2a44" />
              <XAxis dataKey="level" stroke="#cbd5f5" />
              <YAxis stroke="#cbd5f5" />
              <Tooltip />
              <Bar dataKey="count" fill="#4f7cff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Logs Over Time (LINE CHART 🔥) */}
        <div style={{ flex: 1, minWidth: "300px", background: "#121a2b", padding: "20px", borderRadius: "8px" }}>
          <h3 style={{ marginBottom: "10px" }}>Logs Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeChartData}>
              <CartesianGrid stroke="#1f2a44" />
              <XAxis dataKey="time" stroke="#cbd5f5" />
              <YAxis stroke="#cbd5f5" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: "100%", background: "#121a2b", borderRadius: "8px" }}>
        <thead>
          <tr>
            {["Service", "Level", "Message", "Timestamp"].map((h) => (
              <th key={h} style={{ padding: "12px", color: "#9ca3af" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {logs.slice(0, 200).map((log, i) => (
            <tr key={i}>
              <td style={{ padding: "10px" }}>{log.service}</td>
              <td style={{ color: getLevelColor(log.level), fontWeight: "bold" }}>
                {log.level}
              </td>
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