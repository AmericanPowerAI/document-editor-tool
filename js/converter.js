document.addEventListener('DOMContentLoaded', function() {
    const converterUploadArea = document.getElementById('converterUploadArea');
    const converterFileInput = document.getElementById('converterFileInput');
    const converterFileList = document.getElementById('converterFileList');
    const convertBtn = document.getElementById('convertBtn');
    const downloadConvertedBtn = document.getElementById('downloadConvertedBtn');
    const conversionOptions = document.querySelectorAll('.conversion-option');
    
    let converterFiles = [];
    let selectedFormat = 'pdf';
    
    // Initialize drag and drop for converter
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        converterUploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        converterUploadArea.addEventListener(eventName, highlightConverter, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        converterUploadArea.addEventListener(eventName, unhighlightConverter, false);
    });
    
    function highlightConverter() {
        converterUploadArea.style.borderColor = 'var(--primary-red)';
        converterUploadArea.style.backgroundColor = 'rgba(227, 25, 55, 0.1)';
    }
    
    function unhighlightConverter() {
        converterUploadArea.style.borderColor = 'var(--primary-yellow)';
        converterUploadArea.style.backgroundColor = 'rgba(255, 209, 0, 0.05)';
    }
    
    // Handle dropped files for converter
    converterUploadArea.addEventListener('drop', handleConverterDrop, false);
    
    function handleConverterDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        handleConverterFiles(droppedFiles);
    }
    
    // Handle selected files for converter
    converterFileInput.addEventListener('change', function() {
        handleConverterFiles(this.files);
    });
    
    // Handle files for converter
    function handleConverterFiles(selectedFiles) {
        converterFiles = []; // Reset files
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            converterFiles.push(file);
        }
        updateConverterFileList();
    }
    
    // Update the converter file list UI
    function updateConverterFileList() {
        converterFileList.innerHTML = '';
        
        if (converterFiles.length === 0) {
            convertBtn.disabled = true;
            downloadConvertedBtn.classList.add('hidden');
            return;
        }
        
        // Only allow one file for conversion in this example
        if (converterFiles.length > 1) {
            showApiStatus('converterApiStatus', 'Please select only one file for conversion', 'error');
            converterFiles = [converterFiles[0]]; // Keep only the first file
        }
        
        converterFiles.forEach((file, index) => {
            const fileItem = document.createElement('li');
            fileItem.className = 'file-item';
            
            // Get file icon based on type
            let fileIcon = 'fa-file';
            if (file.type.includes('pdf')) fileIcon = 'fa-file-pdf';
            else if (file.type.includes('word')) fileIcon = 'fa-file-word';
            else if (file.type.includes('excel')) fileIcon = 'fa-file-excel';
            else if (file.type.includes('powerpoint')) fileIcon = 'fa-file-powerpoint';
            else if (file.type.includes('image')) fileIcon = 'fa-file-image';
            else if (file.type.includes('text')) fileIcon = 'fa-file-alt';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas ${fileIcon} file-icon"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn delete" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            converterFileList.appendChild(fileItem);
            
            // Add event listener for delete
            const deleteBtn = fileItem.querySelector('.delete');
            deleteBtn.addEventListener('click', () => removeConverterFile(index));
        });
        
        // Enable convert button if format is selected
        convertBtn.disabled = selectedFormat === null;
    }
    
    // Remove file from converter list
    function removeConverterFile(index) {
        converterFiles.splice(index, 1);
        updateConverterFileList();
    }
    
    // Select conversion format
    conversionOptions.forEach(option => {
        option.addEventListener('click', () => {
            conversionOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedFormat = option.getAttribute('data-format');
            
            // Enable convert button if files are selected
            convertBtn.disabled = converterFiles.length === 0;
        });
    });
    
    // Convert files
    convertBtn.addEventListener('click', convertFiles);
    
    async function convertFiles() {
        if (converterFiles.length === 0 || selectedFormat === null) return;
        
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        
        try {
            const file = converterFiles[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('format', selectedFormat);
            
            // Call the backend API
            const response = await fetch('https://document-editor-tool.onrender.com/convert', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Conversion failed: ' + (await response.text()));
            }
            
            // Create download link
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            
            downloadConvertedBtn.href = downloadUrl;
            downloadConvertedBtn.download = `${file.name.split('.')[0]}.${selectedFormat}`;
            downloadConvertedBtn.classList.remove('hidden');
            
            // Show success message
            showApiStatus('converterApiStatus', 'File converted successfully!', 'success');
            
        } catch (error) {
            console.error('Error converting file:', error);
            showApiStatus('converterApiStatus', error.message, 'error');
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert Files';
        }
    }
});
