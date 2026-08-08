const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Paper = require('../models/Paper');

// ── PDF Export ────────────────────────────────────────────────────────────────
router.get('/pdf/:paperId', async (req, res) => {
  let browser = null;
  try {
    const paper = await Paper.findById(req.params.paperId);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    if (!paper.snapshot) return res.status(400).json({ error: 'No snapshot. Generate a new test.' });

    const puppeteer = require('puppeteer');
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

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    });

    const page = await browser.newPage();
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      printBackground: true,
    });

    await browser.close();
    browser = null;

    console.log('PDF generated:', pdf.length, 'bytes');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="paper.pdf"`);
    res.end(pdf);

  } catch (err) {
    console.error('PDF ERROR:', err.message);
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

// ── Word Export ───────────────────────────────────────────────────────────────
router.get('/word/:paperId', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.paperId);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    if (!paper.snapshot) return res.status(400).json({ error: 'No snapshot. Generate a new test.' });

    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      AlignmentType, BorderStyle, WidthType, HeadingLevel, ImageRun,
    } = require('docx');

    const snap = paper.snapshot;
    const schema = snap.schema;
    const children = [];

    // ── Logo + Header ──
    const logoPath = path.join(__dirname, '../logo.jpeg');
    const headerCells = [];

    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      headerCells.push(new TableCell({
        children: [new Paragraph({
          children: [new ImageRun({ data: logoData, transformation: { width: 60, height: 60 }, type: 'jpg' })],
          alignment: AlignmentType.LEFT,
        })],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        width: { size: 15, type: WidthType.PERCENTAGE },
      }));
    }

    headerCells.push(
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: snap.academyName || 'Vertex Academy of Sciences', bold: true, size: 32, color: '003399' })], alignment: AlignmentType.LEFT }),
          new Paragraph({ children: [new TextRun({ text: snap.tagline || 'Climb Higher With Vertex', italics: true, size: 18, color: 'C8A800' })], alignment: AlignmentType.LEFT }),
        ],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        width: { size: 55, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: `ACADEMIC SESSION ${snap.session || '2025-2026'}`, bold: true, size: 20 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: schema.name.toUpperCase(), bold: true, size: 24 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `TEST No. ___`, bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
        ],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
    );

    children.push(new Table({
      rows: [new TableRow({ children: headerCells })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.THICK, color: 'C8A800', size: 12 }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    }));

    children.push(new Paragraph({ text: '' }));

    // Quote
    children.push(new Paragraph({
      children: [new TextRun({ text: '"Every question you attempt is a step toward improvement"', italics: true, size: 19 })],
      alignment: AlignmentType.CENTER,
    }));

    children.push(new Paragraph({ text: '' }));

    // Meta info
    const classLabel = snap.classLevel === '13' ? '1st Year' : snap.classLevel === '14' ? '2nd Year' : 'Class ' + snap.classLevel;
    children.push(new Table({
      rows: [
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Subject: ', bold: true }), new TextRun(snap.subject)] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 50, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Time allowed: ', bold: true }), new TextRun('____________')], alignment: AlignmentType.RIGHT })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 50, type: WidthType.PERCENTAGE } }),
        ]}),
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Class: ', bold: true }), new TextRun(classLabel)] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 50, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Marks: ', bold: true }), new TextRun(String(snap.totalMarks))], alignment: AlignmentType.RIGHT })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 50, type: WidthType.PERCENTAGE } }),
        ]}),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));

    // Note (for non-MCQ-only)
    if (snap.testType !== 'mcq-only' && snap.sections.mcqs?.length) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Note: Choose the correct option (A, B, C, or D). Fill the Bubble sheet for answers. The bubble sheet should be properly filled with ink pen/marker. Remover is strictly disallowed and will result in zero marks.', bold: true, underline: {} })],
      }));
    }

    // Student row
    children.push(new Table({
      rows: [new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Student Name: ___________________________', bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 60, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Roll No: ________________', bold: true })], alignment: AlignmentType.RIGHT })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, width: { size: 40, type: WidthType.PERCENTAGE } }),
      ]})],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
    }));

    children.push(new Paragraph({ text: '' }));

    // ── MCQs as table ──
    if (snap.sections?.mcqs?.length) {
      const mcqSchema = schema.sections.find(s => s.type === 'mcq');
      const count = snap.sections.mcqs.length;
      const marksEach = mcqSchema ? mcqSchema.marksEach : 1;

      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Q.1 Attempt All the Questions.', bold: true }),
          new TextRun({ text: `\t(${count} x ${marksEach} = ${count * marksEach} marks)`, bold: true }),
        ],
      }));

      // MCQ table header
      const mcqHeaderRow = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sr', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE }, shading: { fill: 'F0F0F0' } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Question', bold: true })] })], width: { size: 43, type: WidthType.PERCENTAGE }, shading: { fill: 'F0F0F0' } }),
          ...['A','B','C','D'].map(opt => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: opt, bold: true })], alignment: AlignmentType.CENTER })], width: { size: 13, type: WidthType.PERCENTAGE }, shading: { fill: 'F0F0F0' } })),
        ],
      });

      const mcqRows = [mcqHeaderRow];
      snap.sections.mcqs.forEach((q, i) => {
        mcqRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(i+1), bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph(q.questionText)], width: { size: 43, type: WidthType.PERCENTAGE } }),
            ...(q.options || ['','','','']).map(opt => new TableCell({ children: [new Paragraph({ children: [new TextRun(opt || '')], alignment: AlignmentType.CENTER })], width: { size: 13, type: WidthType.PERCENTAGE } })),
          ],
        }));
      });

      children.push(new Table({ rows: mcqRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      children.push(new Paragraph({ text: '' }));
    }

    // ── Short questions ──
    if (snap.sections?.shorts?.length) {
      const shortSchema = schema.sections.find(s => s.type === 'short' && !s.groups);
      const att = shortSchema?.attempt || shortSchema?.count || snap.sections.shorts.length;
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `Q.2 Attempt any ${att} of the following Questions:`, bold: true }),
          new TextRun({ text: `\t(${shortSchema?.marksEach || 2} x ${att} = ${(shortSchema?.marksEach || 2) * att} marks)`, bold: true }),
        ],
      }));
      snap.sections.shorts.forEach((q, i) => {
        children.push(new Paragraph({ text: `(${toRoman(i+1)}) ${q.questionText}` }));
      });
      children.push(new Paragraph({ text: '' }));
    }

    // ── FLP Short Groups ──
    if (snap.sections?.shortGroups?.length) {
      const shortSchema = schema.sections.find(s => s.type === 'short' && s.groups);
      snap.sections.shortGroups.forEach((group, gi) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `Q.${gi+2} Attempt any ${group.attempt} of the following Questions:`, bold: true }),
            new TextRun({ text: `\t(${shortSchema?.marksEach || 2} x ${group.attempt} = ${(shortSchema?.marksEach || 2) * group.attempt} marks)`, bold: true }),
          ],
        }));
        group.questions.forEach((q, qi) => {
          children.push(new Paragraph({ text: `(${toRoman(qi+1)}) ${q.questionText}` }));
        });
        children.push(new Paragraph({ text: '' }));
      });
    }

    // ── Long questions ──
    if (snap.sections?.longs?.length) {
      const longSchema = schema.sections.find(s => s.type === 'long');
      const attemptCount = snap.sections.longsAttempt || snap.sections.longs.length;
      const totalShortGroups = snap.sections.shortGroups ? snap.sections.shortGroups.length : (snap.sections.shorts ? 1 : 0);
      const sectionNum = totalShortGroups + 2;

      children.push(new Paragraph({ children: [new TextRun({ text: 'Section – II', bold: true, underline: {} })], alignment: AlignmentType.CENTER }));
      children.push(new Paragraph({
        children: [
          new TextRun({ text: 'Note: Attempt ALL of the following Questions:', bold: true }),
          new TextRun({ text: `\t(${longSchema?.marksEach || 8} x ${attemptCount} = ${(longSchema?.marksEach || 8) * attemptCount} marks)`, bold: true }),
        ],
      }));
      snap.sections.longs.forEach((q, i) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `Q.${sectionNum+i} `, bold: true }), new TextRun(q.questionText)] }));
      });
    }

    // Footer
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({
      children: [new TextRun({ text: '"Every question you attempt is a step toward improvement"', italics: true })],
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, space: 4 } },
    }));

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    console.log('Word generated:', buffer.length, 'bytes');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="paper.docx"`);
    res.end(buffer);

  } catch (err) {
    console.error('WORD ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function toRoman(n) {
  const map = { i:1, ii:2, iii:3, iv:4, v:5, vi:6, vii:7, viii:8, ix:9, x:10 };
  const rev = Object.entries(map);
  for (const [k,v] of rev) if (v === n) return k;
  return String(n);
}

module.exports = router;
