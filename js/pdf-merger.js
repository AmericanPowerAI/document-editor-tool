document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const mergeBtn = document.getElementById('mergeBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let files = [];
    
    // Initialize drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.style.borderColor = 'var(--primary-red)';
        uploadArea.style.backgroundColor = 'rgba(227, 25, 55, 0.1)';
    }
    
    function unhighlight() {
        uploadArea.style.borderColor = 'var(--primary-yellow)';
        uploadArea.style.backgroundColor = 'rgba(255, 209, 0, 0.05)';
    }
    
    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        handleFiles(droppedFiles);
    }
    
    // Handle selected files
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // Handle files (from drag & drop or file input)
    function handleFiles(selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (file.type === 'application/pdf') {
                files.push(file);
            }
        }
        updateFileList();
    }
    
    // Update the file list UI
    function updateFileList() {
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            mergeBtn.disabled = true;
            downloadBtn.classList.add('hidden');
            return;
        }
        
        mergeBtn.disabled = false;
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('li');
            fileItem.className = 'file-item';
            fileItem.dataset.index = index;
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-pdf file-icon"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn delete" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            fileList.appendChild(fileItem);
            
            // Add event listener for delete
            const deleteBtn = fileItem.querySelector('.delete');
            deleteBtn.addEventListener('click', () => {
                files.splice(index, 1);
                updateFileList();
            });
        });
    }
    
    // Merge PDFs
    mergeBtn.addEventListener('click', mergePDFs);
    
    async function mergePDFs() {
        if (files.length === 0) return;
        
        mergeBtn.disabled = true;
        mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging...';
        
        try {
            // Create FormData object
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            
            // Call the backend API
            const response = await fetch('https://document-editor-tool.onrender.com/pdf/merge', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Merge failed: ' + (await response.text()));
            }
            
            // Create download link
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            
            downloadBtn.href = downloadUrl;
            downloadBtn.download = 'merged-document.pdf';
            downloadBtn.classList.remove('hidden');
            
            // Show success message
            showApiStatus('pdfApiStatus', 'PDFs merged successfully!', 'success');
            
        } catch (error) {
            console.error('Error merging PDFs:', error);
            showApiStatus('pdfApiStatus', error.message, 'error');
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
        }
    }
});
