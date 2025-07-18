// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-btn');
    const toolContainers = document.querySelectorAll('.tool-container');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and containers
            tabs.forEach(t => t.classList.remove('active'));
            toolContainers.forEach(c => c.classList.remove('active-tool'));
            
            // Add active class to clicked tab and corresponding container
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active-tool');
        });
    });
    
    // Show hero content immediately
    document.querySelector('.hero-content').classList.add('visible');
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
    
    // Scroll to tools when clicking "Start Now"
    document.getElementById('startMergingBtn').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('main-tools').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Show API status message
    function showApiStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `api-status ${type}`;
        element.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    // Make this function available to other modules
    window.showApiStatus = showApiStatus;
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Make this function available to other modules
    window.formatFileSize = formatFileSize;
});
