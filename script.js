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

                // Calculate cutout padding in pixels based on canvas size
                const cutoutPadding = Math.round(previewCanvas.width * CUTOUT_PADDING_PERCENT);

                // Create a temporary canvas to draw the badge shape
                const badgeShapeCanvas = document.createElement('canvas');
                badgeShapeCanvas.width = previewCanvas.width;
                badgeShapeCanvas.height = previewCanvas.height;
                const badgeShapeCtx = badgeShapeCanvas.getContext('2d');

                // Draw the badge onto this temporary canvas
                drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight, badgeShapeCtx);

                // Create another temporary canvas for the grown (solidified and sharpened) mask
                const grownMaskCanvas = document.createElement('canvas');
                grownMaskCanvas.width = previewCanvas.width;
                grownMaskCanvas.height = previewCanvas.height;
                const grownMaskCtx = grownMaskCanvas.getContext('2d');

                // Draw the original badge shape onto the mask canvas
                grownMaskCtx.drawImage(badgeShapeCanvas, 0, 0);

                // Apply blur filter to the mask context to expand the shape
                grownMaskCtx.filter = `blur(${cutoutPadding}px)`;

                // Draw the badge shape again to make the blurred area more solid
                grownMaskCtx.drawImage(badgeShapeCanvas, 0, 0);

                // Reset filter
                grownMaskCtx.filter = 'none';

                // Solidify the expanded, blurred area by drawing a solid color where pixels exist
                grownMaskCtx.globalCompositeOperation = 'source-in';
                grownMaskCtx.fillStyle = 'black'; // Any solid color will work here
                grownMaskCtx.fillRect(0, 0, grownMaskCanvas.width, grownMaskCanvas.height);

                // Now, sharpen the edges by thresholding the alpha channel
                const imageData = grownMaskCtx.getImageData(0, 0, grownMaskCanvas.width, grownMaskCanvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // If alpha is greater than 0 (not fully transparent), make it fully opaque
                    if (data[i + 3] > 0) {
                        data[i + 3] = 255;
                    } else {
                        // Otherwise, make it fully transparent
                        data[i + 3] = 0;
                    }
                }
                grownMaskCtx.putImageData(imageData, 0, 0);
                
                // Use the grownMaskCanvas for the cutout
                ctx.globalCompositeOperation = 'destination-out';
                ctx.drawImage(grownMaskCanvas, 0, 0);
        
                // Reset composite operation and draw the badge at normal size
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
        
        // Draw the main icon first
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

            // Calculate cutout padding in pixels based on resolution
            const cutoutPadding = Math.round(resolution * CUTOUT_PADDING_PERCENT);

            // Create a mask canvas for the expanded badge
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = resolution;
            maskCanvas.height = resolution;
            const maskCtx = maskCanvas.getContext('2d');
        
            // Draw the badge at its position and size
            drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight, maskCtx);
        
            // Blur to expand the mask
            maskCtx.filter = `blur(${cutoutPadding}px)`;
            maskCtx.drawImage(maskCanvas, 0, 0);
            maskCtx.filter = 'none';
        
            // Solidify the mask
            maskCtx.globalCompositeOperation = 'source-in';
            maskCtx.fillStyle = 'black';
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
            // Sharpen the mask
            const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i + 3] = data[i + 3] > 0 ? 255 : 0;
            }
            maskCtx.putImageData(imageData, 0, 0);
        
            // Apply the cutout mask to the main icon
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(maskCanvas, 0, 0);
        
            // Draw the badge on top
            tempCtx.globalCompositeOperation = 'source-over';
            drawImageMaintainAspectRatio(badgeIcon, badgeX, badgeY, badgeWidth, badgeHeight, tempCtx);
        }
        
        const link = document.createElement('a');
        link.download = 'composite-icon.png';
        link.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Shared cutout padding percentage (e.g., 8% of canvas size)
    const CUTOUT_PADDING_PERCENT = 0.02;
    
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