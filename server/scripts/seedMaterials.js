const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Material = require('../models/Material');

/**
 * 15 Initial Standard Materials
 * 
 * Configured prototype values:
 * - PET: 85
 * - HDPE: 80
 * - Glass: 95
 * - Aluminium: 98
 * - Paper: 90
 * - PVC: 30
 * 
 * Unconfigured values (null):
 * LDPE, PP, PS, ABS, Steel, Stainless Steel, Copper, Cardboard, Wood
 * (Do not invent indices; these remain unavailable until configured)
 */
const initialMaterials = [
  {
    name: 'PET',
    category: 'Plastics',
    recyclabilityIndex: 85,
    recyclingMethod: 'Mechanical shredding, washing, optical sorting, and melt extrusion into rPET pellets; chemical depolymerization',
    contaminationSensitivity: 'High (sensitive to PVC, moisture, adhesives, multi-layer barriers, and dark colorants)',
    notes: 'Widely recycled standard thermoplastic for beverage bottles and food containers; established curbside collection infrastructure.'
  },
  {
    name: 'HDPE',
    category: 'Plastics',
    recyclabilityIndex: 80,
    recyclingMethod: 'Continuous mechanical reprocessing, extrusion, and compounding',
    contaminationSensitivity: 'Moderate (tolerant to standard pigments; sensitive to oil residue and silicone liners)',
    notes: 'Extensively collected high-density polyethylene for milk jugs, shampoo bottles, detergent tubs, and utility pipes.'
  },
  {
    name: 'LDPE',
    category: 'Plastics',
    recyclabilityIndex: null,
    recyclingMethod: 'Low-density film washing, agglomeration, and pelletizing',
    contaminationSensitivity: 'High (thin film wraps wrap around rotating trommels and jam mechanical sorting equipment)',
    notes: 'Flexible packaging film, shopping bags, and squeeze tubes; recyclability index configuration pending municipal infrastructure qualification.'
  },
  {
    name: 'PP',
    category: 'Plastics',
    recyclabilityIndex: null,
    recyclingMethod: 'Mechanical sorting, near-infrared (NIR) identification, and high-temp extrusion',
    contaminationSensitivity: 'Moderate (sensitive to food oils, additives, and non-PP closures)',
    notes: 'Bottle caps, yogurt tubs, automotive trim, and living hinges; recyclability index pending baseline configuration.'
  },
  {
    name: 'PVC',
    category: 'Plastics',
    recyclabilityIndex: 30,
    recyclingMethod: 'Specialized mechanical grinding or solvent-based chemical extraction',
    contaminationSensitivity: 'Very High (chlorine releases hydrochloric acid at high thermal processing temperatures and corrodes furnaces)',
    notes: 'Pipes, vinyl siding, cable insulation, blister packs; low circularity and hazardous additives in standard streams.'
  },
  {
    name: 'PS',
    category: 'Plastics',
    recyclabilityIndex: null,
    recyclingMethod: 'Thermal compaction, foam densification, or chemical styrenic depolymerization',
    contaminationSensitivity: 'High (low density foams, grease contamination, and food staining)',
    notes: 'Rigid plastic cutlery, CD jewel cases, expanded polystyrene (EPS) foam packaging; recyclability index pending qualification.'
  },
  {
    name: 'ABS',
    category: 'Plastics',
    recyclabilityIndex: null,
    recyclingMethod: 'Industrial shredding, sink-float density separation, and regrinding',
    contaminationSensitivity: 'Moderate (sensitive to brominated flame retardants, paint, and plating)',
    notes: 'Impact-resistant engineering polymer for electronics housings, keyboard caps, appliances, and automotive components.'
  },
  {
    name: 'Aluminium',
    category: 'Metals',
    recyclabilityIndex: 98,
    recyclingMethod: 'De-coating, melting in reverberatory furnaces, and ingot casting',
    contaminationSensitivity: 'Low to Moderate (sensitive to excessive iron fasteners, slag inclusion, and heavy lacquer coatings)',
    notes: 'Infinitely recyclable non-ferrous metal saving up to 95% energy compared to virgin extraction; ideal circular material.'
  },
  {
    name: 'Steel',
    category: 'Metals',
    recyclabilityIndex: null,
    recyclingMethod: 'Electric arc furnace (EAF) and basic oxygen steelmaking (BOS) melting',
    contaminationSensitivity: 'Low (ferrous magnetic separation allows highly clean automated recovery)',
    notes: 'Cans, structural chassis, automotive stampings, and appliances; recyclability index pending baseline qualification.'
  },
  {
    name: 'Stainless Steel',
    category: 'Metals',
    recyclabilityIndex: null,
    recyclingMethod: 'Electric arc melting with argon oxygen decarburization (AOD) refining',
    contaminationSensitivity: 'Low (corrosion resistant; easily segregated with scrap alloy analyzers)',
    notes: 'High chromium/nickel alloy used in medical equipment, food service, architecture, and long-life durability applications.'
  },
  {
    name: 'Copper',
    category: 'Metals',
    recyclabilityIndex: null,
    recyclingMethod: 'Pyrometallurgical smelting and electrolytic electrorefining into pure copper cathodes',
    contaminationSensitivity: 'Low to Moderate (requires stripping of PVC/crosslinked insulation and solder traces)',
    notes: 'Electrical cabling, motor windings, heat exchangers, plumbing tubes; recyclability index pending qualification.'
  },
  {
    name: 'Glass',
    category: 'Glass',
    recyclabilityIndex: 95,
    recyclingMethod: 'Cullet crushing, optical color sorting (flint, amber, green), and furnace melting',
    contaminationSensitivity: 'Moderate (sensitive to heat-resistant ceramic, Pyrex, stoneware, and lead crystal)',
    notes: '100% infinitely recyclable silica-based material with closed-loop container-to-container circularity.'
  },
  {
    name: 'Paper',
    category: 'Paper & Cardboard',
    recyclabilityIndex: 90,
    recyclingMethod: 'Hydrapulping, chemical de-inking, screening, press dewatering, and papermaking',
    contaminationSensitivity: 'High (sensitive to food grease, water damage, wax barriers, and plastic laminated films)',
    notes: 'Printing paper, newspapers, stationery, kraft mailers; recyclable across 5 to 7 fiber cycles before degradation.'
  },
  {
    name: 'Cardboard',
    category: 'Paper & Cardboard',
    recyclabilityIndex: null,
    recyclingMethod: 'Pulp repulping, centrifugal cleaning, fluting corrugation, and linerboard pressing',
    contaminationSensitivity: 'Moderate to High (sensitive to grease, hot melt adhesives, plastic tape, and wax coatings)',
    notes: 'Corrugated shipping boxes, solid board packaging; recyclability index pending baseline configuration.'
  },
  {
    name: 'Wood',
    category: 'Bio-Based & Wood',
    recyclabilityIndex: null,
    recyclingMethod: 'Mechanical chipping into particleboard fibers, mulch composting, or wood-plastic composites',
    contaminationSensitivity: 'Moderate to High (sensitive to CCA chemical pressure treatment, nails, paints, and formaldehyde resins)',
    notes: 'Timber pallets, structural framing, decorative trim; organic renewable material with cascading lifecycle utility.'
  }
];

/**
 * Idempotently seeds the Material Knowledge Base in MongoDB.
 * Does NOT delete or reset any existing collections, products, or users.
 */
async function seedMaterials() {
  const isDirectRun = require.main === module;
  let shouldCloseConnection = false;

  try {
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set in environment');
      }
      await mongoose.connect(process.env.MONGO_URI);
      shouldCloseConnection = true;
      if (isDirectRun) {
        console.log('Connected to MongoDB Atlas for seeding.');
      }
    }

    const results = {
      total: initialMaterials.length,
      upserted: 0,
      materials: []
    };

    for (const mat of initialMaterials) {
      const updateDoc = {
        $set: {
          category: mat.category,
          recyclingMethod: mat.recyclingMethod,
          contaminationSensitivity: mat.contaminationSensitivity,
          notes: mat.notes
        }
      };

      if (mat.recyclabilityIndex !== null) {
        updateDoc.$set.recyclabilityIndex = mat.recyclabilityIndex;
      } else {
        updateDoc.$setOnInsert = {
          recyclabilityIndex: null
        };
      }

      const doc = await Material.findOneAndUpdate(
        { name: mat.name },
        updateDoc,
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true
        }
      );
      results.upserted += 1;
      results.materials.push({
        name: doc.name,
        category: doc.category,
        recyclabilityIndex: doc.recyclabilityIndex
      });
    }

    if (isDirectRun) {
      console.log(`Successfully seeded/updated ${results.upserted} materials idempotently in Material Knowledge Base.`);
    }

    return results;
  } catch (error) {
    if (isDirectRun) {
      console.error('Error during material seeding:', error.message);
    }
    throw error;
  } finally {
    if (shouldCloseConnection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      if (isDirectRun) {
        console.log('MongoDB connection closed.');
      }
    }
  }
}

if (require.main === module) {
  seedMaterials()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  initialMaterials,
  seedMaterials
};
