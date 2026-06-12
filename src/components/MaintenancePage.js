export default function MaintenancePage({ message, siteName, phone }) {
  const defaultMessage = "সাইটটি রক্ষণাবেক্ষণের জন্য বন্ধ রয়েছে। শীঘ্রই ফিরে আসব।";
  const displayMessage = message || defaultMessage;
  const displayName = siteName || "Popular Homeo Center";
  const displayPhone = phone || "+8801720970031";

  return (
    <div style={styles.wrapper}>
      {/* Animated background shapes */}
      <div style={styles.bgShape1} />
      <div style={styles.bgShape2} />
      <div style={styles.bgShape3} />

      <div style={styles.container}>
        {/* Animated icon */}
        <div style={styles.iconWrapper}>
          <div style={styles.iconRing} />
          <div style={styles.iconInner}>
            <i className="fas fa-tools" style={styles.icon} />
          </div>
        </div>

        {/* Site name */}
        <div style={styles.siteName}>
          <i className="fas fa-leaf" style={{ color: "#10a854", marginRight: "10px" }} />
          {displayName}
        </div>

        {/* Heading */}
        <h1 style={styles.heading}>
          রক্ষণাবেক্ষণ চলছে
        </h1>
        <p style={styles.subheading}>Maintenance Mode</p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Message */}
        <p style={styles.message}>{displayMessage}</p>

        {/* Info Cards */}
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <i className="fas fa-clock" style={{ ...styles.infoIcon, color: "#f39c12" }} />
            <div>
              <strong style={styles.infoTitle}>কখন ফিরবে?</strong>
              <span style={styles.infoText}>শীঘ্রই আমরা ফিরে আসব</span>
            </div>
          </div>
          <div style={styles.infoCard}>
            <i className="fas fa-phone-alt" style={{ ...styles.infoIcon, color: "#27ae60" }} />
            <div>
              <strong style={styles.infoTitle}>যোগাযোগ</strong>
              <a href={`tel:${displayPhone}`} style={styles.phoneLink}>{displayPhone}</a>
            </div>
          </div>
        </div>

        {/* Admin login link */}
        {/* <div style={styles.adminArea}>
          <a href="/login" style={styles.adminLink}>
            <i className="fas fa-lock" style={{ marginRight: "6px", fontSize: "11px" }} />
            Admin Login
          </a>
        </div> */}
      </div>

      {/* Inline keyframes via style tag */}
      <style>{`
        @keyframes maintFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes maintFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes maintFloat3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes maintPulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.15); opacity: 0.25; }
        }
        @keyframes maintGearSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes maintFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a2e1a 0%, #0d4a2a 30%, #09462a 60%, #062e1a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', 'Tiro Bangla', 'Poppins', sans-serif",
  },
  bgShape1: {
    position: "absolute",
    top: "-10%",
    right: "-5%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(16,168,84,0.12), transparent 70%)",
    borderRadius: "50%",
    animation: "maintFloat 8s ease-in-out infinite",
  },
  bgShape2: {
    position: "absolute",
    bottom: "-15%",
    left: "-10%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(252,167,55,0.08), transparent 70%)",
    borderRadius: "50%",
    animation: "maintFloat2 10s ease-in-out infinite",
  },
  bgShape3: {
    position: "absolute",
    top: "40%",
    left: "60%",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)",
    borderRadius: "50%",
    animation: "maintFloat3 6s ease-in-out infinite",
  },
  container: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    padding: "50px 44px",
    maxWidth: "540px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    zIndex: 10,
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
    animation: "maintFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  iconWrapper: {
    position: "relative",
    width: "90px",
    height: "90px",
    margin: "0 auto 24px",
  },
  iconRing: {
    position: "absolute",
    inset: "0",
    borderRadius: "50%",
    border: "3px solid rgba(252, 167, 55, 0.2)",
    animation: "maintPulse 3s ease-in-out infinite",
  },
  iconInner: {
    position: "absolute",
    inset: "8px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(252, 167, 55, 0.15), rgba(244, 136, 64, 0.1))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
  },
  icon: {
    fontSize: "30px",
    color: "#fca737",
    animation: "maintGearSpin 8s linear infinite",
  },
  siteName: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: "0.5px",
    marginBottom: "16px",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 4px",
    lineHeight: "1.3",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.35)",
    margin: "0 0 20px",
    fontWeight: "500",
    letterSpacing: "2px",
    textTransform: "uppercase",
  },
  divider: {
    width: "60px",
    height: "3px",
    background: "linear-gradient(90deg, #fca737, #f48840)",
    margin: "0 auto 24px",
    borderRadius: "2px",
  },
  message: {
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.65)",
    lineHeight: "1.8",
    margin: "0 0 30px",
    maxWidth: "420px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  infoGrid: {
    display: "flex",
    gap: "12px",
    marginBottom: "28px",
  },
  infoCard: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "12px",
    textAlign: "left",
  },
  infoIcon: {
    fontSize: "18px",
    flexShrink: 0,
  },
  infoTitle: {
    display: "block",
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "2px",
  },
  infoText: {
    display: "block",
    fontSize: "11px",
    color: "rgba(255, 255, 255, 0.4)",
  },
  phoneLink: {
    display: "block",
    fontSize: "12px",
    color: "#10a854",
    textDecoration: "none",
    fontWeight: "600",
  },
  adminArea: {
    paddingTop: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  adminLink: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.3)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 16px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    transition: "all 0.3s ease",
  },
};
