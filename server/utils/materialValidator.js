const Material = require('../models/Material');

// Alias mappings for legacy and alternative material names
const MATERIAL_ALIASES = {
  'pet': 'PET',
  'pet (plastic)': 'PET',
  'pet plastic': 'PET',
  'hdpe': 'HDPE',
  'hdpe (plastic)': 'HDPE',
  'hdpe plastic': 'HDPE',
  'ldpe': 'LDPE',
  'ldpe (plastic)': 'LDPE',
  'ldpe plastic': 'LDPE',
  'pp': 'PP',
  'pp (polypropylene)': 'PP',
  'polypropylene': 'PP',
  'pvc': 'PVC',
  'pvc (plastic)': 'PVC',
  'pvc plastic': 'PVC',
  'ps': 'PS',
  'polystyrene': 'PS',
  'abs': 'ABS',
  'aluminium': 'Aluminium',
  'aluminum': 'Aluminium',
  'aluminum metal': 'Aluminium',
  'steel': 'Steel',
  'stainless steel': 'Stainless Steel',
  'copper': 'Copper',
  'glass': 'Glass',
  'glass (clear)': 'Glass',
  'paper': 'Paper',
  'cardboard / paper': 'Paper',
  'recycled cardboard / paper': 'Paper',
  'cardboard': 'Cardboard',
  'wood': 'Wood',
  'wood / bamboo': 'Wood'
};

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// Pre-sorted alias entries by alias key length descending to prefer longest, most specific alias first
const SORTED_ALIAS_ENTRIES = Object.entries(MATERIAL_ALIASES).sort(
  (a, b) => b[0].length - a[0].length
);

// Pre-compiled word/phrase boundary patterns for supported aliases
const COMPILED_ALIAS_RULES = SORTED_ALIAS_ENTRIES.map(([alias, standard]) => {
  const parts = alias.trim().split(/\s+/).map(escapeRegex);
  return {
    alias,
    standard,
    pattern: new RegExp(`(?<![a-z0-9])${parts.join('\\s+')}(?![a-z0-9])`, 'i')
  };
});

/**
 * Resolves a raw material name or legacy string to a standardized Material KB name.
 * 
 * @param {string} rawName - Raw name string from payload
 * @returns {string} Standardized name if known alias, otherwise trimmed original
 */
function resolveMaterialName(rawName) {
  if (typeof rawName !== 'string') return '';
  const trimmed = rawName.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();

  // 1. Direct exact alias match
  if (MATERIAL_ALIASES[lower]) {
    return MATERIAL_ALIASES[lower];
  }

  // 2. Word/phrase-boundary alias match: prefer longest, most specific alias first (e.g. "Stainless Steel" before "Steel")
  for (const { pattern, standard } of COMPILED_ALIAS_RULES) {
    if (pattern.test(lower)) {
      return standard;
    }
  }

  return trimmed;
}

/**
 * Validates product materials array against the MongoDB Material Knowledge Base.
 * - Enforces positive weights (> 0)
 * - Resolves legacy material names to Knowledge Base entries
 * - Verifies that the material exists in the Knowledge Base
 * - Verifies that the material has a valid configured recyclabilityIndex (not null/unavailable, finite number 0-100)
 * - Obtains and applies the authentic recyclabilityIndex from the Knowledge Base (preventing arbitrary client overrides)
 * 
 * @param {Array} materials - Materials array from request body
 * @returns {Promise<{ valid: boolean, materials?: Array, error?: string }>}
 */
async function validateAndNormalizeMaterials(materials) {
  if (!Array.isArray(materials) || materials.length === 0) {
    return {
      valid: false,
      error: 'At least one material must be specified for the product.'
    };
  }

  const normalizedMaterials = [];

  for (let i = 0; i < materials.length; i++) {
    const mat = materials[i];
    const itemNum = i + 1;

    // 1. Reject null, non-object, or array entries
    if (!mat || typeof mat !== 'object' || Array.isArray(mat)) {
      return {
        valid: false,
        error: `Material #${itemNum}: Material entry must be a valid object.`
      };
    }

    // 2. Validate material name as a non-empty string before trimming or alias resolution
    let rawNameCandidate = null;
    if (typeof mat.name === 'string' && mat.name.trim().length > 0) {
      rawNameCandidate = mat.name;
    } else if (typeof mat.material === 'string' && mat.material.trim().length > 0) {
      rawNameCandidate = mat.material;
    } else if (mat.name !== undefined) {
      rawNameCandidate = mat.name;
    } else {
      rawNameCandidate = mat.material;
    }

    if (typeof rawNameCandidate !== 'string' || rawNameCandidate.trim().length === 0) {
      return {
        valid: false,
        error: `Material #${itemNum}: Material name is required and must be a non-empty string.`
      };
    }

    const rawIdentifier = rawNameCandidate.trim();

    // 3. Validate weight
    const weight = Number(mat.weight);
    if (
      mat.weight === undefined ||
      mat.weight === null ||
      mat.weight === '' ||
      typeof mat.weight === 'boolean' ||
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      return {
        valid: false,
        error: `Material #${itemNum} (${rawIdentifier}): Weight must be a positive number greater than 0 kg.`
      };
    }

    // 4. Resolve material alias
    const resolvedName = resolveMaterialName(rawIdentifier);

    // 5. Look up material in Material Knowledge Base
    const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    let materialDoc = await Material.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(resolvedName)}$`, 'i') }
    });

    // Fallback: try raw identifier if resolvedName didn't match
    if (!materialDoc && resolvedName !== rawIdentifier) {
      materialDoc = await Material.findOne({
        name: { $regex: new RegExp(`^${escapeRegex(rawIdentifier)}$`, 'i') }
      });
    }

    if (!materialDoc) {
      return {
        valid: false,
        error: `Material #${itemNum} ('${rawIdentifier}'): Not recognized in the Material Knowledge Base. Please select a valid material.`
      };
    }

    // 6. Validate that the Material Knowledge Base recyclability index is a finite numeric value between 0 and 100, inclusive
    const rIndex = materialDoc.recyclabilityIndex;
    const numIndex = Number(rIndex);

    if (
      rIndex === null ||
      rIndex === undefined ||
      typeof rIndex === 'boolean' ||
      !Number.isFinite(numIndex) ||
      numIndex < 0 ||
      numIndex > 100
    ) {
      return {
        valid: false,
        error: `Material '${materialDoc.name}' does not have a configured recyclability index in the Knowledge Base and cannot be evaluated or saved for scoring.`
      };
    }

    // 7. Construct normalized material object with authentic snapshot index from KB (replaces any client-supplied index)
    normalizedMaterials.push({
      name: materialDoc.name,
      weight: Number(weight.toFixed(4)),
      recyclabilityIndex: numIndex
    });
  }

  return {
    valid: true,
    materials: normalizedMaterials
  };
}

module.exports = {
  MATERIAL_ALIASES,
  resolveMaterialName,
  validateAndNormalizeMaterials
};
