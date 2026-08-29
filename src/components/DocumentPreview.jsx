import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Odontograma from "./Odontograma";

// Tooth and Stethoscope SVG Logo
const ClinicLogo = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" style={{ marginRight: "15px" }}>
    {/* Stethoscope tube */}
    <path 
      d="M30 45 C 30 75, 70 75, 70 45" 
      fill="none" 
      stroke="#3b82f6" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    <path 
      d="M50 71 L 50 85 C 50 90, 80 90, 80 85" 
      fill="none" 
      stroke="#3b82f6" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    {/* Stethoscope chestpiece */}
    <circle cx="80" cy="83" r="8" fill="#9ca3af" stroke="#4b5563" strokeWidth="2" />
    <circle cx="80" cy="83" r="4" fill="#374151" />

    {/* Tooth shape */}
    <path 
      d="M35 25 
         C35 15, 45 15, 50 20 
         C55 15, 65 15, 65 25 
         C65 38, 62 45, 60 55 
         C59 62, 57 65, 55 65 
         C53 65, 52 60, 50 50 
         C48 60, 47 65, 45 65 
         C43 65, 41 62, 40 55 
         C38 45, 35 38, 35 25 Z" 
      fill="#ffffff" 
      stroke="#1e3a8a" 
      strokeWidth="3.5" 
      strokeLinejoin="round"
    />
    {/* Tooth highlights */}
    <path d="M40 22 C42 18, 45 20, 45 22" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function DocumentPreview({ documentState = {}, onToothUpdate, onTreatmentUpdate, onAddProgressRow }) {
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);

  // Render a checked symbol or empty box
  const renderCheckbox = (label, checked) => (
    <span style={{ display: "inline-flex", alignItems: "center", marginRight: "12px", fontSize: "11px", fontWeight: "bold" }}>
      <span style={{ 
        display: "inline-block", 
        width: "12px", 
        height: "12px", 
        border: "1.2px solid #000", 
        marginRight: "4px", 
        textAlign: "center", 
        lineHeight: "10px",
        fontSize: "10px",
        background: checked ? "#ddd" : "#fff",
        color: "#000"
      }}>
        {checked ? "✓" : ""}
      </span>
      {label}
    </span>
  );

  // Download PDF triggering html2canvas -> jsPDF
  const downloadPDF = async () => {
    const btn = document.getElementById("dl-pdf-btn");
    const originalText = btn.innerText;
    btn.innerText = "Generando PDF...";
    btn.disabled = true;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Render page 1
      const canvas1 = await html2canvas(page1Ref.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData1 = canvas1.toDataURL("image/png");
      doc.addImage(imgData1, "PNG", 0, 0, 210, 297);

      doc.addPage();

      // Render page 2
      const canvas2 = await html2canvas(page2Ref.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData2 = canvas2.toDataURL("image/png");
      doc.addImage(imgData2, "PNG", 0, 0, 210, 297);

      doc.save(`Historial_Clinico_${documentState.nombre ? documentState.nombre.replace(/\s+/g, "_") : "Paciente"}.pdf`);
    } catch (e) {
      console.error("Error creating PDF", e);
      alert("Error al generar el PDF.");
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };

  // Treatment list configured with default price
  const treatmentKeys = [
    { key: "Consulta", label: "Consulta", hasDouble: "Rx." },
    { key: "Sesión Profilaxis", label: "Sesión Profilaxis", hasDouble: "Fluorización" },
    { key: "Exodoncia simple.", label: "Exodoncia simple.", price: 80 },
    { key: "Exodoncia compleja.", label: "Exodoncia compleja.", price: 150 },
    { key: "Restauración simple.", label: "Restauración simple.", price: 70 },
    { key: "Restauración compuesta.", label: "Restauración compuesta.", price: 120 },
    { key: "Tratamiento pulpar", label: "Tratamiento pulpar", hasDouble: "Endodoncia" },
    { key: "Corona", label: "Corona", hasDouble: "Puente" },
    { key: "Perno/poste", label: "Perno/poste", hasDouble: "Incrustación" },
    { key: "Prótesis parcial removible (PPR)", label: "Prótesis parcial removible (PPR)", price: 350 },
    { key: "Prótesis total removible (PTR)", label: "Prótesis total removible (PTR)", price: 500 },
    { key: "Ortodoncia", label: "Ortodoncia", price: 1200 },
  ];

  const getTreatmentValue = (key) => {
    return documentState.treatments?.[key] || { checked: false, qty: 1, price: 0 };
  };

  const computeTotal = (key) => {
    const val = getTreatmentValue(key);
    return val.checked ? val.qty * val.price : "";
  };

  const getGrandTotal = () => {
    let sum = 0;
    if (documentState.treatments) {
      Object.keys(documentState.treatments).forEach(k => {
        const item = documentState.treatments[k];
        if (item.checked) {
          sum += (item.qty || 1) * (item.price || 0);
        }
      });
    }
    return sum > 0 ? sum : "";
  };

  return (
    <div className="document-preview-container">
      <div className="preview-controls" style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <h3 style={{ margin: "0" }}>Documento Clínico Oficial (A4)</h3>
        <button
          type="button"
          id="dl-pdf-btn"
          onClick={downloadPDF}
          style={{
            padding: "8px 16px",
            background: "#10b981",
            border: "none",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Descargar PDF
        </button>
      </div>

      <div className="document-scroll" style={{ display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", maxHeight: "80vh", padding: "10px", background: "#374151", borderRadius: "8px" }}>
        
        {/* ================= PAGE 1 ================= */}
        <div 
          id="clinical-page-1"
          ref={page1Ref}
          className="clinical-page"
          style={{
            width: "794px",
            height: "1123px",
            background: "#ffffff",
            color: "#000000",
            padding: "40px",
            boxSizing: "border-box",
            fontFamily: "'Courier New', Courier, monospace", // Medical handwriting-like monospace aesthetic
            fontSize: "12px",
            lineHeight: "1.4",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "15px" }}>
            <ClinicLogo />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "1px" }}>CLINICA DENTAL MIS MUELITAS</div>
              <div style={{ fontSize: "14px", fontWeight: "bold", marginTop: "4px" }}>HISTORIA CLINICA ODONTOLOGICA</div>
            </div>
            <div style={{ marginLeft: "auto", border: "1px solid #000", padding: "4px 8px", fontSize: "11px" }}>
              Fecha: <span className="handwritten">{documentState.fecha}</span>
            </div>
          </div>

          {/* Form Fields Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 3, borderBottom: "1px solid #000" }}>Nombre: <span className="handwritten">{documentState.nombre}</span></div>
              <div style={{ flex: 1, borderBottom: "1px solid #000", marginLeft: "15px" }}>Edad: <span className="handwritten">{documentState.edad}</span></div>
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 2, borderBottom: "1px solid #000" }}>Lugar y fecha de nac.: <span className="handwritten">{documentState.lugarNac} {documentState.fechaNac}</span></div>
              <div style={{ flex: 1, borderBottom: "1px solid #000", marginLeft: "15px" }}>Ocupación: <span className="handwritten">{documentState.ocupacion}</span></div>
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 2, borderBottom: "1px solid #000" }}>Dirección: <span className="handwritten">{documentState.direccion}</span></div>
              <div style={{ flex: 1, borderBottom: "1px solid #000", marginLeft: "15px" }}>Teléf.: <span className="handwritten">{documentState.telefono}</span></div>
            </div>
            <div style={{ borderBottom: "1px solid #000" }}>
              Antecedentes patológicos: <span className="handwritten">{documentState.antecedentes}</span>
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 2, borderBottom: "1px solid #000" }}>Alergias: <span className="handwritten">{documentState.alergias}</span></div>
              <div style={{ flex: 1, borderBottom: "1px solid #000", marginLeft: "15px" }}>Hábitos: <span className="handwritten">{documentState.habitos}</span></div>
            </div>
            <div style={{ borderBottom: "1px solid #000" }}>
              Inspección general: <span className="handwritten">{documentState.inspeccionGeneral}</span>
            </div>
            <div style={{ borderBottom: "1px solid #000" }}>
              Exploración bucal: <span className="handwritten">{documentState.exploracionBucal}</span>
            </div>
            <div style={{ borderBottom: "1px solid #000" }}>
              Motivo de la consulta: <span className="handwritten">{documentState.motivoConsulta}</span>
            </div>
          </div>

          {/* Odontograma Section */}
          <div style={{ marginBottom: "15px" }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "8px", borderBottom: "1.5px solid #000" }}>ODONTOGRAMA:</div>
            <div style={{ transform: "scale(0.95)", transformOrigin: "top center" }}>
              <Odontograma odontogramaState={documentState.odontograma} onToothUpdate={onToothUpdate} readOnly={true} />
            </div>
          </div>

          {/* Treatments / budget table */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px", borderBottom: "1.5px solid #000" }}>TRATAMIENTO Y PRESUPUESTO:</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #000", background: "#f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "4px", width: "50%" }}>Tratamiento</th>
                  <th style={{ textAlign: "center", padding: "4px", width: "15%" }}>Cantidad</th>
                  <th style={{ textAlign: "right", padding: "4px", width: "15%" }}>Precio S/.</th>
                  <th style={{ textAlign: "right", padding: "4px", width: "20%" }}>Total S/.</th>
                </tr>
              </thead>
              <tbody>
                {treatmentKeys.map((treat, idx) => {
                  const stateVal = getTreatmentValue(treat.key);
                  const isChecked = stateVal.checked;
                  const qty = isChecked ? stateVal.qty : "";
                  const price = isChecked ? stateVal.price : "";

                  return (
                    <tr key={idx} style={{ borderBottom: "0.8px solid #ddd" }}>
                      <td style={{ padding: "3px 4px" }}>
                        {treat.hasDouble ? (
                          <div style={{ display: "flex" }}>
                            <div style={{ flex: 1 }}>
                              {renderCheckbox(treat.label, isChecked)}
                            </div>
                            <div style={{ flex: 1 }}>
                              {renderCheckbox(treat.hasDouble, getTreatmentValue(treat.hasDouble).checked)}
                            </div>
                          </div>
                        ) : (
                          renderCheckbox(treat.label, isChecked)
                        )}
                      </td>
                      <td style={{ textAlign: "center", padding: "3px 4px" }} className="handwritten">
                        {qty}
                      </td>
                      <td style={{ textAlign: "right", padding: "3px 4px" }} className="handwritten">
                        {price}
                      </td>
                      <td style={{ textAlign: "right", padding: "3px 4px", fontWeight: "bold" }} className="handwritten">
                        {computeTotal(treat.key)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= PAGE 2 ================= */}
        <div 
          id="clinical-page-2"
          ref={page2Ref}
          className="clinical-page"
          style={{
            width: "794px",
            height: "1123px",
            background: "#ffffff",
            color: "#000000",
            padding: "40px",
            boxSizing: "border-box",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "12px",
            lineHeight: "1.4",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}
        >
          {/* Treatments table continuation */}
          <div style={{ marginBottom: "15px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <tbody>
                <tr style={{ borderBottom: "0.8px solid #ddd" }}>
                  <td style={{ padding: "3px 4px", width: "50%" }}>
                    {renderCheckbox("Blanqueamiento dental", getTreatmentValue("Blanqueamiento dental").checked)}
                  </td>
                  <td style={{ textAlign: "center", padding: "3px 4px", width: "15%" }} className="handwritten">
                    {getTreatmentValue("Blanqueamiento dental").checked ? getTreatmentValue("Blanqueamiento dental").qty : ""}
                  </td>
                  <td style={{ textAlign: "right", padding: "3px 4px", width: "15%" }} className="handwritten">
                    {getTreatmentValue("Blanqueamiento dental").checked ? getTreatmentValue("Blanqueamiento dental").price : ""}
                  </td>
                  <td style={{ textAlign: "right", padding: "3px 4px", width: "20%", fontWeight: "bold" }} className="handwritten">
                    {computeTotal("Blanqueamiento dental")}
                  </td>
                </tr>
                {/* Empty buffer rows to match original scan table height */}
                <tr style={{ borderBottom: "0.8px solid #ddd", height: "18px" }}>
                  <td></td><td></td><td></td><td></td>
                </tr>
                <tr style={{ borderBottom: "1.5px solid #000", height: "18px" }}>
                  <td></td><td></td><td></td><td></td>
                </tr>
                {/* Grand Total row */}
                <tr>
                  <td colSpan="3" style={{ textAlign: "right", fontWeight: "bold", padding: "4px" }}>PRESUPUESTO TOTAL S/.</td>
                  <td style={{ textAlign: "right", fontWeight: "bold", borderBottom: "2px double #000", padding: "4px" }} className="handwritten">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Observations */}
          <div style={{ borderBottom: "1.5px solid #000", paddingBottom: "10px", marginBottom: "15px" }}>
            <strong>Observaciones:</strong> <span className="handwritten">{documentState.observaciones}</span>
          </div>

          {/* Clinical Evolution progress table */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px", borderBottom: "1.5px solid #000" }}>EVOLUCION Y CONTROL CLINICO:</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #000", background: "#f3f4f6" }}>
                  <th style={{ border: "1px solid #000", padding: "4px", width: "12%" }}>Fecha</th>
                  <th style={{ border: "1px solid #000", padding: "4px", width: "10%" }}>Pieza(s)</th>
                  <th style={{ border: "1px solid #000", padding: "4px", width: "23%" }}>Diagnóstico</th>
                  <th style={{ border: "1px solid #000", padding: "4px", width: "25%" }}>Tratamiento-Procedimiento</th>
                  <th style={{ border: "1px solid #000", padding: "4px", width: "10%" }}>A cuenta</th>
                  <th style={{ border: "1px solid #000", padding: "4px", width: "10%" }}>Saldo</th>
                  <th style={{ border: "1px solid #000", padding: "4px", width: "10%" }}>Firma</th>
                </tr>
              </thead>
              <tbody>
                {/* Render prefilled rows */}
                {Array.from({ length: 16 }).map((_, idx) => {
                  const row = documentState.progressRows?.[idx] || {};
                  return (
                    <tr key={idx} style={{ height: "22px" }}>
                      <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }} className="handwritten">{row.fecha || ""}</td>
                      <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center" }} className="handwritten">{row.pieza || ""}</td>
                      <td style={{ border: "1px solid #999", padding: "2px" }} className="handwritten">{row.diagnostico || ""}</td>
                      <td style={{ border: "1px solid #999", padding: "2px" }} className="handwritten">{row.tratamiento || ""}</td>
                      <td style={{ border: "1px solid #999", padding: "2px", textAlign: "right" }} className="handwritten">{row.aCuenta || ""}</td>
                      <td style={{ border: "1px solid #999", padding: "2px", textAlign: "right" }} className="handwritten">{row.saldo || ""}</td>
                      <td style={{ border: "1px solid #999", padding: "2px", textAlign: "center", fontSize: "9px" }} className="handwritten">{row.firma || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Page 2 Bottom: Small Odontograma representation */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "15px", marginBottom: "30px" }}>
            <div style={{ transform: "scale(0.4)", transformOrigin: "center center", height: "50px", overflow: "hidden" }}>
              <Odontograma odontogramaState={documentState.odontograma} onToothUpdate={() => {}} readOnly={true} />
            </div>
          </div>

          {/* Signatures block */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 40px", marginTop: "auto", marginBottom: "20px" }}>
            <div style={{ width: "220px", textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #000", height: "40px" }}></div>
              <div style={{ fontSize: "10px", marginTop: "6px", fontWeight: "bold" }}>Firma del Cirujano Dentista</div>
            </div>
            <div style={{ width: "220px", textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #000", height: "40px" }}></div>
              <div style={{ fontSize: "10px", marginTop: "6px", fontWeight: "bold" }}>Firma del Paciente</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
