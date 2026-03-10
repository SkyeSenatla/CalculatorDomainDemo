import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

export function useSignalR(
  onCalculationCreated?: (data: unknown) => void,
  onCalculationDeactivated?: (data: { id: string }) => void
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const hubUrl = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL;
    if (!hubUrl) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.on("CalculationCreated", (data) => {
      if (onCalculationCreated) onCalculationCreated(data);
    });

    connection.on("CalculationDeactivated", (data) => {
      if (onCalculationDeactivated) onCalculationDeactivated(data);
    });

    connection
      .start()
      .then(() => console.log("SignalR Connected!"))
      .catch((err) => console.error("SignalR Connection Error:", err));

    return () => {
      connection.stop().then(() => console.log("SignalR Disconnected (cleanup)"));
    };
  }, []);

  return connectionRef;
}

export default useSignalR;
