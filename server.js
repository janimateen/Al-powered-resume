const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' })); // allow large HTML
app.use(bodyParser.urlencoded({ extended: true }));

// Simple health
app.get('/', (req, res) => res.send('Resume Export Server'));

/**
 * POST /export
 * body: { html: '<html>...</html>', pdfOptions?: {format, margin, printBackground} }
 * Returns application/pdf
 */
app.post('/export', async (req, res) => {
  const { html, pdfOptions } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html body' });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set content and wait for fonts/images to load
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const defaultOptions = {
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    };

    const buffer = await page.pdf(Object.assign({}, defaultOptions, pdfOptions || {}));

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (err) {
    console.error('Export error', err);
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
