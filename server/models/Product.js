const mongoose = require('mongoose');

// Sub-schema for Materials
const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0 },
    recyclabilityIndex: { type: Number, required: true, min: 0, max: 100 }
  },
  { _id: false }
);

// Sub-schema for Packaging
const packagingSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    weight: { type: Number, min: 0 },
    material: { type: String, trim: true }
  },
  { _id: false }
);

// Sub-schema for Components
const componentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

// Main Product Schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    materials: [materialSchema],
    packaging: packagingSchema,
    components: [componentSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);
