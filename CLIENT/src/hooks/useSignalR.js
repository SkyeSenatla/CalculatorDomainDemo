// SignalR Hook — Real-Time Connection Lifecycle
// Connection:    Create HubConnection when the component mounts
// Subscription:  Listen for specific events ("CalculationCreated", etc.)
// Action:        Update React state when events fire
// Cleanup:       Disconnect when the component unmounts (prevent ghost connections!)

import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

export function useSignalR(onCalculationCreated, onCalculationDeactivated) {
  // useRef persists the connection across renders without causing re-renders
  const connectionRef = useRef(null);

  useEffect(() => {
    // Create the connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5152/hubs/calculations")
      .withAutomaticReconnect()   // Auto-reconnect on network drops
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    // Listen for "CalculationCreated" events from the server
    connection.on("CalculationCreated", (data) => {
      console.log("SignalR >>> CalculationCreated:", data);
      if (onCalculationCreated) {
        onCalculationCreated(data);
      }
    });

    // Listen for "CalculationDeactivated" events
    connection.on("CalculationDeactivated", (data) => {
      console.log("SignalR >>> CalculationDeactivated:", data);
      if (onCalculationDeactivated) {
        onCalculationDeactivated(data);
      }
    });

    // Start the connection
    connection
      .start()
      .then(() => console.log("SignalR Connected!"))
      .catch((err) => console.error("SignalR Connection Error:", err));

    // Cleanup on unmount — without this, the WebSocket stays open forever (ghost connection)
    return () => {
      connection
        .stop()
        .then(() => console.log("SignalR Disconnected (cleanup)"));
    };
  }, []); // Empty deps = run once on mount

  return connectionRef;
}

export default useSignalR;
