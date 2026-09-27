const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { calculateRecyclabilityScore } = require('../utils/scoringEngine');

// @desc    Generate PDF Sustainability Report for a product
// @route   GET /api/products/:id/pdf
// @access  Public
const generateProductPdfReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const scoreData = calculateRecyclabilityScore(product);

    // Create PDF Document
    const doc = new PDFDocument({ margin: 50 });

    const filename = `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_sustainability_report.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Document Header
    doc
      .fillColor('#1b4d3e')
      .fontSize(22)
      .text('Sustainable Product Lifecycle Report', { align: 'center' })
      .moveDown(0.3);

    doc
      .fillColor('#556b2f')
      .fontSize(10)
      .text(`Generated on: ${new Date().toLocaleDateString()} | Platform: Sustainable Product Design Assistant`, { align: 'center' })
      .moveDown(1.5);

    // Divider Line
    doc.strokeColor('#d8e6d2').lineWidth(1).moveTo(50, doc.y).lineTo(560, doc.y).stroke().moveDown(1);

    // Section 1: Product Overview
    doc.fillColor('#1b4d3e').fontSize(14).text('1. Product Overview').moveDown(0.5);
    doc.fillColor('#2c3e50').fontSize(10);
    doc.text(`Product Name: ${product.name}`);
    doc.text(`Category: ${product.category}`);
    doc.text(`Version: v${product.version || 1}`);
    doc.text(`Lifecycle Stage: ${product.lifecycleStage || 'Design'}`);
    if (product.description) {
      doc.text(`Description: ${product.description}`);
    }
    doc.text(`Total Weight: ${scoreData.totalWeight} kg`);
    doc.text(`Created Date: ${new Date(product.createdAt).toLocaleDateString()}`);
    doc.moveDown(1.5);

    // Section 2: Recyclability Score Summary
    doc.fillColor('#1b4d3e').fontSize(14).text('2. Recyclability Assessment Summary').moveDown(0.5);
    doc.fillColor('#2c3e50').fontSize(10);
    doc.text(`Final Recyclability Score: ${scoreData.finalScore}%`);
    doc.text(`Sustainability Grade: Grade ${scoreData.grade}`);
    doc.text(`Rating: ${scoreData.rating}`);
    doc.moveDown(0.5);

    doc.fillColor('#1b4d3e').fontSize(11).text('Score Breakdown Details:').moveDown(0.3);
    doc.fillColor('#2c3e50').fontSize(10);
    doc.text(`  - Base Weighted Score: ${scoreData.baseWeightedScore}%`);
    doc.text(`  - Mixed Material Penalty: -${scoreData.penalties.mixedMaterialPenalty} pts`);
    doc.text(`  - Contamination Penalty: -${scoreData.penalties.contaminationPenalty} pts`);
    doc.text(`  - Total Deductions: -${scoreData.penalties.totalPenalty} pts`);
    doc.moveDown(1.5);

    // Section 3: Material Composition Analysis
    doc.fillColor('#1b4d3e').fontSize(14).text('3. Material Composition & Contribution Analysis').moveDown(0.5);
    
    if (scoreData.materialBreakdown && scoreData.materialBreakdown.length > 0) {
      scoreData.materialBreakdown.forEach((mat, idx) => {
        doc.fillColor('#2c3e50').fontSize(10).text(
          `  ${idx + 1}. ${mat.name} — Weight: ${mat.weight} kg (${mat.weightPercentage}%) | Index: ${mat.recyclabilityIndex}/100 | Points: +${mat.contribution}`
        );
      });
    } else {
      doc.text('No detailed materials specified.');
    }

    doc.moveDown(1.5);

    // Section 4: Eco-Design Recommendations
    doc.fillColor('#1b4d3e').fontSize(14).text('4. Sustainability Recommendations').moveDown(0.5);
    doc.fillColor('#2c3e50').fontSize(10);

    if (scoreData.finalScore >= 80) {
      doc.text('• Excellent design! Product exhibits high recyclability and minimal material contamination.');
    } else if (scoreData.finalScore >= 50) {
      doc.text('• Moderate recyclability. Consider replacing low-index materials with higher recyclable alternatives like PET or Aluminum to improve the score.');
    } else {
      doc.text('• High penalty deductions detected. Consider simplifying material count and replacing non-recyclable components to reach Grade A/B.');
    }

    // Footer
    doc
      .moveDown(2)
      .fillColor('#90a4ae')
      .fontSize(9)
      .text('Sustainable Product Design Assistant — Confidential Automated Assessment Report', { align: 'center' });

    doc.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error generating PDF report'
    });
  }
};

module.exports = { generateProductPdfReport };
