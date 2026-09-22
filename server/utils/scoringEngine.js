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
      materialBreakdown: [],
      recommendations: []
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
      materialBreakdown: [],
      recommendations: []
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

  // 7. Generate Rule-Based Sustainable Design Recommendations
  const recommendations = [];

  // Rule 1 & 2: Low-recyclability materials (< 60) and very low (< 40)
  materials.forEach((mat) => {
    const rawIdx = Number(mat.recyclabilityIndex);
    const indexVal = isNaN(rawIdx) ? 0 : Math.min(100, Math.max(0, rawIdx));
    const matName = mat.name ? mat.name.trim() : 'Unknown Material';
    const lowerName = matName.toLowerCase();

    if (indexVal < 60) {
      // Find suitable alternative mapping if reasonable mapping exists
      let alternative = null;
      if (lowerName.includes('pvc')) {
        alternative = {
          suggested: 'PET (Plastic) or HDPE (Plastic)',
          reason: 'PVC contains chlorine which disrupts conventional recycling streams and releases hazardous substances. PET or HDPE has widespread curbside collection and high secondary market demand.'
        };
      } else if (lowerName.includes('rubber')) {
        alternative = {
          suggested: 'Thermoplastic Elastomer (TPE) or PP (Polypropylene)',
          reason: 'Vulcanized rubber cannot be re-melted easily. Thermoplastic Elastomers (TPE) or PP offer flexible properties while maintaining mechanical recyclability.'
        };
      } else if (lowerName.includes('ldpe') || lowerName.includes('film')) {
        alternative = {
          suggested: 'Cardboard / Paper or rigid HDPE',
          reason: 'Thin flexible LDPE film has limited curbside municipal recovery. Paper-based cartons or rigid HDPE containers offer significantly higher circular recovery rates.'
        };
      } else if (lowerName.includes('bioplastic') || lowerName.includes('pla')) {
        alternative = {
          suggested: 'Cardboard / Paper or Recycled PET',
          reason: 'Bioplastics like PLA require commercial high-heat composting facilities and contaminate conventional PET recycling streams. Recycled PET or certified paper has established recycling pathways.'
        };
      } else if (lowerName.includes('other') || lowerName.includes('composite') || lowerName.includes('multi')) {
        alternative = {
          suggested: 'Standardized Mono-Material (e.g., Aluminum, PET, or Cardboard)',
          reason: 'Mixed composite blends cannot be sorted efficiently by automated optical sorters. Standardizing on mono-materials ensures clean end-of-life reprocessing.'
        };
      }

      if (indexVal < 40) {
        recommendations.push({
          type: 'critical_material_replacement',
          currentMaterial: matName,
          suggestedMaterial: alternative ? alternative.suggested : null,
          reason: alternative
            ? `Critical recyclability barrier (${indexVal}/100): ${alternative.reason} This material severely impacts the product score and triggers a contamination penalty.`
            : `Critical recyclability barrier (${indexVal}/100): This material severely degrades product circularity and triggers a contamination penalty.`
        });
      } else {
        recommendations.push({
          type: 'material_improvement',
          currentMaterial: matName,
          suggestedMaterial: alternative ? alternative.suggested : null,
          reason: alternative
            ? `Low recyclability index (${indexVal}/100): ${alternative.reason}`
            : `Low recyclability index (${indexVal}/100): Consider substituting with a higher-rated circular material (index 70+) to improve the product score.`
        });
      }
    }
  });

  // Rule 3: Mixed-Material Complexity
  if (numMaterials > 1) {
    recommendations.push({
      type: 'mixed_material_complexity',
      currentMaterial: `Multiple Materials (${numMaterials} types present)`,
      suggestedMaterial: 'Monomaterial or Modular Snap-Fit Design',
      reason: `Using multiple distinct materials incurs a -${mixedMaterialPenalty} pts mixed-material penalty and complicates mechanical sorting. Consider consolidating parts into a single material family or designing for tool-free disassembly.`
    });
  }

  // Rule 4: High Contamination
  if (contaminationPenalty > 0) {
    recommendations.push({
      type: 'contamination_reduction',
      currentMaterial: 'Low-index components (< 40 recyclability index)',
      suggestedMaterial: 'Contaminant-Free Alternatives',
      reason: `A contamination penalty of -${contaminationPenalty} pts is currently deducted because low-index components make up a substantial portion of product weight. Phasing out or isolating these components directly restores lost points.`
    });
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
    materialBreakdown,
    recommendations
  };
}

module.exports = {
  calculateRecyclabilityScore
};
