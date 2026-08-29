import React, { useState } from "react";

const ToothSVG = ({ toothNumber, state, onSurfaceClick, readOnly = false }) => {
  // FDI convention: right side of patient is left side of chart (teeth 18..11, 55..51, 85..81, 48..41)
  const isRightSide = [
    18, 17, 16, 15, 14, 13, 12, 11, 
    55, 54, 53, 52, 51, 
    85, 84, 83, 82, 81, 
    48, 47, 46, 45, 44, 43, 42, 41
  ].includes(Number(toothNumber));

  const getFill = (surface) => {
    if (state === "missing") return "none";
    
    // Map the surface names
    const status = state?.[surface];
    if (status === "caries") return "#ef4444"; // Bright red
    if (status === "restored") return "#3b82f6"; // Bright blue
    return "#ffffff"; // Healthy white
  };

  const handlePolygonClick = (surface) => {
    if (readOnly) return;
    onSurfaceClick(toothNumber, surface);
  };

  return (
    <div className="tooth-item" style={{ display: "inline-block", width: "26px", margin: "1px", textAlign: "center" }}>
      <div className="tooth-number" style={{ fontSize: "10px", fontWeight: "bold", color: "#333", marginBottom: "2px" }}>
        {toothNumber}
      </div>
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 30 30" 
        style={{ 
          display: "block", 
          margin: "0 auto", 
          background: state === "missing" ? "transparent" : "#fff",
          transition: "all 0.2s ease"
        }}
      >
        {/* Top surface (Vestibular/Bucal) */}
        <polygon
          points="0,0 30,0 20,10 10,10"
          fill={getFill("vestibular")}
          stroke="#333"
          strokeWidth="1.2"
          onClick={() => handlePolygonClick("vestibular")}
          style={{ cursor: readOnly ? "default" : "pointer" }}
          title={`${toothNumber} - Vestibular`}
        />
        {/* Right surface (Mesial for patient right side, Distal for patient left side) */}
        <polygon
          points="30,0 30,30 20,20 20,10"
          fill={getFill(isRightSide ? "mesial" : "distal")}
          stroke="#333"
          strokeWidth="1.2"
          onClick={() => handlePolygonClick(isRightSide ? "mesial" : "distal")}
          style={{ cursor: readOnly ? "default" : "pointer" }}
          title={`${toothNumber} - ${isRightSide ? "Mesial" : "Distal"}`}
        />
        {/* Bottom surface (Palatina/Lingual) */}
        <polygon
          points="10,20 20,20 30,30 0,30"
          fill={getFill("lingual")}
          stroke="#333"
          strokeWidth="1.2"
          onClick={() => handlePolygonClick("lingual")}
          style={{ cursor: readOnly ? "default" : "pointer" }}
          title={`${toothNumber} - Lingual`}
        />
        {/* Left surface (Distal for patient right side, Mesial for patient left side) */}
        <polygon
          points="0,0 10,10 10,20 0,30"
          fill={getFill(isRightSide ? "distal" : "mesial")}
          stroke="#333"
          strokeWidth="1.2"
          onClick={() => handlePolygonClick(isRightSide ? "distal" : "mesial")}
          style={{ cursor: readOnly ? "default" : "pointer" }}
          title={`${toothNumber} - ${isRightSide ? "Distal" : "Mesial"}`}
        />
        {/* Center surface (Oclusal/Incisal) */}
        <polygon
          points="10,10 20,10 20,20 10,20"
          fill={getFill("oclusal")}
          stroke="#333"
          strokeWidth="1.2"
          onClick={() => handlePolygonClick("oclusal")}
          style={{ cursor: readOnly ? "default" : "pointer" }}
          title={`${toothNumber} - Oclusal`}
        />
        {/* Cross if tooth is missing */}
        {state === "missing" && (
          <>
            <line x1="2" y1="2" x2="28" y2="28" stroke="#ef4444" strokeWidth="2.5" />
            <line x1="28" y1="2" x2="2" y2="28" stroke="#ef4444" strokeWidth="2.5" />
          </>
        )}
      </svg>
    </div>
  );
};

export default function Odontograma({ odontogramaState = {}, onToothUpdate, readOnly = false }) {
  const [activeTool, setActiveTool] = useState("caries"); // "caries", "restored", "missing", "clear"

  const handleSurfaceClick = (tooth, surface) => {
    if (readOnly) return;
    
    const toothState = odontogramaState[tooth];
    
    if (activeTool === "missing") {
      onToothUpdate(tooth, "all", toothState === "missing" ? "none" : "missing");
    } else if (activeTool === "clear") {
      onToothUpdate(tooth, surface, "none");
    } else {
      // Toggle the selected tool status
      const currentStatus = toothState?.[surface];
      const nextStatus = currentStatus === activeTool ? "none" : activeTool;
      onToothUpdate(tooth, surface, nextStatus);
    }
  };

  const handleToothHeaderClick = (tooth) => {
    if (readOnly) return;
    if (activeTool === "missing") {
      const toothState = odontogramaState[tooth];
      onToothUpdate(tooth, "all", toothState === "missing" ? "none" : "missing");
    } else if (activeTool === "clear") {
      onToothUpdate(tooth, "all", "none");
    }
  };

  // Group definitions
  const adultUpperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const adultUpperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  
  const childUpperRight = [55, 54, 53, 52, 51];
  const childUpperLeft = [61, 62, 63, 64, 65];

  const childLowerRight = [85, 84, 83, 82, 81];
  const childLowerLeft = [71, 72, 73, 74, 75];

  const adultLowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const adultLowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const renderToothList = (teeth) => {
    return teeth.map((num) => (
      <div key={num} style={{ display: "inline-block" }} onDoubleClick={() => handleToothHeaderClick(num)}>
        <ToothSVG
          toothNumber={num}
          state={odontogramaState[num]}
          onSurfaceClick={handleSurfaceClick}
          readOnly={readOnly}
        />
      </div>
    ));
  };

  return (
    <div className="odontograma-widget">
      {!readOnly && (
        <div className="odontograma-toolbar" style={{ display: "flex", gap: "10px", marginBottom: "12px", justifyContent: "center" }}>
          <button 
            type="button" 
            className={`btn-tool caries ${activeTool === "caries" ? "active" : ""}`}
            onClick={() => setActiveTool("caries")}
            style={{
              padding: "6px 12px",
              border: "1px solid #ef4444",
              background: activeTool === "caries" ? "#ef4444" : "transparent",
              color: activeTool === "caries" ? "#fff" : "#ef4444",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px"
            }}
          >
            🔴 Caries
          </button>
          <button 
            type="button" 
            className={`btn-tool restored ${activeTool === "restored" ? "active" : ""}`}
            onClick={() => setActiveTool("restored")}
            style={{
              padding: "6px 12px",
              border: "1px solid #3b82f6",
              background: activeTool === "restored" ? "#3b82f6" : "transparent",
              color: activeTool === "restored" ? "#fff" : "#3b82f6",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px"
            }}
          >
            🔵 Restauración
          </button>
          <button 
            type="button" 
            className={`btn-tool missing ${activeTool === "missing" ? "active" : ""}`}
            onClick={() => setActiveTool("missing")}
            style={{
              padding: "6px 12px",
              border: "1px solid #374151",
              background: activeTool === "missing" ? "#374151" : "transparent",
              color: activeTool === "missing" ? "#fff" : "#374151",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px"
            }}
          >
            ❌ Ausente
          </button>
          <button 
            type="button" 
            className={`btn-tool clear ${activeTool === "clear" ? "active" : ""}`}
            onClick={() => setActiveTool("clear")}
            style={{
              padding: "6px 12px",
              border: "1px solid #6b7280",
              background: activeTool === "clear" ? "#6b7280" : "transparent",
              color: activeTool === "clear" ? "#fff" : "#6b7280",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px"
            }}
          >
            🧹 Borrar
          </button>
        </div>
      )}

      {/* Teeth Layout Grid */}
      <div 
        className="odontograma-chart" 
        style={{ 
          background: "#fff", 
          padding: "10px", 
          borderRadius: "8px", 
          border: "1.5px solid #222", 
          textAlign: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
          color: "#000",
          fontFamily: "sans-serif"
        }}
      >
        {/* Top Quadrants (Adult upper) */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", borderBottom: "1.5px dashed #aaa", paddingBottom: "6px" }}>
          {/* Upper Right Quadrant (Patient Right) */}
          <div style={{ display: "flex", gap: "2px", direction: "rtl" }}>
            {renderToothList(adultUpperRight)}
          </div>
          {/* Middle Line Separator */}
          <div style={{ width: "2px", height: "45px", background: "#000", margin: "0 10px" }}></div>
          {/* Upper Left Quadrant (Patient Left) */}
          <div style={{ display: "flex", gap: "2px" }}>
            {renderToothList(adultUpperLeft)}
          </div>
        </div>

        {/* Child Upper Quadrants */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: "6px", paddingBottom: "10px" }}>
          <div style={{ display: "flex", gap: "2px", direction: "rtl" }}>
            {renderToothList(childUpperRight)}
          </div>
          <div style={{ width: "2px", height: "45px", background: "#000", margin: "0 10px" }}></div>
          <div style={{ display: "flex", gap: "2px" }}>
            {renderToothList(childUpperLeft)}
          </div>
        </div>

        {/* Horizontal midline separator */}
        <div style={{ height: "4px", background: "#000", margin: "4px 0", borderRadius: "2px" }}></div>

        {/* Child Lower Quadrants */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: "10px", paddingBottom: "6px" }}>
          <div style={{ display: "flex", gap: "2px", direction: "rtl" }}>
            {renderToothList(childLowerRight)}
          </div>
          <div style={{ width: "2px", height: "45px", background: "#000", margin: "0 10px" }}></div>
          <div style={{ display: "flex", gap: "2px" }}>
            {renderToothList(childLowerLeft)}
          </div>
        </div>

        {/* Bottom Quadrants (Adult lower) */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", borderTop: "1.5px dashed #aaa", paddingTop: "6px" }}>
          <div style={{ display: "flex", gap: "2px", direction: "rtl" }}>
            {renderToothList(adultLowerRight)}
          </div>
          <div style={{ width: "2px", height: "45px", background: "#000", margin: "0 10px" }}></div>
          <div style={{ display: "flex", gap: "2px" }}>
            {renderToothList(adultLowerLeft)}
          </div>
        </div>
      </div>
      {!readOnly && (
        <div style={{ fontSize: "11px", color: "#666", textAlign: "center", marginTop: "6px", fontStyle: "italic" }}>
          * Haz clic en una superficie para marcarla según la herramienta activa. Haz doble clic en el número de diente para marcarlo como Ausente/Sano completo.
        </div>
      )}
    </div>
  );
}
