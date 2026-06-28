import express from 'express';
import PDFDocument from 'pdfkit';
import { queryOne, query } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { requireValidUuidParam } from '../utils/validation.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const certs = await query('SELECT * FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC', [req.user.id]);
    res.json({
      certificates: certs.map(c => ({
        id: c.id,
        certificateType: c.certificate_type,
        levelCode: c.level_code,
        scorePercent: c.score_percent,
        issuedAt: c.issued_at,
        serialNumber: c.serial_number,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load certificates.' });
  }
});

router.get('/:certId/download', requireAuth, requireValidUuidParam('certId'), async (req, res) => {
  try {
    const cert = await queryOne('SELECT * FROM certificates WHERE id = $1 AND user_id = $2', [req.params.certId, req.user.id]);
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });

    const user = await queryOne('SELECT name FROM users WHERE id = $1', [req.user.id]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sprachstufe-certificate-${cert.serial_number}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.lineWidth(2).strokeColor('#C9A227')
      .rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();
    doc.lineWidth(0.75).strokeColor('#1A1F2E')
      .rect(40, 40, pageWidth - 80, pageHeight - 80).stroke();

    doc.fillColor('#1A1F2E').fontSize(12).font('Helvetica')
      .text('SPRACHSTUFE', 0, 70, { align: 'center', characterSpacing: 4 });

    doc.fontSize(28).font('Helvetica-Bold')
      .text('Certificate of Achievement', 0, 110, { align: 'center' });

    doc.fontSize(13).font('Helvetica').fillColor('#5B6478')
      .text('This is to certify that this is a Sprachstufe platform mock-exam result,', 0, 160, { align: 'center' })
      .text('modeled on the format and not an official credential of any examination body.', 0, 178, { align: 'center' });

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1A1F2E')
      .text(user?.name || 'Learner', 0, 215, { align: 'center' });

    doc.fontSize(14).font('Helvetica').fillColor('#1A1F2E')
      .text(
        `has successfully completed a ${cert.certificate_type}-style mock examination at level ${cert.level_code}`,
        0, 250, { align: 'center' }
      )
      .text(`with a score of ${cert.score_percent}%.`, 0, 270, { align: 'center' });

    doc.fontSize(10).fillColor('#8B8576')
      .text(`Serial number: ${cert.serial_number}`, 0, 320, { align: 'center' })
      .text(`Issued: ${new Date(cert.issued_at).toLocaleDateString()}`, 0, 335, { align: 'center' });

    doc.fontSize(9).fillColor('#9B9685')
      .text(
        'Note: This certificate reflects performance on a Sprachstufe practice test and does not replace or substitute ' +
        'official certification from the Goethe-Institut, telc, TestDaF, or DELF/DALF examination boards. ' +
        'To receive an official, internationally recognized credential, register for a proctored exam through the relevant institution.',
        80, pageHeight - 90, { align: 'center', width: pageWidth - 160 }
      );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate certificate.' });
  }
});

export default router;
