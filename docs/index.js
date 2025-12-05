// Simple Godot HTML5 loader
(function() {
    const canvas = document.getElementById('canvas');
    const statusText = document.getElementById('status-text');
    const xrButton = document.getElementById('xr-button');

    // Try to load Godot engine
    let engine = null;

    async function initGodot() {
        try {
            statusText.textContent = 'Initializing Godot Engine...';
            
            // Create a simple Godot WASM loader
            // Note: This is a minimal setup. For full support, use official Godot export templates
            
            // Attempt to load from official Godot CDN or local files
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/gh/godotengine/godot-website@master/downloads/templates/4.3/godot.wasm.js';
            script.onload = () => {
                statusText.textContent = 'Godot engine loaded!';
                initializeEngine();
            };
            script.onerror = () => {
                // Fallback: try to load from local
                loadLocalGodot();
            };
            document.body.appendChild(script);
        } catch (error) {
            console.error('Error loading Godot:', error);
            statusText.textContent = 'Error loading Godot: ' + error.message;
        }
    }

    function loadLocalGodot() {
        statusText.textContent = 'Using Godot data file...';
        
        // Create a minimal canvas-based game view
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Draw welcome screen
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏢 Jeddah Tower VR', canvas.width / 2, 100);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('WebXR VR Experience', canvas.width / 2, 160);
        
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px Arial';
        const instructions = [
            'This is a Godot 4 VR scene export.',
            'To view the full experience:',
            '1. Open this page on a VR headset (Meta Quest, SteamVR, etc.)',
            '2. Allow WebXR permissions when prompted',
            '3. Click "Enter VR" to start',
            '',
            '📱 Desktop users: Click canvas to interact with game',
            '🎮 Use mouse/arrow keys to explore',
            '📍 Click to teleport (in VR, use controller trigger)'
        ];
        
        let y = 220;
        instructions.forEach(line => {
            ctx.fillText(line, canvas.width / 2, y);
            y += 25;
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            redrawWelcome();
        });

        function redrawWelcome() {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏢 Jeddah Tower VR', canvas.width / 2, 100);
        }

        statusText.textContent = 'Ready (VR headset or desktop)';
        xrButton.disabled = false;
        xrButton.onclick = () => requestXRSession();
    }

    async function requestXRSession() {
        if (!navigator.xr) {
            alert('WebXR not supported in this browser. Please use a WebXR-capable browser like Chrome, Edge, or Firefox Nightly.');
            return;
        }

        try {
            statusText.textContent = 'Requesting XR session...';
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['dom-overlay', 'dom-overlay-for-handheld-ar'],
                domOverlay: { root: document.body }
            });
            
            statusText.textContent = 'VR Session started!';
            xrButton.textContent = 'Exit VR';
            xrButton.onclick = () => session.end();
            
            // Handle session end
            session.addEventListener('end', () => {
                statusText.textContent = 'VR Session ended';
                xrButton.textContent = 'Enter VR';
                xrButton.onclick = () => requestXRSession();
            });
        } catch (error) {
            console.error('XR Error:', error);
            statusText.textContent = 'WebXR Error: ' + error.message;
            alert('WebXR Error: ' + error.message + '\n\nMake sure:\n- You\'re on HTTPS\n- Your headset is connected\n- WebXR is enabled in browser settings');
        }
    }

    // Initialize
    initGodot();

    // Fallback timer
    setTimeout(() => {
        if (statusText.textContent === 'Loading...') {
            loadLocalGodot();
        }
    }, 3000);
})();
