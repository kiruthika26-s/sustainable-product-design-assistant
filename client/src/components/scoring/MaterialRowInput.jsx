import React from "react";

// Standard Knowledge Base materials fallback
const fallbackMaterials = [
  { name: "PET", category: "Plastics", recyclabilityIndex: 85 },
  { name: "HDPE", category: "Plastics", recyclabilityIndex: 80 },
  { name: "LDPE", category: "Plastics", recyclabilityIndex: null },
  { name: "PP", category: "Plastics", recyclabilityIndex: null },
  { name: "PVC", category: "Plastics", recyclabilityIndex: 30 },
  { name: "PS", category: "Plastics", recyclabilityIndex: null },
  { name: "ABS", category: "Plastics", recyclabilityIndex: null },
  { name: "Aluminium", category: "Metals", recyclabilityIndex: 98 },
  { name: "Steel", category: "Metals", recyclabilityIndex: null },
  { name: "Stainless Steel", category: "Metals", recyclabilityIndex: null },
  { name: "Copper", category: "Metals", recyclabilityIndex: null },
  { name: "Glass", category: "Glass", recyclabilityIndex: 95 },
  { name: "Paper", category: "Paper & Cardboard", recyclabilityIndex: 90 },
  { name: "Cardboard", category: "Paper & Cardboard", recyclabilityIndex: null },
  { name: "Wood", category: "Bio-Based & Wood", recyclabilityIndex: null },
];

function MaterialRowInput({
  material,
  index,
  onChange,
  onRemove,
  canRemove,
  availableMaterials = [],
  isOffline = false
}) {
  const isUsingFallback = isOffline || availableMaterials.length === 0;
  const materialsList = availableMaterials.length > 0 ? availableMaterials : fallbackMaterials;

  // Find currently matched material in Knowledge Base
  const currentSelectedType = material.type || "PET";
  const matchedMaterial = materialsList.find(
    (m) =>
      m.name.toLowerCase() === currentSelectedType.toLowerCase() ||
      (currentSelectedType.toLowerCase().startsWith(m.name.toLowerCase()))
  );

  const isIndexConfigured =
    matchedMaterial &&
    matchedMaterial.recyclabilityIndex !== null &&
    matchedMaterial.recyclabilityIndex !== undefined;

  const handleTypeChange = (e) => {
    const selectedName = e.target.value;
    const selectedMat = materialsList.find((m) => m.name === selectedName);

    const newIndex =
      selectedMat && selectedMat.recyclabilityIndex !== null && selectedMat.recyclabilityIndex !== undefined
        ? selectedMat.recyclabilityIndex
        : "";

    // Automatically update type and auto-populate read-only index
    onChange(material.id, "type", selectedName);
    onChange(material.id, "recyclabilityIndex", newIndex);
  };

  const displayIndexValue =
    material.recyclabilityIndex !== "" &&
    material.recyclabilityIndex !== null &&
    material.recyclabilityIndex !== undefined
      ? material.recyclabilityIndex
      : "";

  return (
    <div className="material-row-wrapper" style={{ marginBottom: "16px" }}>
      <div className="material-row">
        <div className="form-group material-field">
          <label htmlFor={`mat-name-${material.id}`}>
            Component / Part #{index + 1} *
          </label>
          <input
            id={`mat-name-${material.id}`}
            type="text"
            placeholder="e.g., Main Body, Lid"
            value={material.name}
            onChange={(e) => onChange(material.id, "name", e.target.value)}
            required
          />
        </div>

        <div className="form-group material-field">
          <label htmlFor={`mat-type-${material.id}`}>
            Material {isUsingFallback ? "(Offline Fallback)" : "(Knowledge Base)"} *
          </label>
          <select
            id={`mat-type-${material.id}`}
            value={matchedMaterial ? matchedMaterial.name : currentSelectedType}
            onChange={handleTypeChange}
            style={{
              borderColor: !isIndexConfigured ? "#e65100" : undefined,
              backgroundColor: !isIndexConfigured ? "#fff8e1" : undefined
            }}
          >
            <optgroup label={isUsingFallback ? "Offline Fallback Materials" : "Material Knowledge Base"}>
              {materialsList.map((opt) => {
                const hasIdx = opt.recyclabilityIndex !== null && opt.recyclabilityIndex !== undefined;
                return (
                  <option key={opt.name || opt._id} value={opt.name}>
                    {opt.name} ({opt.category}) {hasIdx ? `— Index: ${opt.recyclabilityIndex}` : "— [Index Unavailable]"} {isUsingFallback ? "[Offline Fallback]" : ""}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>

        <div className="form-group material-field weight-field">
          <label htmlFor={`mat-weight-${material.id}`}>Weight (kg) *</label>
          <input
            id={`mat-weight-${material.id}`}
            type="number"
            min="0.001"
            step="0.001"
            placeholder="e.g. 0.25"
            value={material.weight}
            onChange={(e) => onChange(material.id, "weight", e.target.value)}
            required
          />
        </div>

        <div className="form-group material-field index-field">
          <label htmlFor={`mat-index-${material.id}`}>
            Recyclability Index (Read-Only)
          </label>
          <div style={{ position: "relative" }}>
            <input
              id={`mat-index-${material.id}`}
              type="text"
              readOnly
              value={displayIndexValue !== "" ? `${displayIndexValue} / 100` : "Unavailable"}
              placeholder="Unavailable"
              style={{
                backgroundColor: displayIndexValue !== "" ? "#f1f5f9" : "#fff3e0",
                color: displayIndexValue !== "" ? "#1e293b" : "#c2410c",
                fontWeight: 600,
                cursor: "not-allowed",
                borderColor: displayIndexValue !== "" ? "#cbd5e1" : "#fb923c"
              }}
              title="Recyclability index is automatically populated from the Material Knowledge Base"
            />
            <span
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.8rem",
                color: "#64748b",
                pointerEvents: "none"
              }}
            >
              🔒
            </span>
          </div>
        </div>

        <div className="material-actions">
          <button
            type="button"
            className="btn-remove"
            onClick={() => onRemove(material.id)}
            disabled={!canRemove}
            title={canRemove ? "Remove this material" : "At least one material is required"}
          >
            Remove
          </button>
        </div>
      </div>

      {/* Warning indicator if material lacks a configured recyclability index */}
      {!isIndexConfigured && (
        <div
          style={{
            marginTop: "6px",
            padding: "6px 12px",
            backgroundColor: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "4px",
            fontSize: "0.82rem",
            color: "#9a3412",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>⚠️</span>
          <span>
            <strong>Index Unavailable:</strong> <em>{matchedMaterial?.name || currentSelectedType}</em> does not have a configured recyclability index in the Knowledge Base and cannot be used for scoring until configured.
          </span>
        </div>
      )}

      {/* Offline fallback explanation notice */}
      {isUsingFallback && (
        <div
          style={{
            marginTop: "6px",
            padding: "6px 12px",
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: "4px",
            fontSize: "0.82rem",
            color: "#92400e",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>ℹ️</span>
          <span>
            <strong>Offline Fallback:</strong> Showing static fallback material options because the server Material Knowledge Base is unavailable. Server-side validation is still required before calculating scores or saving products.
          </span>
        </div>
      )}
    </div>
  );
}

export default MaterialRowInput;
