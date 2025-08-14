document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const iconSelect = document.getElementById('icon-select');
    const badgeSelect = document.getElementById('badge-select');
    const resolutionSelect = document.getElementById('resolution-select');
    const badgePositionSelect = document.getElementById('badge-position');
    const badgeSizeSlider = document.getElementById('badge-size');
    const badgeSizeValue = document.getElementById('badge-size-value');
    const saveButton = document.getElementById('save-button');
    const previewCanvas = document.getElementById('preview-canvas');
    const currentResolution = document.getElementById('current-resolution');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Canvas context
    const ctx = previewCanvas.getContext('2d');
    
    // Image objects
    let mainIcon = null;
    let badgeIcon = null;
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // Handle dark mode toggle
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    });
    
    // Update badge size display
    badgeSizeSlider.addEventListener('input', function() {
        badgeSizeValue.textContent = this.value + '%';
        updatePreview();
    });
    
    // Update resolution
    resolutionSelect.addEventListener('change', function() {
        const resolution = parseInt(this.value);
        currentResolution.textContent = `${resolution}x${resolution}`;
        previewCanvas.width = resolution;
        previewCanvas.height = resolution;
        updatePreview();
    });
    
    // Handle main icon selection
    iconSelect.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                mainIcon = new Image();
                mainIcon.onload = updatePreview;
                mainIcon.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Handle badge selection
    badgeSelect.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                badgeIcon = new Image();
                badgeIcon.onload = updatePreview;
                badgeIcon.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Update badge position
    badgePositionSelect.addEventListener('change', updatePreview);
    
    // Save the composite icon
    saveButton.addEventListener('click', saveCompositeIcon);
    
    // Initialize canvas
    function initCanvas() {
        const resolution = parseInt(resolutionSelect.value);
        // Keep the canvas size fixed at 256x256 for preview
        previewCanvas.width = 256;
        previewCanvas.height = 256;
        currentResolution.textContent = `${resolution}x${resolution}`;
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
    
    // Update preview canvas
    function updatePreview() {
        initCanvas();
        
        if (mainIcon) {
            const resolution = parseInt(resolutionSelect.value);
            const scale = previewCanvas.width / resolution;
            
            // Draw main icon (centered and scaled to fit canvas)
            drawImageMaintainAspectRatio(mainIcon, 0, 0, previewCanvas.width, previewCanvas.height);
            
            // Draw badge if available
            if (badgeIcon) {
                const badgeSize = parseInt(badgeSizeSlider.value) / 100;
                const badgeWidth = previewCanvas.width * badgeSize;
                const badgeHeight = previewCanvas.height * badgeSize;
                
                let badgeX, badgeY;
                
                // Position the badge according to selection
                switch (badgePositionSelect.value) {
                    case 'top-left':
                        badgeX = 0;
                        badgeY = 0;
                        break;
                    case 'top-right':
                        badgeX = previewCanvas.width - badgeWidth;
                        badgeY = 0;
                        break;
                    case 'bottom-left':
                        badgeX = 0;
                        badgeY = previewCanvas.height - badgeHeight;
                        break;
                    case 'bottom-right':
                        badgeX = previewCanvas.width - badgeWidth;
                        badgeY = previewCanvas.height - badgeHeight;
                        break;
                }
                
                drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight);
            }
        } else {
            // Display placeholder text if no icon selected
            ctx.fillStyle = '#ccc';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Select an icon to preview', previewCanvas.width / 2, previewCanvas.height / 2);
        }
    }
    
    // Save the composite icon
    function saveCompositeIcon() {
        if (!mainIcon) {
            alert('Please select a main icon first.');
            return;
        }
        
        // Create a temporary canvas with the selected resolution
        const resolution = parseInt(resolutionSelect.value);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = resolution;
        tempCanvas.height = resolution;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the main icon
        drawImageMaintainAspectRatio(mainIcon, 0, 0, resolution, resolution, tempCtx);
        
        // Draw the badge if available
        if (badgeIcon) {
            const badgeSize = parseInt(badgeSizeSlider.value) / 100;
            const badgeWidth = resolution * badgeSize;
            const badgeHeight = resolution * badgeSize;
            
            let badgeX, badgeY;
            
            // Position the badge according to selection
            switch (badgePositionSelect.value) {
                case 'top-left':
                    badgeX = 0;
                    badgeY = 0;
                    break;
                case 'top-right':
                    badgeX = resolution - badgeWidth;
                    badgeY = 0;
                    break;
                case 'bottom-left':
                    badgeX = 0;
                    badgeY = resolution - badgeHeight;
                    break;
                case 'bottom-right':
                    badgeX = resolution - badgeWidth;
                    badgeY = resolution - badgeHeight;
                    break;
            }
            
            drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight, tempCtx);
        }
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.download = 'composite-icon.png';
        link.href = tempCanvas.toDataURL('image/png');
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Draw image maintaining aspect ratio
    function drawImageMaintainAspectRatio(img, x, y, width, height, context = ctx) {
        const imgRatio = img.width / img.height;
        const targetRatio = width / height;
        
        let drawWidth = width;
        let drawHeight = height;
        let drawX = x;
        let drawY = y;
        
        if (imgRatio > targetRatio) {
            // Image is wider than target area
            drawHeight = width / imgRatio;
            drawY = y + (height - drawHeight) / 2;
        } else {
            // Image is taller than target area
            drawWidth = height * imgRatio;
            drawX = x + (width - drawWidth) / 2;
        }
        
        context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
    
    // Initialize the canvas on load
    initCanvas();
});