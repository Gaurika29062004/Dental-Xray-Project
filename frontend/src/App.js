import React, { useState, useEffect } from "react";
import WelcomeScreen from "./WelcomeScreen";
import html2pdf from "html2pdf.js";
import "./App.css";
function AppMain() {
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleSubmit = async () => {
    if (!selectedFile || !patientName || !patientAge || !patientGender) {
      alert("Please complete all fields and select a DICOM file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsLoading(true);
    setImageData(null);
    setReport("");

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
    method: "POST",
    body: formData,
});


      const data = await response.json();

      if (data.annotated_image && data.report) {
        setImageData(data.annotated_image);

        const fullReport = `
Patient Name: ${patientName}
Age: ${patientAge}
Gender: ${patientGender.toUpperCase()}

Findings:
${data.report.trim()}
        `.trim();

        setReport(fullReport);
      } else {
        alert("Failed to get response from backend.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReportAsPDF = () => {
    if (!report || !imageData) return;

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="
        text-align: center; 
        font-family: 'Segoe UI', sans-serif; 
        background-color: white; 
        color: black; 
        padding: 20px;
        ">
        <div style="font-size: 28px; font-weight: bold;">🦷 Smile Dental Hospital</div>
        <div style="font-size: 14px; margin-bottom: 10px;">
          123 Radiology Lane, Tooth City<br />
          📞 +91-9876543210
        </div>
        <hr style="margin: 10px 0; border-color: #000;" />
        <h2 style="text-align: left; color: black;">Diagnostic Report</h2>
        <img src="data:image/jpeg;base64,${imageData}" alt="Annotated X-ray" style="width:100%; margin-bottom: 10px; border: 1px solid #ccc;" />
        <pre style="
          font-size: 14px; 
          white-space: pre-wrap; 
          text-align: left; 
          background-color: white; 
          color: black; 
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ddd;
        ">${report}</pre>
      </div>
    `;

    html2pdf()
      .from(element)
      .set({
        margin: 10,
        filename: `diagnostic_report.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save();
  };

  return (
    <div className={`container ${theme}`}>
      <div className="panel">
        <div className="toggle-switch">
          <button onClick={handleThemeToggle}>
            {theme === "light" ? "Dark" : "Light"} Mode
          </button>
        </div>

        <h2>Patient Information</h2>
        <input
          type="text"
          placeholder="Enter Patient Name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Enter Age"
          value={patientAge}
          onChange={(e) => setPatientAge(e.target.value)}
        />
        <select
          value={patientGender}
          onChange={(e) => setPatientGender(e.target.value)}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <h2>Upload DICOM File</h2>
        <input
          type="file"
          accept=".dcm"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

        <button className="generate-btn" onClick={handleSubmit} disabled={isLoading}>
          Generate Report
        </button>

        {report && (
          <button className="generate-btn" onClick={downloadReportAsPDF}>
            Download Report as PDF
          </button>
        )}

        {isLoading && <div className="loading">Processing...</div>}
      </div>

      <div className="panel report-panel">
        <h2>X-ray Image</h2>
        {imageData ? (
          <div className="image-container">
            <img
              src={`data:image/jpeg;base64,${imageData}`}
              alt="Annotated DICOM"
            />
          </div>
        ) : (
          <p>No image generated yet.</p>
        )}

        <h2>Diagnostic Report</h2>
        {report ? (
          <pre className="report-text">{report}</pre>
        ) : (
          <p>No report generated yet.</p>
        )}
      </div>
    </div>
  );
}

function App() {
  const [showMainApp, setShowMainApp] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const handleContinue = () => {
    setFadeOut(true);
    setTimeout(() => setShowMainApp(true), 500);
  };

  return showMainApp ? (
    <AppMain />
  ) : (
    <div className={`welcome-container ${fadeOut ? "fade-out" : "fade-in"}`}>
      <WelcomeScreen onStart={handleContinue} />
    </div>
  );
}

export default App;
