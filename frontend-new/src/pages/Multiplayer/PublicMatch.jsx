import { useEffect, useState, useContext } from "react"; // 1. Import useContext
import { useNavigate } from "react-router-dom";
import socket from "../../hooks/useSocket";
import { AuthContext } from "../../context/AuthContext"; // 2. Import AuthContext

export default function PublicMatch() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // 3. Get User info from Context
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    socket.on("waiting_for_match", () => {
      setStatus("searching");
    });

    socket.on("match_found", ({ roomId }) => {
      setStatus("found");
      setTimeout(() => {
        navigate(`/game/${roomId}`);
      }, 1000);
    });

    return () => {
      socket.off("waiting_for_match");
      socket.off("match_found");
    };
  }, [navigate]);

  const findMatch = () => {
    setStatus("searching");
    // 4. THIS IS THE CRITICAL FIX 👇
    // We send the user ID so the backend can map you for stats!
    socket.emit("find_match", { userId: user?.id }); 
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
            ← Dashboard
          </button>
        </div>

        <h2 style={styles.title}>Public Arena</h2>
        <p style={styles.subtitle}>Queue up to race a random opponent!</p>

        <div style={styles.statusContainer}>
          {status === "idle" && (
            <>
              <div style={styles.icon}>😁🥶</div>
              <button onClick={findMatch} style={styles.mainBtn}>
                Find Match
              </button>
            </>
          )}

          {status === "searching" && (
            <>
              <div style={styles.spinner}>⏳</div>
              <h3 style={styles.statusText}>Searching for opponent...</h3>
              <p style={styles.statusSub}>Please wait, do not refresh.</p>
            </>
          )}

          {status === "found" && (
            <>
              <div style={styles.icon}>⚔️</div>
              <h3 style={{...styles.statusText, color: "#10b981"}}>MATCH FOUND!</h3>
              <p style={styles.statusSub}>Entering the arena...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f1f8f3ff 0%, #91f8abff 100%)",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    border: "3px solid #10b981",
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "20px",
  },
  backBtn: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#10b981",
    backgroundColor: "transparent",
    border: "2px solid #10b981",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 10px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 40px 0",
  },
  statusContainer: {
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "20px",
    border: "1px dashed #d1d5db",
  },
  icon: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  spinner: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  mainBtn: {
    padding: "15px 40px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
    transition: "transform 0.2s",
  },
  statusText: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 10px 0",
  },
  statusSub: {
    color: "#6b7280",
    fontSize: "14px",
  },
};