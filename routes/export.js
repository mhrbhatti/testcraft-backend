const express = require('express');
const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const Paper   = require('../models/Paper');

// ── PDF Export ────────────────────────────────────────────────────────────────
router.get('/pdf/:paperId', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.paperId);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    if (!paper.snapshot) return res.status(400).json({ error: 'No snapshot. Generate a new test.' });

    const templatePath = path.join(__dirname, '../templates/paper.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    // Embed logo as base64
    const logoPath = path.join(__dirname, '../logo.jpeg');
    let logoBase64 = '';
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      logoBase64 = 'data:image/jpeg;base64,' + logoData.toString('base64');
    }

    const snapshot = { ...paper.snapshot, logoBase64 };
    html = html.replace('PAPER_DATA_PLACEHOLDER', JSON.stringify(snapshot));

    const htmlPdf = require('html-pdf-node');
    const file    = { content: html };
    const options = {
      format: 'A4',
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      printBackground: true,
    };

    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    console.log('PDF generated:', pdfBuffer.length, 'bytes');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="paper.pdf"');
    res.end(pdfBuffer);

  } catch (err) {
    console.error('PDF ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});
