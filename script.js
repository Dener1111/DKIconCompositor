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
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const filenameInput = document.getElementById('filename-input');
    
    // Set dark mode as default
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
    localStorage.setItem('darkMode', 'enabled');
    
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

    document.getElementById('icon-select-btn').addEventListener('click', function () {
        document.getElementById('icon-select').click();
    });
    document.getElementById('icon-select').addEventListener('change', function (e) {
        const file = e.target.files[0];
        document.getElementById('icon-file-name').textContent = file ? file.name : '';
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
    document.getElementById('badge-select-btn').addEventListener('click', function () {
        document.getElementById('badge-select').click();
    });
    document.getElementById('badge-select').addEventListener('change', function (e) {
        const file = e.target.files[0];
        document.getElementById('badge-file-name').textContent = file ? file.name : '';
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
        // REMOVE this line:
        // currentResolution.textContent = `${resolution}x${resolution}`;
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    }
    
    // Update preview canvas
    // Shared cutout grow and blur percentages
    const CUTOUT_GROW_PERCENT = 0.04; // 4% grow (adjust as needed)
    const CUTOUT_BLUR_PERCENT = 0.01; // 1% blur (adjust as needed)
    
    function updatePreview() {
        initCanvas();

        if (mainIcon) {
            drawImageMaintainAspectRatio(mainIcon, 0, 0, previewCanvas.width, previewCanvas.height);

            if (badgeIcon) {
                const badgeSize = parseInt(badgeSizeSlider.value) / 100;
                const badgeWidth = previewCanvas.width * badgeSize;
                const badgeHeight = previewCanvas.height * badgeSize;

                let badgeX, badgeY;
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

                // Calculate grow and blur in pixels based on canvas size
                const growPx = Math.round(previewCanvas.width * CUTOUT_GROW_PERCENT);
                const blurPx = Math.round(previewCanvas.width * CUTOUT_BLUR_PERCENT);

                // Draw badge shape to temp canvas
                const badgeShapeCanvas = document.createElement('canvas');
                badgeShapeCanvas.width = previewCanvas.width;
                badgeShapeCanvas.height = previewCanvas.height;
                const badgeShapeCtx = badgeShapeCanvas.getContext('2d');
                drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight, badgeShapeCtx);

                // Create mask canvas for grown and blurred mask
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = previewCanvas.width;
                maskCanvas.height = previewCanvas.height;
                const maskCtx = maskCanvas.getContext('2d');

                // Simulate "grow" by drawing badge shape with small offsets
                for (let dx = -growPx; dx <= growPx; dx += Math.max(1, Math.floor(growPx / 2))) {
                    for (let dy = -growPx; dy <= growPx; dy += Math.max(1, Math.floor(growPx / 2))) {
                        maskCtx.drawImage(badgeShapeCanvas, dx, dy);
                    }
                }

                // Apply a small blur for edge softness
                maskCtx.filter = `blur(${blurPx}px)`;
                maskCtx.drawImage(maskCanvas, 0, 0);
                maskCtx.filter = 'none';

                // Use the blurred mask directly for cutout
                ctx.globalCompositeOperation = 'destination-out';
                ctx.drawImage(maskCanvas, 0, 0);

                // Draw badge on top
                ctx.globalCompositeOperation = 'source-over';
                drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight);
            }
        } else {
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

        const resolution = parseInt(resolutionSelect.value);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = resolution;
        tempCanvas.height = resolution;
        const tempCtx = tempCanvas.getContext('2d');

        drawImageMaintainAspectRatio(mainIcon, 0, 0, resolution, resolution, tempCtx);

        if (badgeIcon) {
            const badgeSize = parseInt(badgeSizeSlider.value) / 100;
            const badgeWidth = resolution * badgeSize;
            const badgeHeight = resolution * badgeSize;

            let badgeX, badgeY;
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

            // Calculate grow and blur in pixels based on resolution
            const growPx = Math.round(resolution * CUTOUT_GROW_PERCENT);
            const blurPx = Math.round(resolution * CUTOUT_BLUR_PERCENT);

            // Draw badge shape to temp canvas
            const badgeShapeCanvas = document.createElement('canvas');
            badgeShapeCanvas.width = resolution;
            badgeShapeCanvas.height = resolution;
            const badgeShapeCtx = badgeShapeCanvas.getContext('2d');
            drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight, badgeShapeCtx);

            // Create mask canvas for grown and blurred mask
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = resolution;
            maskCanvas.height = resolution;
            const maskCtx = maskCanvas.getContext('2d');

            // Simulate "grow" by drawing badge shape with small offsets
            for (let dx = -growPx; dx <= growPx; dx += Math.max(1, Math.floor(growPx / 2))) {
                for (let dy = -growPx; dy <= growPx; dy += Math.max(1, Math.floor(growPx / 2))) {
                    maskCtx.drawImage(badgeShapeCanvas, dx, dy);
                }
            }

            // Apply a small blur for edge softness
            maskCtx.filter = `blur(${blurPx}px)`;
            maskCtx.drawImage(maskCanvas, 0, 0);
            maskCtx.filter = 'none';

            // Use the blurred mask directly for cutout
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(maskCanvas, 0, 0);

            // Draw badge on top
            tempCtx.globalCompositeOperation = 'source-over';
            drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight, tempCtx);
        }

        const filename = filenameInput.value.trim() || 'composite-icon.png';
        const link = document.createElement('a');
        link.download = filename;
        link.href = tempCanvas.toDataURL('image/png');
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
    // Drag & Drop for Main Icon
    const iconBtn = document.getElementById('icon-select-btn');
    const iconInput = document.getElementById('icon-select');
    iconBtn.addEventListener('dragover', function(e) {
        e.preventDefault();
        iconBtn.style.filter = 'brightness(1.2)';
    });
    iconBtn.addEventListener('dragleave', function(e) {
        iconBtn.style.filter = '';
    });
    iconBtn.addEventListener('drop', function(e) {
        e.preventDefault();
        iconBtn.style.filter = '';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            iconInput.files = e.dataTransfer.files;
            // Trigger change event manually
            const event = new Event('change', { bubbles: true });
            iconInput.dispatchEvent(event);
        }
    });
    
    // Drag & Drop for Badge Icon
    const badgeBtn = document.getElementById('badge-select-btn');
    const badgeInput = document.getElementById('badge-select');
    badgeBtn.addEventListener('dragover', function(e) {
        e.preventDefault();
        badgeBtn.style.filter = 'brightness(1.2)';
    });
    badgeBtn.addEventListener('dragleave', function(e) {
        badgeBtn.style.filter = '';
    });
    badgeBtn.addEventListener('drop', function(e) {
        e.preventDefault();
        badgeBtn.style.filter = '';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            badgeInput.files = e.dataTransfer.files;
            // Trigger change event manually
            const event = new Event('change', { bubbles: true });
            badgeInput.dispatchEvent(event);
        }
    });
});
