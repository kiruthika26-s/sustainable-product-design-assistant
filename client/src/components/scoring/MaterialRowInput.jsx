import React from "react";

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

  return (
    <div className="material-row">
      <div className="form-group material-field">
        <label htmlFor={`mat-name-${material.id}`}>
          Component / Part #{index + 1}
        </label>
        <input
          id={`mat-name-${material.id}`}
          type="text"
          placeholder="e.g., Main Body, Lid, Outer Casing"
          value={material.name}
          onChange={(e) => onChange(material.id, "name", e.target.value)}
        />
      </div>

      <div className="form-group material-field">
        <label htmlFor={`mat-type-${material.id}`}>Material Type</label>
        <select
          id={`mat-type-${material.id}`}
          value={material.type}
          onChange={(e) => onChange(material.id, "type", e.target.value)}
        >
          {materialOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group material-field weight-field">
        <label htmlFor={`mat-weight-${material.id}`}>Weight (g)</label>
        <input
          id={`mat-weight-${material.id}`}
          type="number"
          min="0"
          step="any"
          placeholder="Weight in grams"
          value={material.weight}
          onChange={(e) => onChange(material.id, "weight", e.target.value)}
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
