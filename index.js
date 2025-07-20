const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }
});

// YouTube Info Endpoint
app.get('/youtube/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "YouTube URL required" });

  try {
    const info = await ytdl.getInfo(url, {
      requestOptions: { headers: { 'User-Agent': 'Mozilla/5.0' } }
    });
    
    res.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      url: info.videoDetails.video_url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Universal Download Endpoint
app.get('/download', async (req, res) => {
  const { url, type } = req.query;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const options = {
        quality: type === 'mp3' ? 'highestaudio' : 'highest',
        filter: type === 'mp3' ? 'audioonly' : 'audioandvideo'
      };
      const filename = type === 'mp3' ? 'audio.mp3' : 'video.mp4';
      res.header('Content-Disposition', `attachment; filename="${filename}"`);
      ytdl(url, options).pipe(res);
    } else {
      res.status(400).json({ error: "Only YouTube supported currently" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PDF Tools (Keep Existing)
app.post('/pdf/merge', upload.array('files'), async (req, res) => {
  try {
    const mergedPdf = await PDFDocument.create();
    for (const file of req.files) {
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
    res.status(500).json({ error: error.message });
  }
});

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    const fakePdf = await PDFDocument.create();
    const page = fakePdf.addPage([600, 800]);
    page.drawText(`Converted from: ${req.file.originalname}`, { x: 50, y: 750 });
    const pdfBytes = await fakePdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(pdfBytes);
    fs.unlinkSync(req.file.path);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
