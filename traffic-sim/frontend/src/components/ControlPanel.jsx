import { useState, useRef } from "react";
import { sendOrgan, sendPatient } from "../services/api";

export default function ControlPanel({ onSimulate, onOrganDispatch, onPatientDispatch, loading = false }) {
  const panelRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("sim"); // "sim" | "organ" | "patient"

  // Status messages
  const [organStatus, setOrganStatus] = useState(null);
  const [patientStatus, setPatientStatus] = useState(null);
  const [organLoading, setOrganLoading] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);

  // Organ form state
  const [organForm, setOrganForm] = useState({
    organType: "",
    bloodGroup: "",
    donorId: "",
    destinationHospital: "",
    urgencyLevel: "medium",
    notes: "",
  });

  // Patient form state
  const [patientForm, setPatientForm] = useState({
    patientName: "",
    patientId: "",
    age: "",
    bloodGroup: "",
    condition: "",
    destinationHospital: "",
    ambulanceId: "",
    requiredDepartment: "",
    notes: "",
  });

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    setDragging(true);
    offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };
  const onMouseUp = () => setDragging(false);

  // ── Submit handlers ────────────────────────────────────────────────────────
  const handleSendOrgan = async () => {
    if (!organForm.organType || !organForm.destinationHospital || !organForm.bloodGroup) {
      setOrganStatus({ ok: false, msg: "Please fill Organ Type, Blood Group & Hospital." });
      return;
    }
    setOrganLoading(true);
    setOrganStatus(null);
    try {
      const result = await sendOrgan({ ...organForm, age: undefined });
      setOrganStatus({ ok: true, msg: `✅ Dispatched! Tracking ID: ${result.trackingId}` });
      setOrganForm({ organType: "", bloodGroup: "", donorId: "", destinationHospital: "", urgencyLevel: "medium", notes: "" });
      if (onOrganDispatch) onOrganDispatch(result);
    } catch (err) {
      setOrganStatus({ ok: false, msg: `❌ Error: ${err.message}` });
    } finally {
      setOrganLoading(false);
    }
  };

  const handleSendPatient = async () => {
    if (!patientForm.patientName || !patientForm.destinationHospital || !patientForm.ambulanceId) {
      setPatientStatus({ ok: false, msg: "Please fill Patient Name, Hospital & Ambulance ID." });
      return;
    }
    setPatientLoading(true);
    setPatientStatus(null);
    try {
      const result = await sendPatient({ ...patientForm, age: Number(patientForm.age) });
      setPatientStatus({ ok: true, msg: `✅ Dispatched! Tracking ID: ${result.trackingId}` });
      setPatientForm({ patientName: "", patientId: "", age: "", bloodGroup: "", condition: "", destinationHospital: "", ambulanceId: "", requiredDepartment: "", notes: "" });
      if (onPatientDispatch) onPatientDispatch(result);
    } catch (err) {
      setPatientStatus({ ok: false, msg: `❌ Error: ${err.message}` });
    } finally {
      setPatientLoading(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%",
    padding: "5px 8px",
    marginBottom: "6px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "12px",
    boxSizing: "border-box",
  };

  const selectStyle = { ...inputStyle };

  const btnStyle = (color = "#2563eb") => ({
    width: "100%",
    padding: "7px",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
    marginTop: "4px",
  });

  const tabStyle = (active) => ({
    flex: 1,
    padding: "5px",
    fontSize: "11px",
    fontWeight: active ? "bold" : "normal",
    background: active ? "#2563eb" : "#e5e7eb",
    color: active ? "#fff" : "#374151",
    border: "none",
    cursor: "pointer",
    borderRadius: "5px",
  });

  const statusStyle = (ok) => ({
    marginTop: "6px",
    padding: "5px 8px",
    borderRadius: "5px",
    fontSize: "11px",
    background: ok ? "#d1fae5" : "#fee2e2",
    color: ok ? "#065f46" : "#991b1b",
  });

  const labelStyle = { fontSize: "11px", color: "#6b7280", marginBottom: "2px", display: "block" };

  return (
    <div
      ref={panelRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        zIndex: 1000,
        background: "#fff",
        padding: "12px",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        cursor: dragging ? "grabbing" : "default",
        userSelect: "none",
        transition: dragging ? "none" : "0.2s ease",
        minWidth: "220px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      {/* ── Header (drag handle) ── */}
      <div
        onMouseDown={onMouseDown}
        style={{ fontWeight: "bold", marginBottom: "10px", cursor: "grab", fontSize: "14px" }}
      >
        🚑 Control Panel
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
        <button style={tabStyle(activeTab === "sim")} onClick={() => setActiveTab("sim")}>🗺 Sim</button>
        <button style={tabStyle(activeTab === "organ")} onClick={() => setActiveTab("organ")}>🫀 Organ</button>
        <button style={tabStyle(activeTab === "patient")} onClick={() => setActiveTab("patient")}>🧑‍⚕️ Patient</button>
      </div>

      {/* ── Tab: Simulation ── */}
      {activeTab === "sim" && (
        <div>
          <button style={btnStyle("#16a34a")} onClick={onSimulate} disabled={loading}>
            {loading ? "⏳ Running..." : "▶ Start Simulation"}
          </button>
        </div>
      )}

      {/* ── Tab: Send Organ ── */}
      {activeTab === "organ" && (
        <div>
          <label style={labelStyle}>Organ Type</label>
          <select
            style={selectStyle}
            value={organForm.organType}
            onChange={(e) => setOrganForm({ ...organForm, organType: e.target.value })}
          >
            <option value="">-- Select Organ --</option>
            <option>Heart</option>
            <option>Kidney</option>
            <option>Liver</option>
            <option>Lung</option>
            <option>Pancreas</option>
            <option>Cornea</option>
          </select>

          <label style={labelStyle}>Blood Group</label>
          <select
            style={selectStyle}
            value={organForm.bloodGroup}
            onChange={(e) => setOrganForm({ ...organForm, bloodGroup: e.target.value })}
          >
            <option value="">-- Blood Group --</option>
            {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((b) => <option key={b}>{b}</option>)}
          </select>

          <label style={labelStyle}>Donor ID</label>
          <input
            style={inputStyle}
            placeholder="e.g. D-1023"
            value={organForm.donorId}
            onChange={(e) => setOrganForm({ ...organForm, donorId: e.target.value })}
          />

          <label style={labelStyle}>Destination Hospital</label>
          <input
            style={inputStyle}
            placeholder="e.g. Apollo Hospital"
            value={organForm.destinationHospital}
            onChange={(e) => setOrganForm({ ...organForm, destinationHospital: e.target.value })}
          />

          <label style={labelStyle}>Urgency Level</label>
          <select
            style={selectStyle}
            value={organForm.urgencyLevel}
            onChange={(e) => setOrganForm({ ...organForm, urgencyLevel: e.target.value })}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="critical">🔴 Critical</option>
          </select>

          <label style={labelStyle}>Notes (optional)</label>
          <input
            style={inputStyle}
            placeholder="Any special instructions"
            value={organForm.notes}
            onChange={(e) => setOrganForm({ ...organForm, notes: e.target.value })}
          />

          <button style={btnStyle("#dc2626")} onClick={handleSendOrgan} disabled={organLoading}>
            {organLoading ? "⏳ Sending..." : "🫀 Send Organ"}
          </button>

          {organStatus && <div style={statusStyle(organStatus.ok)}>{organStatus.msg}</div>}
        </div>
      )}

      {/* ── Tab: Send Patient ── */}
      {activeTab === "patient" && (
        <div>
          <label style={labelStyle}>Patient Name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Ravi Sharma"
            value={patientForm.patientName}
            onChange={(e) => setPatientForm({ ...patientForm, patientName: e.target.value })}
          />

          <label style={labelStyle}>Patient ID</label>
          <input
            style={inputStyle}
            placeholder="e.g. P-4521"
            value={patientForm.patientId}
            onChange={(e) => setPatientForm({ ...patientForm, patientId: e.target.value })}
          />

          <label style={labelStyle}>Age</label>
          <input
            style={inputStyle}
            type="number"
            placeholder="e.g. 45"
            value={patientForm.age}
            onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
          />

          <label style={labelStyle}>Blood Group</label>
          <select
            style={selectStyle}
            value={patientForm.bloodGroup}
            onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
          >
            <option value="">-- Blood Group --</option>
            {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((b) => <option key={b}>{b}</option>)}
          </select>

          <label style={labelStyle}>Condition</label>
          <select
            style={selectStyle}
            value={patientForm.condition}
            onChange={(e) => setPatientForm({ ...patientForm, condition: e.target.value })}
          >
            <option value="">-- Condition --</option>
            <option>Stable</option>
            <option>Serious</option>
            <option>Critical</option>
          </select>

          <label style={labelStyle}>Destination Hospital</label>
          <input
            style={inputStyle}
            placeholder="e.g. City General Hospital"
            value={patientForm.destinationHospital}
            onChange={(e) => setPatientForm({ ...patientForm, destinationHospital: e.target.value })}
          />

          <label style={labelStyle}>Ambulance ID</label>
          <input
            style={inputStyle}
            placeholder="e.g. AMB-007"
            value={patientForm.ambulanceId}
            onChange={(e) => setPatientForm({ ...patientForm, ambulanceId: e.target.value })}
          />

          <label style={labelStyle}>Required Department</label>
          <select
            style={selectStyle}
            value={patientForm.requiredDepartment}
            onChange={(e) => setPatientForm({ ...patientForm, requiredDepartment: e.target.value })}
          >
            <option value="">-- Department --</option>
            <option>Emergency</option>
            <option>ICU</option>
            <option>Cardiology</option>
            <option>Neurology</option>
            <option>Orthopedics</option>
            <option>General</option>
          </select>

          <label style={labelStyle}>Notes (optional)</label>
          <input
            style={inputStyle}
            placeholder="Any special instructions"
            value={patientForm.notes}
            onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
          />

          <button style={btnStyle("#2563eb")} onClick={handleSendPatient} disabled={patientLoading}>
            {patientLoading ? "⏳ Sending..." : "🧑‍⚕️ Send Patient"}
          </button>

          {patientStatus && <div style={statusStyle(patientStatus.ok)}>{patientStatus.msg}</div>}
        </div>
      )}
    </div>
  );
}