import React, { useEffect, useState } from "react";
import {
  getProducts,
  getProductById,
  getProductScore,
  calculateScore,
  updateProduct,
} from "../services/api";

/**
 * Standard material database with recyclability index ratings (0-100),
 * category classifications, and eco-design guidance.
 */
const MATERIAL_CATALOG = {
  PET: {
    index: 85,
    category: "Plastics",
    description:
      "Widely collected in municipal curbside recycling; high circular demand.",
    ecoTip:
      "Great circular alternative for transparent rigid containers and bottles.",
  },
  "PET (Plastic)": {
    index: 85,
    category: "Plastics",
    description:
      "Widely collected in municipal curbside recycling; high circular demand.",
    ecoTip:
      "Great circular alternative for transparent rigid containers and bottles.",
  },
  HDPE: {
    index: 80,
    category: "Plastics",
    description:
      "Easily sorted and reprocessed with established post-consumer markets.",
    ecoTip:
      "Recommended for opaque bottles, caps, and sturdy packaging components.",
  },
  "HDPE (Plastic)": {
    index: 80,
    category: "Plastics",
    description:
      "Easily sorted and reprocessed with established post-consumer markets.",
    ecoTip:
      "Recommended for opaque bottles, caps, and sturdy packaging components.",
  },
  LDPE: {
    index: null,
    category: "Plastics",
    description:
      "Flexible film; curbside recovery is limited, index configuration pending municipal qualification.",
    ecoTip: "Consider corrugated cardboard or molded pulp cushioning instead.",
  },
  PP: {
    index: null,
    category: "Plastics",
    description:
      "Rapidly expanding recycling programs; high thermal and chemical resistance; index configuration pending.",
    ecoTip:
      "Excellent replacement for single-use polystyrene and flexible multi-layer plastics.",
  },
  PVC: {
    index: 30,
    category: "Plastics",
    description:
      "Severe recycling barrier; chlorine content contaminates standard recycling streams.",
    ecoTip:
      "Priority phase-out: switch to PET, HDPE, or Aluminium wherever possible.",
  },
  "PVC (Plastic)": {
    index: 30,
    category: "Plastics",
    description:
      "Severe recycling barrier; chlorine content contaminates standard recycling streams.",
    ecoTip:
      "Priority phase-out: switch to PET, HDPE, or Aluminium wherever possible.",
  },
  PS: {
    index: null,
    category: "Plastics",
    description:
      "Polystyrene packaging; recyclability index configuration pending.",
    ecoTip: "Consider switching to recyclable mono-materials.",
  },
  ABS: {
    index: null,
    category: "Plastics",
    description:
      "Engineering thermoplastic for durable housings; recyclability index configuration pending.",
    ecoTip: "Design for modular tool-free disassembly.",
  },
  Aluminium: {
    index: 98,
    category: "Metals",
    description:
      "Infinitely recyclable with 95% energy savings compared to virgin smelting.",
    ecoTip:
      "Gold standard for circular lifecycle design and lightweight structural parts.",
  },
  Aluminum: {
    index: 98,
    category: "Metals",
    description:
      "Infinitely recyclable with 95% energy savings compared to virgin smelting.",
    ecoTip:
      "Gold standard for circular lifecycle design and lightweight structural parts.",
  },
  Steel: {
    index: null,
    category: "Metals",
    description:
      "Magnetic separation makes recovery highly efficient; recyclability index configuration pending.",
    ecoTip:
      "Durable, high-strength choice for long-life products and protective housings.",
  },
  "Stainless Steel": {
    index: null,
    category: "Metals",
    description:
      "High chromium/nickel alloy; recyclability index configuration pending.",
    ecoTip: "Exceptional corrosion resistance and durability.",
  },
  Copper: {
    index: null,
    category: "Metals",
    description:
      "High conductivity metal; recyclability index configuration pending.",
    ecoTip: "Highly valuable for closed-loop electrical recycling.",
  },
  Glass: {
    index: 95,
    category: "Glass",
    description:
      "100% infinitely recyclable without chemical degradation or downcycling.",
    ecoTip:
      "Ideal for premium, non-reactive containers; evaluate transit weight vs. recyclability.",
  },
  Paper: {
    index: 90,
    category: "Paper & Cardboard",
    description:
      "Renewable, widely collected, biodegradable, and recyclable up to 5-7 cycles.",
    ecoTip:
      "Best eco-friendly alternative for transport packaging and outer cartons.",
  },
  Cardboard: {
    index: null,
    category: "Paper & Cardboard",
    description:
      "Corrugated bulk fiber packaging; recyclability index configuration pending.",
    ecoTip: "Widely recycled bulk stream.",
  },
  Wood: {
    index: null,
    category: "Bio-Based & Wood",
    description:
      "Natural carbon sink and renewable organic material; recyclability index configuration pending.",
    ecoTip:
      "Great alternative for structural inserts and aesthetic product shells.",
  },
};

const MATERIAL_OPTIONS = Object.keys(MATERIAL_CATALOG);

// Preset quick-simulation scenarios for beginners
const PRESET_SCENARIOS = [
  {
    title: "Phase out PVC",
    current: "PVC",
    alternative: "PET",
    label: "PVC ➔ PET",
  },
  {
    title: "Metal Upgrade",
    current: "PET",
    alternative: "Aluminium",
    label: "PET ➔ Aluminium",
  },
  {
    title: "Paper Packaging",
    current: "HDPE",
    alternative: "Paper",
    label: "HDPE ➔ Paper",
  },
  {
    title: "Glass Upgrade",
    current: "PET",
    alternative: "Glass",
    label: "PET ➔ Glass",
  },
];

/**
 * Returns rating badge metadata according to recyclability index value.
 */
function getRatingMeta(score) {
  if (score >= 80) {
    return { grade: "A", label: "High Recyclability", cssClass: "grade-a" };
  } else if (score >= 50) {
    return { grade: "B", label: "Moderate Recyclability", cssClass: "grade-b" };
  } else {
    return { grade: "C", label: "Low Recyclability", cssClass: "grade-c" };
  }
}

/**
 * SimulationPage Component
 *
 * Beginner-friendly What-If Material Simulation interface allowing designers
 * to test alternative materials and analyze immediate recyclability index impact.
 *
 * @param {Object} props - Optional props for parent integration
 * @param {string} [props.initialCurrentMaterial] - Initial current material name
 * @param {string} [props.initialAlternativeMaterial] - Initial alternative material name
 * @param {Function} [props.onApplySimulation] - Optional callback to transfer chosen alternative back to product editor
 */
function SimulationPage({
  initialProductId,
  initialCurrentMaterial = "PVC",
  initialAlternativeMaterial = "Aluminium",
  onApplySimulation,
}) {
  // Material selections
  const [currentMaterial, setCurrentMaterial] = useState(
    initialCurrentMaterial,
  );
  const [alternativeMaterial, setAlternativeMaterial] = useState(
    initialAlternativeMaterial,
  );

  // Recyclability Indices (pre-populated from catalog, user editable)
  const initialCurIdx = MATERIAL_CATALOG[initialCurrentMaterial]?.index;
  const initialCurResolved =
    initialCurIdx !== null && initialCurIdx !== undefined ? initialCurIdx : "";
  const [currentIndex, setCurrentIndex] = useState(initialCurResolved);

  const initialAltIdx = MATERIAL_CATALOG[initialAlternativeMaterial]?.index;
  const initialAltResolved =
    initialAltIdx !== null && initialAltIdx !== undefined ? initialAltIdx : "";
  const [alternativeIndex, setAlternativeIndex] = useState(initialAltResolved);

  // Component notes or part name (e.g. "Main Body", "Container Lid")
  const [componentPartName, setComponentPartName] = useState(
    "Main Housing / Body",
  );

  // Simulation result & error states
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationError, setSimulationError] = useState(
    initialCurResolved === "" || initialAltResolved === ""
      ? "This material does not have a configured recyclability index and cannot be evaluated."
      : "",
  );
  // Saved products loaded from MongoDB
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  // Selected Product details & simulation states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsError, setProductDetailsError] = useState("");
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [productBaselineScore, setProductBaselineScore] = useState(null);
  const [simulatedProductScore, setSimulatedProductScore] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Database update states for persisting simulation improvements
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [updateProductSuccess, setUpdateProductSuccess] = useState("");
  const [updateProductError, setUpdateProductError] = useState("");

  // Material configured status check - accepts index only when configured in MATERIAL_CATALOG
  const isCurrentConfigured =
    MATERIAL_CATALOG[currentMaterial]?.index !== null &&
    MATERIAL_CATALOG[currentMaterial]?.index !== undefined;

  const isAlternativeConfigured =
    MATERIAL_CATALOG[alternativeMaterial]?.index !== null &&
    MATERIAL_CATALOG[alternativeMaterial]?.index !== undefined;

  // Load saved products from MongoDB when the page opens
  useEffect(() => {
    const loadSavedProducts = async () => {
      setProductsLoading(true);
      setProductsError("");

      try {
        const data = await getProducts();
        console.log("Saved products from API:", data);
        setProducts(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        setProductsError(error.message || "Failed to load saved products.");
      } finally {
        setProductsLoading(false);
      }
    };

    loadSavedProducts();
  }, []);

  // Helper to sync selected material from product into simulation parameters
  const applyMaterialSelection = (mat, index) => {
    setSelectedMaterialIndex(index);
    const matName = (mat.name || "").trim();
    setComponentPartName(matName || `Component ${index + 1}`);

    // Check if material name matches or contains a known catalog key
    const catalogMatch =
      Object.keys(MATERIAL_CATALOG).find(
        (k) => k.toLowerCase() === matName.toLowerCase(),
      ) ||
      Object.keys(MATERIAL_CATALOG).find((k) =>
        matName.toLowerCase().includes(k.toLowerCase()),
      );

    const chosenMaterial = catalogMatch || matName || "Custom Material";
    setCurrentMaterial(chosenMaterial);

    const catIdx = MATERIAL_CATALOG[chosenMaterial]?.index;
    const resolvedIndex =
      catIdx !== null && catIdx !== undefined ? catIdx : "";

    setCurrentIndex(resolvedIndex);
    const isCurConf = catIdx !== null && catIdx !== undefined;
    const isAltConf =
      MATERIAL_CATALOG[alternativeMaterial]?.index !== null &&
      MATERIAL_CATALOG[alternativeMaterial]?.index !== undefined;

    if (!isCurConf || resolvedIndex === "") {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
    } else if (
      !isAltConf ||
      alternativeIndex === "" ||
      alternativeIndex === null ||
      alternativeIndex === undefined ||
      isNaN(Number(alternativeIndex))
    ) {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
    } else {
      setSimulationError("");
    }
  };

  // Handle product selection from dropdown
  const handleProductSelect = async (productId) => {
    setSelectedProductId(productId);
    setProductDetailsError("");
    setSimulationResult(null);
    setSimulatedProductScore(null);

    if (!productId) {
      setSelectedProduct(null);
      setProductBaselineScore(null);
      return;
    }

    setProductDetailsLoading(true);
    try {
      // 1. Fetch full product specifications from existing API
      const res = await getProductById(productId);
      const productData = res.data || res;
      setSelectedProduct(productData);

      // 2. Fetch or compute baseline score for product
      try {
        const scoreRes = await getProductScore(productId);
        if (scoreRes && scoreRes.success) {
          setProductBaselineScore(scoreRes.data);
        } else if (
          Array.isArray(productData.materials) &&
          productData.materials.length > 0
        ) {
          const calcRes = await calculateScore(productData);
          if (calcRes && calcRes.success) {
            setProductBaselineScore(calcRes.data);
          }
        }
      } catch (scoreErr) {
        console.warn("Baseline score fetch fallback:", scoreErr);
        if (
          Array.isArray(productData.materials) &&
          productData.materials.length > 0
        ) {
          try {
            const fallbackCalc = await calculateScore(productData);
            if (fallbackCalc && fallbackCalc.success) {
              setProductBaselineScore(fallbackCalc.data);
            }
          } catch {
            // ignore fallback score calculation error
          }
        }
      }

      // 3. Pre-select first material from the retrieved product
      if (
        Array.isArray(productData.materials) &&
        productData.materials.length > 0
      ) {
        applyMaterialSelection(productData.materials[0], 0);
      }
    } catch (err) {
      setProductDetailsError(err.message || "Failed to load product details.");
      setSelectedProduct(null);
      setProductBaselineScore(null);
    } finally {
      setProductDetailsLoading(false);
    }
  };

  // Handle user picking a specific material from the product
  const handleSelectProductMaterial = (index) => {
    if (
      !selectedProduct ||
      !Array.isArray(selectedProduct.materials) ||
      !selectedProduct.materials[index]
    ) {
      return;
    }
    applyMaterialSelection(selectedProduct.materials[index], index);
    setSimulationResult(null);
    setSimulatedProductScore(null);
  };

  // Clear selected product and return to standalone mode
  const handleClearProduct = () => {
    setSelectedProductId("");
    setSelectedProduct(null);
    setProductBaselineScore(null);
    setSimulatedProductScore(null);
    setProductDetailsError("");
    setUpdateProductSuccess("");
    setUpdateProductError("");
  };

  // Handle initialProductId passed via navigation from Product Analysis page
  useEffect(() => {
    if (initialProductId) {
      handleProductSelect(initialProductId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductId]);

  // Handle initial materials passed from recommendations or navigation context
  useEffect(() => {
    if (!initialProductId) {
      if (initialCurrentMaterial) {
        setCurrentMaterial(initialCurrentMaterial);
        const curIdx = MATERIAL_CATALOG[initialCurrentMaterial]?.index;
        setCurrentIndex(curIdx !== null && curIdx !== undefined ? curIdx : "");
      }
      if (initialAlternativeMaterial) {
        setAlternativeMaterial(initialAlternativeMaterial);
        const altIdx = MATERIAL_CATALOG[initialAlternativeMaterial]?.index;
        setAlternativeIndex(altIdx !== null && altIdx !== undefined ? altIdx : "");
      }
    }
  }, [initialProductId, initialCurrentMaterial, initialAlternativeMaterial]);

  // Save simulated material changes directly back to MongoDB
  const handleSaveSimulationToProduct = async () => {
    if (!selectedProduct || !simulationResult) return;
    const prodId = selectedProduct._id || selectedProduct.id;
    if (!prodId) return;

    const isCurConfiguredForSave =
      MATERIAL_CATALOG[currentMaterial]?.index !== null &&
      MATERIAL_CATALOG[currentMaterial]?.index !== undefined;

    const isAltConfiguredForSave =
      MATERIAL_CATALOG[simulationResult.alternativeMaterial || alternativeMaterial]?.index !== null &&
      MATERIAL_CATALOG[simulationResult.alternativeMaterial || alternativeMaterial]?.index !== undefined;

    const hasValidCurrent =
      isCurConfiguredForSave &&
      currentIndex !== "" &&
      currentIndex !== null &&
      currentIndex !== undefined &&
      !isNaN(Number(currentIndex));
    const hasValidAlt =
      isAltConfiguredForSave &&
      alternativeIndex !== "" &&
      alternativeIndex !== null &&
      alternativeIndex !== undefined &&
      !isNaN(Number(alternativeIndex));

    if (!hasValidCurrent || !hasValidAlt) {
      setSimulationError(
        "This material does not have a configured recyclability index and cannot be evaluated."
      );
      setUpdateProductError(
        "This material does not have a configured recyclability index and cannot be evaluated."
      );
      setUpdatingProduct(false);
      return;
    }

    const updatedMaterials = (selectedProduct.materials || []).map(
      (mat, idx) => {
        if (idx === selectedMaterialIndex) {
          return {
            name: simulationResult.alternativeMaterial,
            recyclabilityIndex: simulationResult.alternativeIndex,
            weight: Number(mat.weight) || 0,
          };
        }
        const matName = (mat.name || "").trim();
        const catalogMatch =
          Object.keys(MATERIAL_CATALOG).find(
            (k) => k.toLowerCase() === matName.toLowerCase(),
          ) ||
          Object.keys(MATERIAL_CATALOG).find((k) =>
            matName.toLowerCase().includes(k.toLowerCase()),
          );
        const catKey = catalogMatch || matName;
        const catIdx = MATERIAL_CATALOG[catKey]?.index;
        const canonicalIdx =
          catIdx !== null && catIdx !== undefined ? catIdx : null;
        return {
          name: mat.name,
          recyclabilityIndex: canonicalIdx,
          weight: Number(mat.weight) || 0,
        };
      },
    );

    const hasUnconfigured = updatedMaterials.some(
      (m) => m.recyclabilityIndex === null || isNaN(m.recyclabilityIndex),
    );
    if (hasUnconfigured) {
      setUpdateProductError(
        "This material does not have a configured recyclability index and cannot be evaluated.",
      );
      setUpdatingProduct(false);
      return;
    }

    setUpdatingProduct(true);
    setUpdateProductSuccess("");
    setUpdateProductError("");

    try {
      const updatedPayload = {
        name: selectedProduct.name,
        category: selectedProduct.category,
        description: selectedProduct.description,
        packaging: selectedProduct.packaging,
        materials: updatedMaterials,
      };

      const res = await updateProduct(prodId, updatedPayload);
      if (res && res.success) {
        const savedData = res.data || updatedPayload;
        setSelectedProduct(savedData);
        // Refresh products list in state so dropdown has fresh data
        setProducts((prev) =>
          prev.map((p) => ((p._id || p.id) === prodId ? savedData : p)),
        );
        if (simulatedProductScore) {
          setProductBaselineScore(simulatedProductScore);
        }
        setUpdateProductSuccess(
          `Product "${selectedProduct.name}" updated successfully in database with ${simulationResult.alternativeMaterial}!`,
        );
      } else {
        setUpdateProductError(
          res.error || "Failed to update product in database.",
        );
      }
    } catch (err) {
      setUpdateProductError(
        err.message || "Server error while updating product.",
      );
    } finally {
      setUpdatingProduct(false);
    }
  };

  // Handle current material dropdown change
  const handleCurrentMaterialChange = (e) => {
    const selected = e.target.value;
    setCurrentMaterial(selected);
    const catIdx = MATERIAL_CATALOG[selected]?.index;
    const resolvedIdx = catIdx !== null && catIdx !== undefined ? catIdx : "";
    setCurrentIndex(resolvedIdx);
    const isCurConf = catIdx !== null && catIdx !== undefined;
    const isAltConf =
      MATERIAL_CATALOG[alternativeMaterial]?.index !== null &&
      MATERIAL_CATALOG[alternativeMaterial]?.index !== undefined;

    if (!isCurConf || resolvedIdx === "") {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
    } else if (
      !isAltConf ||
      alternativeIndex === "" ||
      alternativeIndex === null ||
      alternativeIndex === undefined ||
      isNaN(Number(alternativeIndex))
    ) {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
    } else {
      setSimulationError("");
    }
  };

  // Handle alternative material dropdown change
  const handleAlternativeMaterialChange = (e) => {
    const selected = e.target.value;
    setAlternativeMaterial(selected);
    const catIdx = MATERIAL_CATALOG[selected]?.index;
    const resolvedIdx = catIdx !== null && catIdx !== undefined ? catIdx : "";
    setAlternativeIndex(resolvedIdx);
    const isAltConf = catIdx !== null && catIdx !== undefined;
    const isCurConf =
      MATERIAL_CATALOG[currentMaterial]?.index !== null &&
      MATERIAL_CATALOG[currentMaterial]?.index !== undefined;

    if (!isAltConf || resolvedIdx === "") {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
    } else if (
      !isCurConf ||
      currentIndex === "" ||
      currentIndex === null ||
      currentIndex === undefined ||
      isNaN(Number(currentIndex))
    ) {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
    } else {
      setSimulationError("");
    }
  };

  // Quick preset scenario loader
  const handleApplyPreset = (preset) => {
    setCurrentMaterial(preset.current);
    const curCatIdx = MATERIAL_CATALOG[preset.current]?.index;
    const curIdx = curCatIdx !== null && curCatIdx !== undefined ? curCatIdx : "";
    setCurrentIndex(curIdx);

    setAlternativeMaterial(preset.alternative);
    const altCatIdx = MATERIAL_CATALOG[preset.alternative]?.index;
    const altIdx = altCatIdx !== null && altCatIdx !== undefined ? altCatIdx : "";
    setAlternativeIndex(altIdx);

    const isCurConf = curCatIdx !== null && curCatIdx !== undefined;
    const isAltConf = altCatIdx !== null && altCatIdx !== undefined;

    if (!isCurConf || !isAltConf || curIdx === "" || altIdx === "") {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
      return;
    }

    setSimulationError("");
    // Auto trigger simulation for smooth user experience
    computeSimulation(preset.current, curIdx, preset.alternative, altIdx);
  };

  // Compute simulation values on the frontend and call backend API for product score if applicable
  const computeSimulation = async (currMat, currIdx, altMat, altIdx) => {
    const isCurConfiguredInCompute =
      MATERIAL_CATALOG[currMat]?.index !== null &&
      MATERIAL_CATALOG[currMat]?.index !== undefined;

    const isAltConfiguredInCompute =
      MATERIAL_CATALOG[altMat]?.index !== null &&
      MATERIAL_CATALOG[altMat]?.index !== undefined;

    const hasValidCurrent =
      isCurConfiguredInCompute &&
      currIdx !== "" &&
      currIdx !== null &&
      currIdx !== undefined &&
      !isNaN(Number(currIdx));
    const hasValidAlt =
      isAltConfiguredInCompute &&
      altIdx !== "" &&
      altIdx !== null &&
      altIdx !== undefined &&
      !isNaN(Number(altIdx));

    if (!hasValidCurrent || !hasValidAlt) {
      setSimulationError(
        "This material does not have a configured recyclability index and cannot be evaluated."
      );
      setSimulationResult(null);
      setSimulatedProductScore(null);
      return;
    }

    setSimulationError("");
    const numCurrent = Math.max(0, Math.min(100, Number(currIdx)));
    const numAlternative = Math.max(0, Math.min(100, Number(altIdx)));
    const scoreDiff = numAlternative - numCurrent;

    let impactStatus = "neutral";
    if (scoreDiff > 0) {
      impactStatus = "improved";
    } else if (scoreDiff < 0) {
      impactStatus = "decreased";
    }

    const percentChange =
      numCurrent > 0
        ? ((scoreDiff / numCurrent) * 100).toFixed(1)
        : numAlternative > 0
          ? "+100"
          : "0";

    setSimulationResult({
      partName: componentPartName.trim() || "Product Component",
      currentMaterial: currMat,
      currentIndex: numCurrent,
      currentMeta: getRatingMeta(numCurrent),
      alternativeMaterial: altMat,
      alternativeIndex: numAlternative,
      alternativeMeta: getRatingMeta(numAlternative),
      scoreDifference: scoreDiff,
      percentChange,
      impactStatus,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    // If a saved product is selected, also compute product-level impact via scoring API
    if (
      selectedProduct &&
      Array.isArray(selectedProduct.materials) &&
      selectedProduct.materials.length > 0
    ) {
      setSimulating(true);
      try {
        const updatedMaterials = selectedProduct.materials.map((mat, idx) => {
          if (idx === selectedMaterialIndex) {
            return {
              name: altMat,
              recyclabilityIndex: numAlternative,
              weight: Number(mat.weight) || 0,
            };
          }
          const matName = (mat.name || "").trim();
          const catalogMatch =
            Object.keys(MATERIAL_CATALOG).find(
              (k) => k.toLowerCase() === matName.toLowerCase(),
            ) ||
            Object.keys(MATERIAL_CATALOG).find((k) =>
              matName.toLowerCase().includes(k.toLowerCase()),
            );
          const catKey = catalogMatch || matName;
          const catIdx = MATERIAL_CATALOG[catKey]?.index;
          const canonicalIdx =
            catIdx !== null && catIdx !== undefined ? catIdx : null;
          return {
            name: mat.name,
            recyclabilityIndex: canonicalIdx,
            weight: Number(mat.weight) || 0,
          };
        });

        const hasUnconfiguredMat = updatedMaterials.some(
          (m) => m.recyclabilityIndex === null || isNaN(m.recyclabilityIndex)
        );

        if (hasUnconfiguredMat) {
          setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
          setSimulatedProductScore(null);
          return;
        }

        const simulatedPayload = {
          name: selectedProduct.name,
          category: selectedProduct.category,
          materials: updatedMaterials,
        };

        const res = await calculateScore(simulatedPayload);
        if (res && res.success) {
          setSimulatedProductScore(res.data);
        }
      } catch (err) {
        console.error(
          "Failed to compute product simulation score via API:",
          err,
        );
      } finally {
        setSimulating(false);
      }
    } else {
      setSimulatedProductScore(null);
    }
  };

  // "Simulate" Button Click Handler
  const handleSimulate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const hasValidCurrent =
      isCurrentConfigured &&
      currentIndex !== "" &&
      currentIndex !== null &&
      currentIndex !== undefined &&
      !isNaN(Number(currentIndex));
    const hasValidAlt =
      isAlternativeConfigured &&
      alternativeIndex !== "" &&
      alternativeIndex !== null &&
      alternativeIndex !== undefined &&
      !isNaN(Number(alternativeIndex));

    if (!hasValidCurrent || !hasValidAlt) {
      setSimulationError(
        "This material does not have a configured recyclability index and cannot be evaluated."
      );
      setSimulationResult(null);
      setSimulatedProductScore(null);
      return;
    }

    setSimulationError("");
    await computeSimulation(
      currentMaterial,
      currentIndex,
      alternativeMaterial,
      alternativeIndex,
    );
  };

  // Reset simulation form to default clean state
  const handleReset = () => {
    if (
      selectedProduct &&
      Array.isArray(selectedProduct.materials) &&
      selectedProduct.materials.length > 0
    ) {
      applyMaterialSelection(selectedProduct.materials[0], 0);
      setAlternativeMaterial("Aluminium");
      const altCatIdx = MATERIAL_CATALOG["Aluminium"]?.index;
      const altIdx = altCatIdx !== null && altCatIdx !== undefined ? altCatIdx : "";
      setAlternativeIndex(altIdx);
      setSimulationResult(null);
      setSimulatedProductScore(null);
    } else {
      setCurrentMaterial("PVC");
      const curCatIdx = MATERIAL_CATALOG["PVC"]?.index;
      const curIdx = curCatIdx !== null && curCatIdx !== undefined ? curCatIdx : "";
      setCurrentIndex(curIdx);
      setAlternativeMaterial("Aluminium");
      const altCatIdx = MATERIAL_CATALOG["Aluminium"]?.index;
      const altIdx = altCatIdx !== null && altCatIdx !== undefined ? altCatIdx : "";
      setAlternativeIndex(altIdx);
      setComponentPartName("Main Housing / Body");
      setSimulationResult(null);
      setSimulatedProductScore(null);
      setSimulationError("");
    }
  };

  // Swap materials button handler
  const handleSwapMaterials = () => {
    const prevCurrentMat = currentMaterial;
    const prevCurrentIdx = currentIndex;

    setCurrentMaterial(alternativeMaterial);
    setCurrentIndex(alternativeIndex);

    setAlternativeMaterial(prevCurrentMat);
    setAlternativeIndex(prevCurrentIdx);

    const isNewCurConfigured =
      MATERIAL_CATALOG[alternativeMaterial]?.index !== null &&
      MATERIAL_CATALOG[alternativeMaterial]?.index !== undefined;
    const isNewAltConfigured =
      MATERIAL_CATALOG[prevCurrentMat]?.index !== null &&
      MATERIAL_CATALOG[prevCurrentMat]?.index !== undefined;

    const hasValidCurrent =
      isNewCurConfigured &&
      alternativeIndex !== "" &&
      alternativeIndex !== null &&
      alternativeIndex !== undefined &&
      !isNaN(Number(alternativeIndex));
    const hasValidAlt =
      isNewAltConfigured &&
      prevCurrentIdx !== "" &&
      prevCurrentIdx !== null &&
      prevCurrentIdx !== undefined &&
      !isNaN(Number(prevCurrentIdx));

    if (!hasValidCurrent || !hasValidAlt) {
      setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
      setSimulationResult(null);
      setSimulatedProductScore(null);
      return;
    }

    setSimulationError("");
    if (simulationResult) {
      computeSimulation(
        alternativeMaterial,
        alternativeIndex,
        prevCurrentMat,
        prevCurrentIdx,
      );
    }
  };

  const currentInfo = MATERIAL_CATALOG[currentMaterial] || {};
  const alternativeInfo = MATERIAL_CATALOG[alternativeMaterial] || {};

  return (
    <div className="page-container simulation-page">
      {/* 1. Page Header */}
      <div className="page-header">
        <h1>What-If Material Simulation</h1>
        <p className="page-subtitle">
          Test alternative materials to forecast recyclability score impact,
          discover circular substitutes, and optimize sustainability before
          production.
        </p>
      </div>

      {/* 2. Beginner-friendly Guidance Callout */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          background: "#f0f9f4",
          borderColor: "#c2e7d0",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          padding: "16px 20px",
        }}
      >
        <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>💡</span>
        <div>
          <strong style={{ color: "#1b5e20", fontSize: "0.95rem" }}>
            How Material Simulation Works
          </strong>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "0.88rem",
              color: "#2e5630",
              lineHeight: 1.45,
            }}
          >
            Each material has a baseline{" "}
            <strong>Recyclability Index (0 – 100)</strong> representing
            municipal sorting efficiency and market reuse demand. Select your
            current component material and test a proposed substitute to
            calculate the immediate index difference.
          </p>
        </div>
      </div>
      {/* 3. Saved Product Selection */}
      <div
        className="card"
        style={{
          marginBottom: "20px",
          padding: "16px 20px",
        }}
      >
        <h2 className="section-title">Select Saved Product</h2>

        <div className="form-group">
          <label htmlFor="saved-product-select">Product to Simulate</label>

          <select
            id="saved-product-select"
            value={selectedProductId}
            onChange={(e) => handleProductSelect(e.target.value)}
            disabled={productsLoading || productDetailsLoading}
          >
            <option value="">
              {productsLoading
                ? "Loading saved products..."
                : "-- Standalone / Custom Simulation (No Product) --"}
            </option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} ({product.category}) —{" "}
                {product.materials?.length || 0} materials
              </option>
            ))}
          </select>
        </div>

        {productDetailsLoading && (
          <div
            style={{
              marginTop: "10px",
              color: "#166534",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div className="spinner" style={{ width: "16px", height: "16px" }}></div>
            <span>Loading product specifications & materials from backend...</span>
          </div>
        )}

        {productsError && (
          <p style={{ color: "#b91c1c", marginTop: "8px" }}>{productsError}</p>
        )}

        {productDetailsError && (
          <p style={{ color: "#b91c1c", marginTop: "8px" }}>{productDetailsError}</p>
        )}

        {selectedProduct && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 14px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 700,
                  color: "#166534",
                  fontSize: "0.95rem",
                }}
              >
                ✓ Active Product: {selectedProduct.name}
              </span>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "#475569",
                  marginTop: "2px",
                }}
              >
                Category: <strong>{selectedProduct.category}</strong> •
                Materials:{" "}
                <strong>{selectedProduct.materials?.length || 0}</strong> • Total
                Weight:{" "}
                <strong>
                  {selectedProduct.materials
                    ? selectedProduct.materials
                        .reduce((acc, m) => acc + (Number(m.weight) || 0), 0)
                        .toFixed(3)
                    : 0}{" "}
                  kg
                </strong>
                {productBaselineScore && (
                  <span>
                    {" "}
                    • Baseline Recyclability:{" "}
                    <strong style={{ color: "#166534" }}>
                      {productBaselineScore.finalScore}/100 (Grade{" "}
                      {productBaselineScore.grade})
                    </strong>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleClearProduct}
              title="Disconnect product and return to standalone simulation mode"
            >
              ✕ Switch to Standalone Mode
            </button>
          </div>
        )}
      </div>

      {/* 3. Quick Scenario Presets */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}
          >
            ⚡ Quick Simulation Presets:
          </span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => handleApplyPreset(preset)}
              title={`Simulate swap: ${preset.title}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Two-Column Workspace Layout */}
      <div className="analysis-layout">
        {/* Left Column: Material Selector & Controls */}
        <div className="card">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">1. Simulation Parameters</h2>
              <p className="section-description">
                {selectedProduct
                  ? `Select a component from "${selectedProduct.name}" to replace with an eco-friendly candidate.`
                  : "Configure your current component and select an eco-friendly candidate to evaluate."}
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleSwapMaterials}
              title="Swap current and alternative material selections"
            >
              ⇄ Swap Materials
            </button>
          </div>

          <form onSubmit={handleSimulate}>
            {simulationError && (
              <div
                className="error-banner"
                role="alert"
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <div>{simulationError}</div>
              </div>
            )}

            {/* Display Selected Product's Actual Materials & Allow Component Selection */}
            {selectedProduct && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "14px 16px",
                  backgroundColor: "#f8faf9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#1b4d3e",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    Product Materials ({selectedProduct.materials?.length || 0})
                    — Select Material to Replace:
                  </label>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Click an item to target it for replacement
                  </span>
                </div>

                {!Array.isArray(selectedProduct.materials) ||
                selectedProduct.materials.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                    No materials recorded for this product.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {selectedProduct.materials.map((mat, idx) => {
                      const isSelected = selectedMaterialIndex === idx;
                      const matName = (mat.name || "").trim();
                      const catalogMatch =
                        Object.keys(MATERIAL_CATALOG).find(
                          (k) => k.toLowerCase() === matName.toLowerCase(),
                        ) ||
                        Object.keys(MATERIAL_CATALOG).find((k) =>
                          matName.toLowerCase().includes(k.toLowerCase()),
                        );
                      const catKey = catalogMatch || matName;
                      const catIdx = MATERIAL_CATALOG[catKey]?.index;
                      const hasConfiguredIndex =
                        catIdx !== null && catIdx !== undefined;
                      const matIdx = hasConfiguredIndex ? catIdx : null;
                      const ratingMeta = hasConfiguredIndex ? getRatingMeta(matIdx) : null;

                      return (
                        <div
                          key={`prod-mat-row-${idx}`}
                          onClick={() => handleSelectProductMaterial(idx)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            border: isSelected
                              ? "2px solid #2e7d32"
                              : "1px solid #e2e8f0",
                            backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                            boxShadow: isSelected
                              ? "0 2px 8px rgba(46, 125, 50, 0.12)"
                              : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <input
                              type="radio"
                              id={`radio-mat-${idx}`}
                              name="product-material-choice"
                              checked={isSelected}
                              onChange={() => handleSelectProductMaterial(idx)}
                              style={{
                                cursor: "pointer",
                                accentColor: "#2e7d32",
                              }}
                            />
                            <div>
                              <div
                                style={{
                                  fontWeight: isSelected ? 700 : 600,
                                  color: isSelected ? "#1b4d3e" : "#1e293b",
                                  fontSize: "0.9rem",
                                }}
                              >
                                {mat.name || `Material #${idx + 1}`}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.78rem",
                                  color: "#64748b",
                                  marginTop: "2px",
                                }}
                              >
                                Weight: {mat.weight} kg
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "10px",
                                backgroundColor:
                                  !hasConfiguredIndex
                                    ? "#fee2e2"
                                    : matIdx >= 80
                                      ? "#dcfce7"
                                      : matIdx >= 50
                                        ? "#fef3c7"
                                        : "#fee2e2",
                                color:
                                  !hasConfiguredIndex
                                    ? "#991b1b"
                                    : matIdx >= 80
                                      ? "#166534"
                                      : matIdx >= 50
                                        ? "#92400e"
                                        : "#991b1b",
                              }}
                            >
                              {hasConfiguredIndex
                                ? `Index: ${matIdx} (Grade ${ratingMeta.grade})`
                                : "Index: Unavailable"}
                            </span>
                            {isSelected && (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  backgroundColor: "#2e7d32",
                                  color: "#ffffff",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                Target
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Component Name */}
            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label htmlFor="sim-part-name">
                Component / Part Description
              </label>
              <input
                id="sim-part-name"
                type="text"
                placeholder="e.g., Main Housing, Bottle Body, Outer Lid"
                value={componentPartName}
                onChange={(e) => setComponentPartName(e.target.value)}
              />
            </div>

            {/* Current vs Alternative Material Comparison Boxes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {/* CURRENT MATERIAL CARD */}
              <div
                style={{
                  padding: "16px",
                  background: "#fff9f9",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#b91c1c",
                    }}
                  >
                    ● Current Material
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#fee2e2",
                      color: "#991b1b",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {currentInfo.category || "General"}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label htmlFor="current-material-select">Material Type</label>
                  <select
                    id="current-material-select"
                    value={currentMaterial}
                    onChange={handleCurrentMaterialChange}
                  >
                    {!MATERIAL_OPTIONS.includes(currentMaterial) && (
                      <option value={currentMaterial}>{currentMaterial}</option>
                    )}
                    {MATERIAL_OPTIONS.map((opt) => (
                      <option key={`current-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label htmlFor="current-index-input">
                    Current Recyclability Index (0-100)
                  </label>
                  <input
                    id="current-index-input"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Unavailable"
                    disabled={!isCurrentConfigured}
                    value={currentIndex !== null && currentIndex !== undefined ? currentIndex : ""}
                    onChange={(e) => {
                      if (!isCurrentConfigured) return;
                      const val = e.target.value;
                      setCurrentIndex(val);
                      if (val === "" || isNaN(Number(val))) {
                        setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
                        setSimulationResult(null);
                        setSimulatedProductScore(null);
                      } else {
                        const hasAltValid =
                          isAlternativeConfigured &&
                          alternativeIndex !== "" &&
                          alternativeIndex !== null &&
                          alternativeIndex !== undefined &&
                          !isNaN(Number(alternativeIndex));
                        if (!hasAltValid) {
                          setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
                        } else {
                          setSimulationError("");
                        }
                      }
                    }}
                    style={{
                      cursor: !isCurrentConfigured ? "not-allowed" : undefined,
                      backgroundColor: !isCurrentConfigured ? "#f1f5f9" : undefined,
                      color: !isCurrentConfigured ? "#64748b" : undefined,
                    }}
                    required
                  />
                  {(!isCurrentConfigured || currentIndex === "" || currentIndex === null || currentIndex === undefined) && (
                    <div style={{ marginTop: "4px", fontSize: "0.78rem", color: "#b91c1c", fontWeight: 600 }}>
                      ⚠️ Index Unavailable
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    margin: "6px 0 0 0",
                    lineHeight: 1.4,
                  }}
                >
                  {currentInfo.description}
                </p>
              </div>

              {/* ALTERNATIVE MATERIAL CARD */}
              <div
                style={{
                  padding: "16px",
                  background: "#f2fcf5",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#15803d",
                    }}
                  >
                    ● Alternative Material
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#dcfce7",
                      color: "#166534",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {alternativeInfo.category || "General"}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label htmlFor="alternative-material-select">
                    Proposed Alternative
                  </label>
                  <select
                    id="alternative-material-select"
                    value={alternativeMaterial}
                    onChange={handleAlternativeMaterialChange}
                  >
                    {MATERIAL_OPTIONS.map((opt) => (
                      <option key={`alt-${opt}`} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <label htmlFor="alt-index-input">
                    Alternative Recyclability Index (0-100)
                  </label>
                  <input
                    id="alt-index-input"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Unavailable"
                    disabled={!isAlternativeConfigured}
                    value={alternativeIndex !== null && alternativeIndex !== undefined ? alternativeIndex : ""}
                    onChange={(e) => {
                      if (!isAlternativeConfigured) return;
                      const val = e.target.value;
                      setAlternativeIndex(val);
                      if (val === "" || isNaN(Number(val))) {
                        setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
                        setSimulationResult(null);
                        setSimulatedProductScore(null);
                      } else {
                        const hasCurValid =
                          isCurrentConfigured &&
                          currentIndex !== "" &&
                          currentIndex !== null &&
                          currentIndex !== undefined &&
                          !isNaN(Number(currentIndex));
                        if (!hasCurValid) {
                          setSimulationError("This material does not have a configured recyclability index and cannot be evaluated.");
                        } else {
                          setSimulationError("");
                        }
                      }
                    }}
                    style={{
                      cursor: !isAlternativeConfigured ? "not-allowed" : undefined,
                      backgroundColor: !isAlternativeConfigured ? "#f1f5f9" : undefined,
                      color: !isAlternativeConfigured ? "#64748b" : undefined,
                    }}
                    required
                  />
                  {(!isAlternativeConfigured || alternativeIndex === "" || alternativeIndex === null || alternativeIndex === undefined) && (
                    <div style={{ marginTop: "4px", fontSize: "0.78rem", color: "#b91c1c", fontWeight: 600 }}>
                      ⚠️ Index Unavailable
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#64748b",
                    margin: "6px 0 0 0",
                    lineHeight: 1.4,
                  }}
                >
                  {alternativeInfo.ecoTip || alternativeInfo.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  simulating ||
                  !isCurrentConfigured ||
                  !isAlternativeConfigured ||
                  currentIndex === "" ||
                  alternativeIndex === ""
                }
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>
                  {simulating ? "Calculating Impact..." : "⚡ Simulate Impact"}
                </span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                title="Reset to default choices"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-time Simulation Results */}
        <div className="card score-panel">
          <h2 className="section-title">2. Simulation Results</h2>

          {simulationError ? (
            /* Simulation Error State */
            <div
              className="error-banner"
              role="alert"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "10px",
                padding: "28px 20px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: "8px",
                margin: "12px 0",
              }}
            >
              <span style={{ fontSize: "2rem" }}>⚠️</span>
              <h3 style={{ margin: 0, color: "#991b1b" }}>Evaluation Blocked</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.92rem", color: "#7f1d1d" }}>
                {simulationError}
              </p>
            </div>
          ) : !simulationResult ? (
            /* Empty State Placeholder */
            <div className="placeholder-container score-placeholder-empty">
              <div className="placeholder-icon">🌱</div>
              <h3>Ready to Simulate</h3>
              <p>
                Select a current material and a potential alternative on the
                left, then click <strong>"Simulate Impact"</strong> to compute
                the recyclability difference.
              </p>
            </div>
          ) : (
            /* Computed Results Dashboard */
            <div className="results-container">
              {/* Outcome Banner: Improved vs Decreased vs Neutral */}
              {simulationResult.impactStatus === "improved" && (
                <div
                  className="success-banner"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 16px",
                    fontSize: "0.92rem",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>✅</span>
                  <div>
                    <strong>Recyclability Improvement!</strong>
                    <div style={{ fontWeight: 400, marginTop: "2px" }}>
                      Switching to {simulationResult.alternativeMaterial}{" "}
                      increases component recyclability by{" "}
                      <strong>
                        +{simulationResult.scoreDifference} points
                      </strong>{" "}
                      (
                      {simulationResult.percentChange > 0
                        ? `+${simulationResult.percentChange}%`
                        : `${simulationResult.percentChange}%`}
                      ).
                    </div>
                  </div>
                </div>
              )}

              {simulationResult.impactStatus === "decreased" && (
                <div
                  className="error-banner"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 16px",
                    fontSize: "0.92rem",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>⚠️</span>
                  <div>
                    <strong>Recyclability Decrease Detected</strong>
                    <div style={{ fontWeight: 400, marginTop: "2px" }}>
                      Switching to {simulationResult.alternativeMaterial}{" "}
                      reduces component recyclability by{" "}
                      <strong>{simulationResult.scoreDifference} points</strong>{" "}
                      ({simulationResult.percentChange}%). Consider higher-rated
                      circular materials.
                    </div>
                  </div>
                </div>
              )}

              {simulationResult.impactStatus === "neutral" && (
                <div
                  style={{
                    backgroundColor: "#f1f5f9",
                    borderLeft: "4px solid #64748b",
                    color: "#334155",
                    padding: "14px 16px",
                    borderRadius: "6px",
                    fontSize: "0.92rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>⚖️</span>
                  <div>
                    <strong>Neutral Impact (No Index Change)</strong>
                    <div style={{ fontWeight: 400, marginTop: "2px" }}>
                      Both materials share identical recyclability index ratings
                      ({simulationResult.currentIndex}/100).
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-side Score Transformation Card */}
              <div
                style={{
                  background: "#f8faf9",
                  border: "1px solid #d8e6d2",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Component: {simulationResult.partName}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    gap: "12px",
                    textAlign: "center",
                  }}
                >
                  {/* Current Material Box */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px 8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      CURRENT
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#1e293b",
                        marginBottom: "6px",
                      }}
                    >
                      {simulationResult.currentMaterial}
                    </div>
                    <div
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        color: "#334155",
                      }}
                    >
                      {simulationResult.currentIndex}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Grade {simulationResult.currentMeta.grade}
                    </div>
                  </div>

                  {/* Transformation Arrow & Delta Badge */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem", color: "#64748b" }}>
                      ➔
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        padding: "4px 8px",
                        borderRadius: "12px",
                        whiteSpace: "nowrap",
                        backgroundColor:
                          simulationResult.scoreDifference > 0
                            ? "#dcfce7"
                            : simulationResult.scoreDifference < 0
                              ? "#fee2e2"
                              : "#f1f5f9",
                        color:
                          simulationResult.scoreDifference > 0
                            ? "#15803d"
                            : simulationResult.scoreDifference < 0
                              ? "#b91c1c"
                              : "#475569",
                      }}
                    >
                      {simulationResult.scoreDifference > 0
                        ? `+${simulationResult.scoreDifference}`
                        : simulationResult.scoreDifference}{" "}
                      pts
                    </span>
                  </div>

                  {/* Alternative Material Box */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "12px 8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#15803d",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      ALTERNATIVE
                    </div>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#1e293b",
                        marginBottom: "6px",
                      }}
                    >
                      {simulationResult.alternativeMaterial}
                    </div>
                    <div
                      style={{
                        fontSize: "1.6rem",
                        fontWeight: 800,
                        color: "#15803d",
                      }}
                    >
                      {simulationResult.alternativeIndex}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#15803d",
                        fontWeight: 600,
                      }}
                    >
                      Grade {simulationResult.alternativeMeta.grade}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Comparative Index Bar */}
              <div className="breakdown-section">
                <h3>Visual Index Comparison (0 - 100)</h3>

                {/* Current Material Bar */}
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    <span>{simulationResult.currentMaterial} (Current)</span>
                    <span>{simulationResult.currentIndex} / 100</span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      backgroundColor: "#e2e8f0",
                      borderRadius: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${simulationResult.currentIndex}%`,
                        height: "100%",
                        backgroundColor:
                          simulationResult.currentIndex >= 80
                            ? "#2e7d32"
                            : simulationResult.currentIndex >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                        borderRadius: "5px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Alternative Material Bar */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    <span>
                      {simulationResult.alternativeMaterial} (Alternative)
                    </span>
                    <span>{simulationResult.alternativeIndex} / 100</span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      backgroundColor: "#e2e8f0",
                      borderRadius: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${simulationResult.alternativeIndex}%`,
                        height: "100%",
                        backgroundColor:
                          simulationResult.alternativeIndex >= 80
                            ? "#2e7d32"
                            : simulationResult.alternativeIndex >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                        borderRadius: "5px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Product-Level Recyclability Impact Card (when simulating a saved product) */}
              {selectedProduct && simulatedProductScore && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 2px 8px rgba(22, 101, 52, 0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#166534",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      📦 Overall Product Impact: {selectedProduct.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: 600,
                      }}
                    >
                      {selectedProduct.category}
                    </span>
                  </div>

                  {productBaselineScore ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        alignItems: "center",
                        gap: "12px",
                        textAlign: "center",
                        marginBottom: "14px",
                      }}
                    >
                      {/* Baseline Product Score */}
                      <div
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "10px 8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "#64748b",
                            fontWeight: 600,
                            marginBottom: "2px",
                          }}
                        >
                          ORIGINAL PRODUCT
                        </div>
                        <div
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            color: "#334155",
                          }}
                        >
                          {productBaselineScore.finalScore}
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "#64748b",
                            }}
                          >
                            /100
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          Grade {productBaselineScore.grade} •{" "}
                          {productBaselineScore.rating}
                        </div>
                      </div>

                      {/* Product Score Delta */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ fontSize: "1.3rem", color: "#64748b" }}>
                          ➔
                        </span>
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "12px",
                            backgroundColor:
                              simulatedProductScore.finalScore >
                              productBaselineScore.finalScore
                                ? "#dcfce7"
                                : simulatedProductScore.finalScore <
                                    productBaselineScore.finalScore
                                  ? "#fee2e2"
                                  : "#f1f5f9",
                            color:
                              simulatedProductScore.finalScore >
                              productBaselineScore.finalScore
                                ? "#15803d"
                                : simulatedProductScore.finalScore <
                                    productBaselineScore.finalScore
                                  ? "#b91c1c"
                                  : "#475569",
                          }}
                        >
                          {simulatedProductScore.finalScore -
                            productBaselineScore.finalScore >
                          0
                            ? `+${simulatedProductScore.finalScore - productBaselineScore.finalScore}`
                            : simulatedProductScore.finalScore -
                              productBaselineScore.finalScore}{" "}
                          pts
                        </span>
                      </div>

                      {/* Simulated Product Score */}
                      <div
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #86efac",
                          borderRadius: "8px",
                          padding: "10px 8px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "#166534",
                            fontWeight: 600,
                            marginBottom: "2px",
                          }}
                        >
                          SIMULATED PRODUCT
                        </div>
                        <div
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            color: "#166534",
                          }}
                        >
                          {simulatedProductScore.finalScore}
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "#15803d",
                            }}
                          >
                            /100
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#166534",
                          }}
                        >
                          Grade {simulatedProductScore.grade} •{" "}
                          {simulatedProductScore.rating}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: "12px", textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "1.4rem",
                          fontWeight: 800,
                          color: "#166534",
                        }}
                      >
                        Simulated Product Score:{" "}
                        {simulatedProductScore.finalScore}/100 (Grade{" "}
                        {simulatedProductScore.grade})
                      </div>
                    </div>
                  )}

                  {/* Penalty Breakdown */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.78rem",
                      color: "#475569",
                      padding: "8px 12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    <span>
                      Mixed Material Penalty:{" "}
                      <strong>
                        -
                        {simulatedProductScore.penalties
                          ?.mixedMaterialPenalty ?? 0}{" "}
                        pts
                      </strong>
                    </span>
                    <span>
                      Contamination Penalty:{" "}
                      <strong>
                        -
                        {simulatedProductScore.penalties
                          ?.contaminationPenalty ?? 0}{" "}
                        pts
                      </strong>
                    </span>
                  </div>

                  {/* Database Update Feedback Banners */}
                  {updateProductSuccess && (
                    <div
                      className="success-banner"
                      style={{
                        marginTop: "12px",
                        fontSize: "0.85rem",
                        padding: "10px 12px",
                      }}
                    >
                      ✓ {updateProductSuccess}
                    </div>
                  )}

                  {updateProductError && (
                    <div
                      className="error-banner"
                      style={{
                        marginTop: "12px",
                        fontSize: "0.85rem",
                        padding: "10px 12px",
                      }}
                    >
                      {updateProductError}
                    </div>
                  )}

                  {/* Actions for updating DB or applying to editor */}
                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className="btn-success"
                      disabled={
                        updatingProduct ||
                        !simulationResult ||
                        !isCurrentConfigured ||
                        !isAlternativeConfigured ||
                        currentIndex === "" ||
                        alternativeIndex === ""
                      }
                      onClick={handleSaveSimulationToProduct}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>
                        {updatingProduct
                          ? "Saving to Database..."
                          : "💾 Save Updated Product to Database"}
                      </span>
                    </button>

                    {onApplySimulation && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          onApplySimulation({
                            productId:
                              selectedProduct._id || selectedProduct.id,
                            componentName: simulationResult.partName,
                            material: simulationResult.alternativeMaterial,
                            recyclabilityIndex:
                              simulationResult.alternativeIndex,
                            materialIndex: selectedMaterialIndex,
                          })
                        }
                        title="Load this improved material into Product Analysis editor"
                      >
                        Apply to Product Editor ➔
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Key Design Takeaways */}
              <div
                style={{
                  background: "#f4f8f3",
                  border: "1px solid #d8e6d2",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "0.85rem",
                }}
              >
                <strong style={{ color: "#1b4d3e" }}>
                  Circular Design Takeaway:
                </strong>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#334155",
                    lineHeight: 1.4,
                  }}
                >
                  {MATERIAL_CATALOG[simulationResult.alternativeMaterial]
                    ?.ecoTip ||
                    "Evaluating material life cycles helps minimize landfill impact and boosts circular recyclability."}
                </p>
              </div>

              {/* Optional Integration Action if provided */}
              {onApplySimulation && (
                <div style={{ marginTop: "6px" }}>
                  <button
                    type="button"
                    className="btn-success"
                    onClick={() =>
                      onApplySimulation({
                        componentName: simulationResult.partName,
                        material: simulationResult.alternativeMaterial,
                        recyclabilityIndex: simulationResult.alternativeIndex,
                      })
                    }
                  >
                    Apply Alternative to Product Specification
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulationPage;
