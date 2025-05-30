import React from "react";
import "./WelcomeScreen.css";
import logo from "./logo.png"; // Ensure logo.png is in src/

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="welcome-screen minimal-theme">
      <img src={logo} alt="App Logo" className="logo" />
      <h1 className="main-title">AI-Powered Dental Imaging</h1>
      <p className="subtitle">Advanced diagnostics. Instant reports. Zero hassle.</p>
      <button className="start-btn" onClick={onStart}>
        Launch App
      </button>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <h3>Upload DICOM</h3>
            <p>Securely add X-ray or CT scan data for processing.</p>
          </div>
          <div className="feature-card">
            <h3>Annotate</h3>
            <p>Draw directly on images. Highlight important findings.</p>
          </div>
          <div className="feature-card">
            <h3>AI Diagnosis</h3>
            <p>Let smart models guide your clinical decisions.</p>
          </div>
          <div className="feature-card">
            <h3>Generate Report</h3>
            <p>Download clean, professional reports in PDF format.</p>
          </div>
        </div>
      </section>
    </div>
  );
};


export default WelcomeScreen;
