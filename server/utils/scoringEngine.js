/**
 * Recyclability Scoring Engine Utility
 * 
 * NOTE: The mixed-material penalty and contamination penalty thresholds used below
 * are project-defined scoring assumptions established for this academic prototype.
 * 
 * Formula:
 * Final Score = Base Weighted Score - Mixed Material Penalty - Contamination Penalty
 * 
 * Base Weighted Score = Σ (Material Weight % × Material Recyclability Index)
 * Mixed Material Penalty = (Number of Materials - 1) * 5 (Max 20 pts)
 * Contamination Penalty = (Weight fraction of materials with recyclabilityIndex < 40) * 15
 */

/**
 * Calculates dynamic recyclability score breakdown for a product.
 * Does not mutate or persist data in MongoDB.
 * 
 * @param {Object} productData - Object containing materials array (and optional name/category)
 * @returns {Object} Calculated score breakdown with intermediate metrics and final score
 */
function calculateRecyclabilityScore(productData) {
  const materials = productData?.materials || [];

  if (!Array.isArray(materials) || materials.length === 0) {
    return {
      productName: productData?.name || 'Unnamed Product',
      totalWeight: 0,
      baseWeightedScore: 0,
      penalties: {
        mixedMaterialPenalty: 0,
        contaminationPenalty: 0,
        totalPenalty: 0
      },
      finalScore: 0,
      rating: 'Low Recyclability',
      grade: 'C',
      warning: 'No materials provided for scoring calculation',
      materialBreakdown: []
    };
  }

  // 1. Calculate total weight across all materials
  const totalWeight = materials.reduce((sum, mat) => sum + (Number(mat.weight) || 0), 0);

  if (totalWeight <= 0) {
    return {
      productName: productData?.name || 'Unnamed Product',
      totalWeight: 0,
      baseWeightedScore: 0,
      penalties: {
        mixedMaterialPenalty: 0,
        contaminationPenalty: 0,
        totalPenalty: 0
      },
      finalScore: 0,
      rating: 'Low Recyclability',
      grade: 'C',
      warning: 'Total material weight must be greater than zero',
      materialBreakdown: []
    };
  }

  let baseWeightedScore = 0;
  let contaminatedWeight = 0;

  // 2. Calculate material weight percentages and weighted contribution
  const materialBreakdown = materials.map((mat) => {
    const weight = Number(mat.weight) || 0;
    const recyclabilityIndex = Math.min(100, Math.max(0, Number(mat.recyclabilityIndex) || 0));
    const weightPercentage = (weight / totalWeight) * 100;
    const contribution = (weightPercentage / 100) * recyclabilityIndex;

    baseWeightedScore += contribution;

    // Track low recyclability materials (< 40) for contamination penalty
    if (recyclabilityIndex < 40) {
      contaminatedWeight += weight;
    }

    return {
      name: mat.name || 'Unknown Material',
      weight: Number(weight.toFixed(4)),
      weightPercentage: Number(weightPercentage.toFixed(2)),
      recyclabilityIndex,
      contribution: Number(contribution.toFixed(2))
    };
  });

  // 3. Calculate Mixed-Material Penalty (Academic Assumption: 5 pts per extra material, max 20)
  const numMaterials = materials.length;
  const mixedMaterialPenalty = numMaterials > 1 ? Math.min(20, (numMaterials - 1) * 5) : 0;

  // 4. Calculate Contamination Penalty (Academic Assumption: up to 15 pts based on fraction of low-index materials)
  const contaminationFraction = contaminatedWeight / totalWeight;
  const contaminationPenalty = Math.round(contaminationFraction * 15);

  const totalPenalty = mixedMaterialPenalty + contaminationPenalty;

  // 5. Calculate Final Score (Clamped between 0 and 100)
  const rawScore = baseWeightedScore - totalPenalty;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // 6. Determine Sustainability Rating Grade
  let rating = 'Low Recyclability';
  let grade = 'C';

  if (finalScore >= 80) {
    rating = 'High Recyclability';
    grade = 'A';
  } else if (finalScore >= 50) {
    rating = 'Moderate Recyclability';
    grade = 'B';
  }

  return {
    productName: productData?.name || 'Unnamed Product',
    totalWeight: Number(totalWeight.toFixed(4)),
    baseWeightedScore: Number(baseWeightedScore.toFixed(2)),
    penalties: {
      mixedMaterialPenalty,
      contaminationPenalty,
      totalPenalty
    },
    finalScore,
    rating,
    grade,
    materialBreakdown
  };
}

module.exports = {
  calculateRecyclabilityScore
};
