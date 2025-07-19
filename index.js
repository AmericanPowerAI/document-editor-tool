const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Configure file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// YouTube Endpoints
app.get('/youtube/info', async (req, res) => {
  let { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    const info = await ytdl.getInfo(url);
    res.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails[0].url,
      formats: info.formats.map(f => ({
        itag: f.itag,
        container: f.container,
        qualityLabel: f.qualityLabel,
        audioBitrate: f.audioBitrate,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio
      })),
      url: info.videoDetails.video_url
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video info" });
  }
});

app.get('/youtube/download', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const filename = format === 'mp3' ? 'audio.mp3' : 'video.mp4';
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    ytdl(url, {
      quality: format === 'mp3' ? 'highestaudio' : 'highest',
      filter: format === 'mp3' ? 'audioonly' : 'audioandvideo'
    }).pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Download failed" });
  }
});

// PDF Merger
app.post('/pdf/merge', upload.array('files'), async (req, res) => {
  try {
    const pdfs = req.files;
    if (!pdfs || pdfs.length < 2) throw new Error("Upload 2+ PDFs");

    const mergedPdf = await PDFDocument.create();
    for (const file of pdfs) {
      const pdfBytes = fs.readFileSync(file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
      fs.unlinkSync(file.path);
    }

    const mergedBytes = await mergedPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    res.send(mergedBytes);
  } catch (error) {
    res.status(500).json({ error: "Merge failed: " + error.message });
  }
});

// Document Converter
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) throw new Error("Upload a file");

    const fakePdf = await PDFDocument.create();
    const page = fakePdf.addPage([600, 800]);
    page.drawText(`Converted from: ${file.originalname}`, { x: 50, y: 750 });

    const pdfBytes = await fakePdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="converted.pdf"`);
    res.send(pdfBytes);
    fs.unlinkSync(file.path);
  } catch (error) {
    res.status(500).json({ error: "Conversion failed: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
