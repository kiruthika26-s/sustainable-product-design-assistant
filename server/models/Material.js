const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Material name is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Material category is required'],
      trim: true
    },
    recyclabilityIndex: {
      type: Number,
      min: [0, 'Recyclability index cannot be less than 0'],
      max: [100, 'Recyclability index cannot exceed 100'],
      default: null
    },
    recyclingMethod: {
      type: String,
      trim: true
    },
    contaminationSensitivity: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Material', materialSchema);
