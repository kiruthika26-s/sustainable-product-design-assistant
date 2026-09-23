import React, { useState } from "react";
import "./App.css";
import ProductAnalysisPage from "./pages/ProductAnalysisPage";
import SimulationPage from "./pages/SimulationPage";

function App() {
  const [currentPage, setCurrentPage] = useState("analysis");
  const [simulationContext, setSimulationContext] = useState(null);
  const [appliedMaterial, setAppliedMaterial] = useState(null);

  const handleNavigateToSimulation = (context) => {
    setSimulationContext(context);
    setCurrentPage("simulation");
  };

  const handleApplySimulation = (simulationData) => {
    setAppliedMaterial(simulationData);
    setCurrentPage("analysis");
  };

  return (
    <div className="app">
      {/* Navigation Header */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #d8e6d2",
          boxShadow: "0 2px 4px rgba(27, 77, 62, 0.04)",
          position: "sticky",
          top: 0,
          zIndex: 100
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }}>🌿</span>
            <span
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#1b4d3e",
                letterSpacing: "-0.2px"
              }}
            >
              EcoDesign Assistant
            </span>
          </div>

          <nav style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setCurrentPage("analysis")}
              style={{
                padding: "8px 16px",
                fontSize: "0.9rem",
                fontWeight: 600,
                borderRadius: "6px",
                cursor: "pointer",
                border:
                  currentPage === "analysis"
                    ? "1px solid #2e7d32"
                    : "1px solid #cbd5e1",
                backgroundColor:
                  currentPage === "analysis" ? "#2e7d32" : "#f8faf9",
                color: currentPage === "analysis" ? "#ffffff" : "#475569",
                transition: "all 0.2s ease"
              }}
            >
              📊 Product Analysis
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage("simulation")}
              style={{
                padding: "8px 16px",
                fontSize: "0.9rem",
                fontWeight: 600,
                borderRadius: "6px",
                cursor: "pointer",
                border:
                  currentPage === "simulation"
                    ? "1px solid #2e7d32"
                    : "1px solid #cbd5e1",
                backgroundColor:
                  currentPage === "simulation" ? "#2e7d32" : "#f8faf9",
                color: currentPage === "simulation" ? "#ffffff" : "#475569",
                transition: "all 0.2s ease"
              }}
            >
              ⚡ What-If Simulation
            </button>
          </nav>
        </div>
      </header>

      {/* Main Page View */}
      <main>
        {currentPage === "analysis" ? (
          <ProductAnalysisPage
            onNavigateToSimulation={handleNavigateToSimulation}
            appliedMaterial={appliedMaterial}
            clearAppliedMaterial={() => setAppliedMaterial(null)}
          />
        ) : (
          <SimulationPage
            initialProductId={simulationContext?.productId}
            initialCurrentMaterial={simulationContext?.currentMaterial}
            initialAlternativeMaterial={simulationContext?.alternativeMaterial}
            onApplySimulation={handleApplySimulation}
          />
        )}
      </main>
    </div>
  );
}

export default App;