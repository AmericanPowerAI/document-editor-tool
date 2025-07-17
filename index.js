// index.js
const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();

// Enable CORS (for frontend requests)
app.use(cors());

// YouTube Downloader API
app.get('/youtube/download', async (req, res) => {
    const { url, format } = req.query;
    
    if (!url) return res.status(400).send("YouTube URL is required!");
    
    try {
        if (format === 'mp3') {
            res.header('Content-Disposition', 'attachment; filename="audio.mp3"');
            ytdl(url, { quality: 'highestaudio', filter: 'audioonly' }).pipe(res);
        } else {
            res.header('Content-Disposition', 'attachment; filename="video.mp4"');
            ytdl(url, { quality: 'highest', filter: 'audioandvideo' }).pipe(res);
        }
    } catch (error) {
        res.status(500).send("Failed to download: " + error.message);
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
