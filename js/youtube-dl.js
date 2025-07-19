document.addEventListener('DOMContentLoaded', function() {
    const youtubeUrl = document.getElementById('youtubeUrl');
    const fetchInfoBtn = document.getElementById('fetchInfoBtn');
    const formatOptions = document.getElementById('formatOptions');
    const downloadYoutubeBtn = document.getElementById('downloadYoutubeBtn');
    const downloadYoutubeFileBtn = document.getElementById('downloadYoutubeFileBtn');
    const youtubeInfo = document.getElementById('youtubeInfo');
    const youtubeTitle = document.getElementById('youtubeTitle');
    const youtubeAuthor = document.getElementById('youtubeAuthor');
    const youtubeThumbnail = document.getElementById('youtubeThumbnail');
    
    let videoInfo = null;
    let selectedFormatId = null;
    
    // Fetch video info
    fetchInfoBtn.addEventListener('click', fetchVideoInfo);
    
    async function fetchVideoInfo() {
        const url = youtubeUrl.value.trim();
        if (!url) {
            showApiStatus('youtubeApiStatus', 'Please enter a YouTube URL', 'error');
            return;
        }
        
        const originalText = fetchInfoBtn.innerHTML;
        fetchInfoBtn.disabled = true;
        fetchInfoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
        
        try {
            const response = await fetch(`https://document-editor-tool.onrender.com/youtube/info?url=${encodeURIComponent(url)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch video info: ' + (await response.text()));
            }
            
            videoInfo = await response.json();
            
            youtubeTitle.textContent = videoInfo.title;
            youtubeAuthor.textContent = `By: ${videoInfo.author}`;
            youtubeThumbnail.src = videoInfo.thumbnail;
            youtubeInfo.style.display = 'block';
            
            displayFormatOptions(videoInfo.formats);
            
            showApiStatus('youtubeApiStatus', 'Video info fetched successfully', 'success');
            
        } catch (error) {
            console.error('Error fetching video info:', error);
            showApiStatus('youtubeApiStatus', error.message || 'Invalid YouTube URL', 'error');
            youtubeInfo.style.display = 'none';
            formatOptions.style.display = 'none';
        } finally {
            fetchInfoBtn.disabled = false;
            fetchInfoBtn.innerHTML = originalText;
        }
document.addEventListener('DOMContentLoaded', function() {
    const youtubeUrl = document.getElementById('youtubeUrl');
    const fetchInfoBtn = document.getElementById('fetchInfoBtn');
    const formatOptions = document.getElementById('formatOptions');
    const downloadYoutubeBtn = document.getElementById('downloadYoutubeBtn');
    const downloadYoutubeFileBtn = document.getElementById('downloadYoutubeFileBtn');
    const youtubeInfo = document.getElementById('youtubeInfo');
    const youtubeTitle = document.getElementById('youtubeTitle');
    const youtubeAuthor = document.getElementById('youtubeAuthor');
    const youtubeThumbnail = document.getElementById('youtubeThumbnail');
    
    let videoInfo = null;
    let selectedFormatId = null;
    
    // Fetch video info
    fetchInfoBtn.addEventListener('click', fetchVideoInfo);
    
    async function fetchVideoInfo() {
        const url = youtubeUrl.value.trim();
        if (!url) {
            showApiStatus('youtubeApiStatus', 'Please enter a YouTube URL', 'error');
            return;
        }
        
        try {
            fetchInfoBtn.disabled = true;
            fetchInfoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
            
            // Call the backend API
            const response = await fetch(`https://document-editor-tool.onrender.com/youtube/info?url=${encodeURIComponent(url)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch video info: ' + (await response.text()));
            }
            
            videoInfo = await response.json();
            
            // Display video info
            youtubeTitle.textContent = videoInfo.title;
            youtubeAuthor.textContent = `By: ${videoInfo.author}`;
            youtubeThumbnail.src = videoInfo.thumbnail;
            youtubeInfo.style.display = 'block';
            
            // Display format options
            displayFormatOptions(videoInfo.formats);
            
            showApiStatus('youtubeApiStatus', 'Video info fetched successfully', 'success');
            
        } catch (error) {
            console.error('Error fetching video info:', error);
            showApiStatus('youtubeApiStatus', error.message, 'error');
            youtubeInfo.style.display = 'none';
            formatOptions.style.display = 'none';
        } finally {
            fetchInfoBtn.disabled = false;
            fetchInfoBtn.innerHTML = '<i class="fas fa-search"></i> Fetch Info';
        }
    }
    
    // Display format options
    function displayFormatOptions(formats) {
        formatOptions.innerHTML = '<h3>Available Formats:</h3>';
        
        // Filter formats to show the most common ones
        const videoFormats = formats.filter(f => f.hasVideo && f.hasAudio)
            .sort((a, b) => parseInt(b.qualityLabel) - parseInt(a.qualityLabel));
        
        const audioFormats = formats.filter(f => !f.hasVideo && f.hasAudio)
            .sort((a, b) => parseInt(b.audioBitrate) - parseInt(a.audioBitrate));
        
        // Add video formats
        if (videoFormats.length > 0) {
            const videoGroup = document.createElement('div');
            videoGroup.innerHTML = '<h4>Video Formats:</h4>';
            formatOptions.appendChild(videoGroup);
            
            videoFormats.forEach(format => {
                const formatEl = document.createElement('div');
                formatEl.className = 'format-option';
                formatEl.dataset.formatId = format.itag;
                
                formatEl.innerHTML = `
                    ${format.qualityLabel} - ${format.container}
                `;
                
                formatEl.addEventListener('click', () => {
                    document.querySelectorAll('.format-option').forEach(opt => 
                        opt.classList.remove('selected')
                    );
                    formatEl.classList.add('selected');
                    selectedFormatId = format.itag;
                    downloadYoutubeBtn.disabled = false;
                });
                
                videoGroup.appendChild(formatEl);
            });
        }
        
        // Add audio formats
        if (audioFormats.length > 0) {
            const audioGroup = document.createElement('div');
            audioGroup.innerHTML = '<h4>Audio Formats (MP3):</h4>';
            formatOptions.appendChild(audioGroup);
            
            audioFormats.forEach(format => {
                const formatEl = document.createElement('div');
                formatEl.className = 'format-option';
                formatEl.dataset.formatId = format.itag;
                
                formatEl.innerHTML = `
                    MP3 - ${format.audioBitrate}kbps
                `;
                
                formatEl.addEventListener('click', () => {
                    document.querySelectorAll('.format-option').forEach(opt => 
                        opt.classList.remove('selected')
                    );
                    formatEl.classList.add('selected');
                    selectedFormatId = format.itag;
                    downloadYoutubeBtn.disabled = false;
                });
                
                audioGroup.appendChild(formatEl);
            });
        }
        
        formatOptions.style.display = 'flex';
        downloadYoutubeBtn.disabled = true;
    }
    
    // Download YouTube video
    downloadYoutubeBtn.addEventListener('click', downloadYouTube);
    
    async function downloadYouTube() {
        if (!videoInfo || !selectedFormatId) return;
        
        try {
            downloadYoutubeBtn.disabled = true;
            downloadYoutubeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            
            // Call the backend API
            const response = await fetch(`https://document-editor-tool.onrender.com/youtube/download?url=${encodeURIComponent(videoInfo.url)}&format=${selectedFormatId}`);
            
            if (!response.ok) {
                throw new Error('Download failed: ' + (await response.text()));
            }
            
            // Create download link
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            
            // Determine file extension
            const format = videoInfo.formats.find(f => f.itag === selectedFormatId);
            let extension = format.container || 'mp4';
            if (!format.hasVideo && format.hasAudio) {
                extension = 'mp3';
            }
            
            const videoTitle = videoInfo.title.replace(/[^\w\s]/gi, '');
            downloadYoutubeFileBtn.href = downloadUrl;
            downloadYoutubeFileBtn.download = `${videoTitle}.${extension}`;
            downloadYoutubeFileBtn.classList.remove('hidden');
            
            // Show success message
            showApiStatus('youtubeApiStatus', 'Download ready! Click the download button.', 'success');
            
        } catch (error) {
            console.error('Error downloading video:', error);
            showApiStatus('youtubeApiStatus', error.message, 'error');
        } finally {
            downloadYoutubeBtn.disabled = false;
            downloadYoutubeBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        }
    }
});
