import React from "react";

const defaultIndices = {
  "PET (Plastic)": 85,
  "HDPE (Plastic)": 80,
  "PP (Polypropylene)": 70,
  "LDPE (Plastic)": 50,
  "PVC (Plastic)": 15,
  "Aluminum": 95,
  "Steel": 90,
  "Glass": 85,
  "Cardboard / Paper": 80,
  "Bioplastic (PLA)": 40,
  "Wood / Bamboo": 60,
  "Rubber": 30,
  "Other": 20,
};

function MaterialRowInput({
  material,
  index,
  onChange,
  onRemove,
  canRemove,
}) {
  const materialOptions = [
    "PET (Plastic)",
    "HDPE (Plastic)",
    "PP (Polypropylene)",
    "LDPE (Plastic)",
    "PVC (Plastic)",
    "Aluminum",
    "Steel",
    "Glass",
    "Cardboard / Paper",
    "Bioplastic (PLA)",
    "Wood / Bamboo",
    "Rubber",
    "Other",
  ];

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    onChange(material.id, "type", selectedType);
    // If recyclabilityIndex is not explicitly set, auto-fill standard default for that material
    if (material.recyclabilityIndex === "" || material.recyclabilityIndex === undefined) {
      if (defaultIndices[selectedType] !== undefined) {
        onChange(material.id, "recyclabilityIndex", defaultIndices[selectedType]);
      }
    }
  };

  return (
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
        <label htmlFor={`mat-type-${material.id}`}>Material Type</label>
        <select
          id={`mat-type-${material.id}`}
          value={material.type || "PET (Plastic)"}
          onChange={handleTypeChange}
        >
          {materialOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
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
          Recyclability Index (0-100) *
        </label>
        <input
          id={`mat-index-${material.id}`}
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="e.g. 85"
          value={material.recyclabilityIndex}
          onChange={(e) =>
            onChange(material.id, "recyclabilityIndex", e.target.value)
          }
          required
        />
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
  );
}

export default MaterialRowInput;
