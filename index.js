const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced YouTube Info Endpoint
app.get('/youtube/info', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  try {
    const options = {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    };

    const info = await ytdl.getInfo(url, options);
    
    res.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats: info.formats.map(format => ({
        itag: format.itag,
        container: format.container,
        qualityLabel: format.qualityLabel || 'N/A',
        audioBitrate: format.audioBitrate || 0,
        hasVideo: format.hasVideo,
        hasAudio: format.hasAudio
      })),
      url: info.videoDetails.video_url
    });

  } catch (error) {
    console.error('YouTube API Error:', error.message);
    res.status(500).json({ 
      error: "Failed to fetch video info",
      details: error.message.includes("This is a private video") 
        ? "Private video (sign in to access)"
        : error.message
    });
  }
});

// YouTube Download Endpoint
app.get('/youtube/download', async (req, res) => {
  const { url, format } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const options = {
      quality: format === 'mp3' ? 'highestaudio' : 'highest',
      filter: format === 'mp3' ? 'audioonly' : 'audioandvideo',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    };

    const filename = format === 'mp3' ? 'audio.mp3' : 'video.mp4';
    
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    ytdl(url, options).pipe(res);

  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({ error: "Download failed", details: error.message });
  }
});

// PDF Merger Endpoint
app.post('/pdf/merge', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      throw new Error("Please upload at least 2 PDF files");
    }

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
    console.error('Merge Error:', error);
    res.status(500).json({ error: "Merge failed", details: error.message });
  }
});

// Document Converter Endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("Please upload a file");
    }

    // Note: This is a placeholder - implement actual conversion logic
    const fakePdf = await PDFDocument.create();
    const page = fakePdf.addPage([600, 800]);
    page.drawText(`Converted from: ${req.file.originalname}`, { x: 50, y: 750 });

    const pdfBytes = await fakePdf.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    res.send(pdfBytes);
    
    fs.unlinkSync(req.file.path);

  } catch (error) {
    console.error('Conversion Error:', error);
    res.status(500).json({ error: "Conversion failed", details: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
