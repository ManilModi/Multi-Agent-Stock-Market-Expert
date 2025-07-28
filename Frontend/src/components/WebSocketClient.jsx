// src/components/WebSocketClient.jsx
import React, { useEffect, useRef } from 'react';

const WebSocketClient = ({ params }) => {
  const ws = useRef(null);

  useEffect(() => {
    // Connect to the WebSocket server
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      console.log('✅ Connected to WebSocket Server');

      // Send params to backend to trigger FastAPI
      if (params) {
        ws.current.send(JSON.stringify(params));
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error('❌ WebSocket Error:', data.error);
      } else {
        console.log('📥 Received Data:', data);
        // You can call a state updater here to render the records
      }
    };

    ws.current.onclose = () => {
      console.log('🔌 WebSocket Disconnected');
    };

    return () => {
      ws.current.close();
    };
  }, [params]); // Reconnect when params change

  return <div>📡 Listening to WebSocket...</div>;
};

export default WebSocketClient;
