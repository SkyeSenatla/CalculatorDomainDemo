// ADDED: useEffect import for the cleanup demo (Day 3 — Step 5)
import { useEffect } from "react";

function Header() {
  // ADDED (Step 5): useEffect with a cleanup function to prevent memory leaks.
  // setInterval runs a "heartbeat" log every second while this component is mounted.
  // The returned cleanup function clears the interval when the component unmounts,
  // preventing it from running forever in the background.
  useEffect(() => {
    const timer = setInterval(() => {
      console.log("Heartbeat: App is active");
    }, 1000);

    return () => {
      clearInterval(timer);
      console.log("Cleanup: Heartbeat stopped");
    };
  }, []);

  return (
    <header>
      <h1>Calculator Dashboard</h1>
    </header>
  );
}

export default Header;
