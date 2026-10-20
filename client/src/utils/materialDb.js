/**
 * Material Reference Database & Recommendation Logic
 * 
 * Provides standard reference recyclability indices for common manufacturing materials
 * and pure calculation functions to generate eco-friendly material alternatives.
 */

export const MATERIAL_DATABASE = [
  { name: 'PET Plastic', category: 'Plastic', recyclabilityIndex: 85, description: 'Highly recyclable thermoplastic polymer used in bottles and packaging.' },
  { name: 'HDPE Plastic', category: 'Plastic', recyclabilityIndex: 80, description: 'High-density polyethylene, widely accepted in municipal recycling.' },
  { name: 'Aluminum', category: 'Metal', recyclabilityIndex: 95, description: 'Infinitely recyclable metal requiring 95% less energy to recycle than primary production.' },
  { name: 'Glass (Clear)', category: 'Glass', recyclabilityIndex: 90, description: 'Fully recyclable without loss of quality or purity.' },
  { name: 'Recycled Cardboard / Paper', category: 'Paper', recyclabilityIndex: 85, description: 'Biodegradable and highly recyclable fiber material.' },
  { name: 'PLA Bioplastic', category: 'Plastic', recyclabilityIndex: 90, description: 'Compostable bio-based plastic derived from renewable plant starch.' },
  { name: 'Stainless Steel', category: 'Metal', recyclabilityIndex: 90, description: 'Durable, highly recyclable metal alloy.' },
  { name: 'Low-Grade Rubber', category: 'Rubber', recyclabilityIndex: 20, description: 'Difficult to recycle thermoset elastomer with low recovery rates.' },
  { name: 'PVC Plastic', category: 'Plastic', recyclabilityIndex: 15, description: 'Polyvinyl chloride containing chlorine, difficult to separate and recycle.' },
  { name: 'Polycarbonate (PC)', category: 'Plastic', recyclabilityIndex: 30, description: 'Hard plastic requiring specialized industrial recycling streams.' }
];

/**
 * Recommends eco-friendly alternative materials for materials with low/moderate recyclability indices.
 * 
 * @param {Array} materials - Current product materials array [{ name, weight, recyclabilityIndex }]
 * @returns {Array} List of recommendation objects
 */
export function generateMaterialRecommendations(materials = []) {
  if (!Array.isArray(materials) || materials.length === 0) return [];

  const recommendations = [];

  materials.forEach((mat) => {
    const currentIndex = Number(mat.recyclabilityIndex) || 0;

    // Find higher-index alternatives from reference dataset
    const alternatives = MATERIAL_DATABASE.filter(
      (ref) => ref.recyclabilityIndex > currentIndex + 10
    ).sort((a, b) => b.recyclabilityIndex - a.recyclabilityIndex);

    if (alternatives.length > 0) {
      // Pick top alternative
      const bestAlt = alternatives[0];
      const indexDiff = bestAlt.recyclabilityIndex - currentIndex;

      recommendations.push({
        currentMaterial: mat.name,
        currentWeight: Number(mat.weight),
        currentIndex: currentIndex,
        alternativeMaterial: bestAlt.name,
        alternativeIndex: bestAlt.recyclabilityIndex,
        indexGain: indexDiff,
        reason: `${bestAlt.name} has a higher recyclability index (${bestAlt.recyclabilityIndex}/100 vs ${currentIndex}/100).`,
        alternativeCategory: bestAlt.category
      });
    }
  });

  return recommendations;
}
