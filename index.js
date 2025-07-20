const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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

// Enhanced Document Converter
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("Please upload a file");
    }

    const { format } = req.body;
    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, 'converted', `${req.file.filename}.${format}`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'converted'))) {
      fs.mkdirSync(path.join(__dirname, 'converted'));
    }

    if (format === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      if (req.file.mimetype.startsWith('image/')) {
        const image = await sharp(inputPath).toBuffer();
        const imagePage = pdfDoc.addPage([600, 800]);
        const embeddedImage = await pdfDoc.embedJpg(image);
        imagePage.drawImage(embeddedImage, {
          x: 50,
          y: 50,
          width: 500,
          height: 700,
        });
      } else {
        const page = pdfDoc.addPage([600, 800]);
        page.drawText(`Converted from: ${req.file.originalname}`, { x: 50, y: 750 });
      }
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);
    } else if (format === 'jpg' || format === 'png') {
      await sharp(inputPath)
        .toFormat(format)
        .toFile(outputPath);
    } else {
      throw new Error("Unsupported output format");
    }

    res.download(outputPath, `${path.parse(req.file.originalname).name}.${format}`, (err) => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
      if (err) throw err;
    });
  } catch (error) {
    console.error('Conversion Error:', error);
    res.status(500).json({ error: "Conversion failed", details: error.message });
  }
});

// Enhanced PDF Merger with Page Ordering
app.post('/pdf/merge', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      throw new Error("Please upload at least 2 PDF files");
    }

    const { pageOrder } = req.body;
    const mergedPdf = await PDFDocument.create();
    
    // Process files in specified order
    for (const file of req.files) {
      const pdfBytes = fs.readFileSync(file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Get all page indices
      const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
      
      // Copy pages in specified order or default to original order
      const pagesToCopy = pageOrder && pageOrder[file.originalname] 
        ? pageOrder[file.originalname].map(i => parseInt(i))
        : pageIndices;
      
      const pages = await mergedPdf.copyPages(pdfDoc, pagesToCopy);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
