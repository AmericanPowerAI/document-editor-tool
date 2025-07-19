// index.js
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
const upload = multer({ dest: 'uploads/' });

// Serve static files (including index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- YouTube Downloader Endpoints ---
app.get('/youtube/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("URL required!");

    try {
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
        res.status(500).send("Info fetch failed: " + error.message);
    }
});

app.get('/youtube/download', async (req, res) => {
    const { url, format } = req.query;
    if (!url) return res.status(400).send("URL required!");

    try {
        const filename = format === 'mp3' ? 'audio.mp3' : 'video.mp4';
        res.header('Content-Disposition', `attachment; filename="${filename}"`);
        ytdl(url, { 
            quality: format === 'mp3' ? 'highestaudio' : 'highest',
            filter: format === 'mp3' ? 'audioonly' : 'audioandvideo'
        }).pipe(res);
    } catch (error) {
        res.status(500).send("Download failed: " + error.message);
    }
});

// --- PDF Editor & Merger ---
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
            fs.unlinkSync(file.path); // Clean up
        }

        const mergedBytes = await mergedPdf.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.send(mergedBytes);
    } catch (error) {
        res.status(500).send("Merge failed: " + error.message);
    }
});

// --- Document Converter (Word/Excel → PDF) ---
app.post('/convert', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) throw new Error("Upload a file");

        // Simulate conversion (real conversion requires LibreOffice)
        const fakePdf = await PDFDocument.create();
        const page = fakePdf.addPage([600, 800]);
        page.drawText(`Converted from: ${file.originalname}`, { x: 50, y: 750 });

        const pdfBytes = await fakePdf.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="converted.pdf"`);
        res.send(pdfBytes);
        fs.unlinkSync(file.path); // Clean up
    } catch (error) {
        res.status(500).send("Conversion failed: " + error.message);
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
