// LiveNews.js
import React, { useEffect, useState } from "react";

const LiveNews = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/newsfeed");

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send("Hello server"); // Optional, for handshake
    };

    socket.onmessage = (event) => {
      console.log("Received from server:", event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">📡 Live News Feed</h2>
      <div className="bg-gray-100 p-3 rounded-lg max-h-60 overflow-y-scroll">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2 text-sm text-gray-800">
            • {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveNews;
