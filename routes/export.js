const express = require('express');
const router  = express.Router();
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

    const snap   = paper.snapshot;
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
        borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} },
        width: { size: 15, type: WidthType.PERCENTAGE },
      }));
    }

    headerCells.push(
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: snap.academyName || 'Vertex Academy of Sciences', bold: true, size: 32, color: '003399' })], alignment: AlignmentType.LEFT }),
          new Paragraph({ children: [new TextRun({ text: snap.tagline || 'Climb Higher With Vertex', italics: true, size: 18, color: 'C8A800' })], alignment: AlignmentType.LEFT }),
        ],
        borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} },
        width: { size: 55, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [
          new Paragraph({ children: [new TextRun({ text: `ACADEMIC SESSION ${snap.session || '2025-2026'}`, bold: true, size: 20 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: schema.name.toUpperCase(), bold: true, size: 24 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: 'TEST No. ___', bold: true, size: 22 })], alignment: AlignmentType.CENTER }),
        ],
        borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} },
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
    );

    children.push(new Table({
      rows: [new TableRow({ children: headerCells })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.THICK, color:'C8A800', size:12}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE}, insideH:{style:BorderStyle.NONE}, insideV:{style:BorderStyle.NONE} },
    }));

    children.push(new Paragraph({ text: '' }));

    // Quote
    children.push(new Paragraph({
      children: [new TextRun({ text: '"Every question you attempt is a step toward improvement"', italics: true, size: 19 })],
      alignment: AlignmentType.CENTER,
    }));
    children.push(new Paragraph({ text: '' }));

    // Meta
    const classLabel = snap.classLevel==='13'?'1st Year':snap.classLevel==='14'?'2nd Year':'Class '+snap.classLevel;
    children.push(new Table({
      rows: [
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text:'Subject: ',bold:true }), new TextRun(snap.subject)] })], borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}}, width:{size:50,type:WidthType.PERCENTAGE} }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text:'Time allowed: ',bold:true }), new TextRun('____________')], alignment:AlignmentType.RIGHT })], borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}}, width:{size:50,type:WidthType.PERCENTAGE} }),
        ]}),
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text:'Class: ',bold:true }), new TextRun(classLabel)] })], borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}}, width:{size:50,type:WidthType.PERCENTAGE} }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text:'Marks: ',bold:true }), new TextRun(String(snap.totalMarks))], alignment:AlignmentType.RIGHT })], borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}}, width:{size:50,type:WidthType.PERCENTAGE} }),
        ]}),
      ],
      width: { size:100, type:WidthType.PERCENTAGE },
    }));

    // Note
    if (snap.sections?.mcqs?.length) {
      children.push(new Paragraph({
        children: [new TextRun({ text:'Note: Choose the correct option (A, B, C, or D). Fill the Bubble sheet for answers. The bubble sheet should be properly filled with ink pen/marker. Remover is strictly disallowed and will result in zero marks.', bold:true, underline:{} })],
      }));
    }

    // Student row
    children.push(new Table({
      rows: [new TableRow({ children: [
        new TableCell({ children:[new Paragraph({ children:[new TextRun({ text:'Student Name: ___________________________', bold:true })] })], borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}}, width:{size:60,type:WidthType.PERCENTAGE} }),
        new TableCell({ children:[new Paragraph({ children:[new TextRun({ text:'Roll No: ________________', bold:true })], alignment:AlignmentType.RIGHT })], borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}}, width:{size:40,type:WidthType.PERCENTAGE} }),
      ]})],
      width:{size:100,type:WidthType.PERCENTAGE},
      borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.SINGLE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.NONE}},
    }));
    children.push(new Paragraph({ text:'' }));

    // ── MCQs ──
    if (snap.sections?.mcqs?.length) {
      const mcqSchema = schema.sections.find(s => s.type==='mcq');
      const count     = snap.sections.mcqs.length;
      const mEach     = mcqSchema?.marksEach || 1;
      children.push(new Paragraph({ children:[new TextRun({ text:`Q.1  Attempt All the Questions.\t(${count} x ${mEach} = ${count*mEach} marks)`, bold:true })] }));

      const mcqHeaderRow = new TableRow({ children:[
        new TableCell({ children:[new Paragraph({ children:[new TextRun({text:'Sr',bold:true})], alignment:AlignmentType.CENTER })], width:{size:5,type:WidthType.PERCENTAGE}, shading:{fill:'F0F0F0'} }),
        new TableCell({ children:[new Paragraph({ children:[new TextRun({text:'Question',bold:true})] })], width:{size:43,type:WidthType.PERCENTAGE}, shading:{fill:'F0F0F0'} }),
        ...['A','B','C','D'].map(o => new TableCell({ children:[new Paragraph({ children:[new TextRun({text:o,bold:true})], alignment:AlignmentType.CENTER })], width:{size:13,type:WidthType.PERCENTAGE}, shading:{fill:'F0F0F0'} })),
      ]});

      const mcqRows = [mcqHeaderRow];
      snap.sections.mcqs.forEach((q,i) => {
        mcqRows.push(new TableRow({ children:[
          new TableCell({ children:[new Paragraph({ children:[new TextRun({text:String(i+1),bold:true})], alignment:AlignmentType.CENTER })], width:{size:5,type:WidthType.PERCENTAGE} }),
          new TableCell({ children:[new Paragraph(q.questionText)], width:{size:43,type:WidthType.PERCENTAGE} }),
          ...(q.options||['','','','']).map(opt => new TableCell({ children:[new Paragraph({ children:[new TextRun(opt||'')], alignment:AlignmentType.CENTER })], width:{size:13,type:WidthType.PERCENTAGE} })),
        ]}));
      });
      children.push(new Table({ rows:mcqRows, width:{size:100,type:WidthType.PERCENTAGE} }));
      children.push(new Paragraph({ text:'' }));
    }

    // ── Shorts ──
    function addShorts(shorts, qNum, attempt, mEach) {
      children.push(new Paragraph({ children:[new TextRun({ text:`Q.${qNum}  Attempt any ${attempt} of the following Questions:\t(${mEach} x ${attempt} = ${mEach*attempt} marks)`, bold:true })] }));
      shorts.forEach((q,i) => children.push(new Paragraph({ text:`(${toRoman(i+1)})  ${q.questionText}` })));
      children.push(new Paragraph({ text:'' }));
    }

    if (snap.sections?.shorts?.length) {
      const ss = schema.sections.find(s => s.type==='short' && !s.groups);
      addShorts(snap.sections.shorts, 2, ss?.attempt||ss?.count, ss?.marksEach||2);
    }

    if (snap.sections?.shortGroups?.length) {
      const ss = schema.sections.find(s => s.type==='short' && s.groups);
      snap.sections.shortGroups.forEach((g,gi) => addShorts(g.questions, gi+2, g.attempt, ss?.marksEach||2));
    }

    // ── Longs ──
    if (snap.sections?.longs?.length) {
      const longSchema   = schema.sections.find(s => s.type==='long');
      const attemptCount = snap.sections.longsAttempt || snap.sections.longs.length;
      const grps         = snap.sections.shortGroups ? snap.sections.shortGroups.length : (snap.sections.shorts ? 1 : 0);
      const secNum       = grps + 2;

      children.push(new Paragraph({ children:[new TextRun({text:'Section – II',bold:true,underline:{}})], alignment:AlignmentType.CENTER }));
      children.push(new Paragraph({ children:[new TextRun({ text:`Note: Attempt ALL of the following Questions:\t(${longSchema?.marksEach||8} x ${attemptCount} = ${(longSchema?.marksEach||8)*attemptCount} marks)`, bold:true })] }));
      snap.sections.longs.forEach((q,i) => {
        children.push(new Paragraph({ children:[new TextRun({text:`Q.${secNum+i}  `,bold:true}), new TextRun(q.questionText)] }));
      });
    }

    // Footer
    children.push(new Paragraph({ text:'' }));
    children.push(new Paragraph({
      children:[new TextRun({ text:'"Every question you attempt is a step toward improvement"', italics:true })],
      alignment:AlignmentType.CENTER,
      border:{ top:{style:BorderStyle.SINGLE, size:6, space:4} },
    }));

    const doc = new Document({
      sections: [{
        properties:{ page:{ margin:{top:720,bottom:720,left:900,right:900} } },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    console.log('Word generated:', buffer.length, 'bytes');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="paper.docx"');
    res.end(buffer);

  } catch (err) {
    console.error('WORD ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function toRoman(n) {
  const map = ['i','ii','iii','iv','v','vi','vii','viii','ix','x'];
  return map[n-1] || String(n);
}

module.exports = router;
