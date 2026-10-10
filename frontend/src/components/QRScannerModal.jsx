import React, { useState } from "react";
import { apiService } from "../services/apiService.js";
import Icon from "./Icons.jsx";
import { Spinner } from "./Loader.jsx";

// Audio tone synthesizer for scanner feedback
function playScanSound(success) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = success ? "sine" : "sawtooth";
    osc.frequency.setValueAtTime(success ? 880 : 220, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
}

export default function QRScannerModal({ isOpen, onClose, staffCafeteriaId, onScanSuccess }) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");

  if (!isOpen) return null;

  async function handleVerify(tokenToTest) {
    const token = (tokenToTest || tokenInput).trim();
    if (!token) {
      setScanError("Please enter or scan a token.");
      return;
    }

    setLoading(true);
    setScanError("");
    setScanResult(null);

    try {
      const res = await apiService.verifyPickup(token, staffCafeteriaId);
      playScanSound(true);
      setScanResult(res.order);
      setTokenInput("");
      if (onScanSuccess) onScanSuccess(res.order);
    } catch (err) {
      playScanSound(false);
      setScanError(err.message || "Failed to verify token.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickScan(sampleToken) {
    setTokenInput(sampleToken);
    handleVerify(sampleToken);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span className="badge badge-open">Staff Express Counter Pickup Validator</span>
            <h2 style={{ margin: "4px 0 2px", fontSize: "1.35rem" }}>Scan QR / Token</h2>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
              Counter validation enforcing single pickup (FR-11 & FR-22)
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Scanner Simulation Viewfinder */}
        <div className="scanner-viewfinder-box">
          <div className="viewfinder-lens">
            <div className="laser-scan-line" />
            <Icon name="maximize" size={54} color="var(--teal)" style={{ opacity: 0.8 }} />
            <span className="lens-text">Point counter camera or type token below</span>
          </div>
        </div>

        {/* Manual Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          style={{ marginTop: 16 }}
        >
          <div className="field">
            <label>Pickup Token Number or QR Payload</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="input"
                placeholder="e.g. VST-1001 or #VST-1042"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !tokenInput.trim()}>
                {loading ? <Spinner /> : "Verify"}
              </button>
            </div>
          </div>
        </form>

        {/* Quick evaluation shortcuts */}
        <div className="quick-scan-hints">
          <span style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Evaluation Quick-Tests:</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              className="tag-btn"
              onClick={() => handleQuickScan("VST-1042")}
            >
              Verify #VST-1042
            </button>
            <button
              type="button"
              className="tag-btn"
              onClick={() => handleQuickScan("AMT-2015")}
            >
              Verify #AMT-2015 (Amitie)
            </button>
          </div>
        </div>

        {/* Result Alerts */}
        {scanError && (
          <div className="scan-alert scan-alert-error" style={{ marginTop: 14 }}>
            <Icon name="alertCircle" size={24} color="var(--brick)" />
            <div>
              <strong>VALIDATION REJECTED</strong>
              <div style={{ fontSize: "0.85rem", marginTop: 2 }}>{scanError}</div>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="scan-alert scan-alert-success" style={{ marginTop: 14 }}>
            <Icon name="checkCircle" size={24} color="var(--teal)" />
            <div style={{ flex: 1 }}>
              <strong>VERIFIED & HANDOVER AUTHORIZED!</strong>
              <div style={{ fontSize: "0.88rem", marginTop: 2 }}>
                Token <strong>#{scanResult.tokenNumber}</strong> · Student: <strong>{scanResult.userFullName}</strong>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--teal-dark)", marginTop: 4 }}>
                Items: {scanResult.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>
                Total: ৳{scanResult.total} ({scanResult.paymentMethod.toUpperCase()})
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "right" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
