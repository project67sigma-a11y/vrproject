// Simple 3D Game Engine for Jeddah Tower VR
(function() {
    const canvas = document.getElementById('gameCanvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const statusEl = document.getElementById('status');
    const xrBtn = document.getElementById('xrBtn');

    if (!gl) {
        statusEl.innerHTML = '❌ WebGL not supported!';
        return;
    }

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Camera
    const camera = {
        pos: [0, 1.6, 3],
        angle: 0,
        pitch: 0
    };

    // Simple 3D rendering with WebGL
    const vertexShader = `
        attribute vec3 position;
        attribute vec3 color;
        uniform mat4 projection;
        uniform mat4 view;
        uniform mat4 model;
        varying vec3 vColor;
        
        void main() {
            gl_Position = projection * view * model * vec4(position, 1.0);
            vColor = color;
        }
    `;

    const fragmentShader = `
        precision mediump float;
        varying vec3 vColor;
        
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;

    // Compile shader
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vs = compileShader(vertexShader, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShader, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Matrix utilities
    function identity() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    function translate(m, x, y, z) {
        return [
            m[0], m[1], m[2], m[3],
            m[4], m[5], m[6], m[7],
            m[8], m[9], m[10], m[11],
            m[0]*x + m[4]*y + m[8]*z + m[12], 
            m[1]*x + m[5]*y + m[9]*z + m[13], 
            m[2]*x + m[6]*y + m[10]*z + m[14], 
            m[3]*x + m[7]*y + m[11]*z + m[15]
        ];
    }

    function perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ];
    }

    // Create cube
    function createCube(size = 1) {
        const s = size / 2;
        const vertices = [
            // Front
            -s, -s, s,  s, -s, s,  s, s, s,  -s, s, s,
            // Back
            -s, -s, -s, -s, s, -s,  s, s, -s,  s, -s, -s,
            // Top
            -s, s, -s, -s, s, s,  s, s, s,  s, s, -s,
            // Bottom
            -s, -s, -s,  s, -s, -s,  s, -s, s, -s, -s, s,
            // Right
            s, -s, -s,  s, s, -s,  s, s, s,  s, -s, s,
            // Left
            -s, -s, -s, -s, -s, s, -s, s, s, -s, s, -s
        ];

        const colors = [];
        const faces = [
            [1, 0, 0],    // Red
            [0, 1, 0],    // Green
            [0, 0, 1],    // Blue
            [1, 1, 0],    // Yellow
            [1, 0, 1],    // Magenta
            [0, 1, 1]     // Cyan
        ];

        faces.forEach(color => {
            for (let i = 0; i < 4; i++) {
                colors.push(...color);
            }
        });

        const indices = [
            0,1,2, 0,2,3,      // Front
            4,5,6, 4,6,7,      // Back
            8,9,10, 8,10,11,   // Top
            12,13,14, 12,14,15,// Bottom
            16,17,18, 16,18,19,// Right
            20,21,22, 20,22,23 // Left
        ];

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

        const cbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        const colorLoc = gl.getAttribLocation(program, 'color');
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);

        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return { vao, indexCount: indices.length };
    }

    const cube = createCube(2);

    // Input handling
    const keys = {};
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    let mouseDown = false;
    canvas.addEventListener('mousedown', () => mouseDown = true);
    canvas.addEventListener('mouseup', () => mouseDown = false);
    canvas.addEventListener('mousemove', (e) => {
        if (mouseDown) {
            camera.angle += e.movementX * 0.01;
            camera.pitch += e.movementY * 0.01;
            camera.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.pitch));
        }
    });

    canvas.addEventListener('click', () => {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    });

    // Animation loop
    function animate() {
        // Clear
        gl.clearColor(0.5, 0.8, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        // Update camera
        const moveSpeed = 0.05;
        if (keys['w']) {
            camera.pos[0] += Math.sin(camera.angle) * moveSpeed;
            camera.pos[2] += Math.cos(camera.angle) * moveSpeed;
        }
        if (keys['s']) {
            camera.pos[0] -= Math.sin(camera.angle) * moveSpeed;
            camera.pos[2] -= Math.cos(camera.angle) * moveSpeed;
        }
        if (keys['a']) {
            camera.pos[0] -= Math.cos(camera.angle) * moveSpeed;
            camera.pos[2] += Math.sin(camera.angle) * moveSpeed;
        }
        if (keys['d']) {
            camera.pos[0] += Math.cos(camera.angle) * moveSpeed;
            camera.pos[2] -= Math.sin(camera.angle) * moveSpeed;
        }

        // Matrices
        const proj = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 1000);
        const view = identity();
        view[12] = -camera.pos[0];
        view[13] = -camera.pos[1];
        view[14] = -camera.pos[2];

        // Rotate view
        const cosY = Math.cos(-camera.angle);
        const sinY = Math.sin(-camera.angle);
        const cosX = Math.cos(-camera.pitch);
        const sinX = Math.sin(-camera.pitch);

        // Simple rotation matrix
        const rx = [
            1, 0, 0, 0,
            0, cosX, sinX, 0,
            0, -sinX, cosX, 0,
            0, 0, 0, 1
        ];
        const ry = [
            cosY, 0, -sinY, 0,
            0, 1, 0, 0,
            sinY, 0, cosY, 0,
            0, 0, 0, 1
        ];

        // Draw towers
        for (let x = -5; x <= 5; x += 2.5) {
            for (let z = -5; z <= 5; z += 2.5) {
                let model = identity();
                model[12] = x;
                model[13] = x === 0 && z === 0 ? 5 : 1;
                model[14] = z;

                gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projection'), false, proj);
                gl.uniformMatrix4fv(gl.getUniformLocation(program, 'view'), false, view);
                gl.uniformMatrix4fv(gl.getUniformLocation(program, 'model'), false, model);

                gl.bindVertexArray(cube.vao);
                gl.drawElements(gl.TRIANGLES, cube.indexCount, gl.UNSIGNED_SHORT, 0);
            }
        }

        statusEl.innerHTML = `
            Position: ${camera.pos[0].toFixed(1)}, ${camera.pos[1].toFixed(1)}, ${camera.pos[2].toFixed(1)}<br>
            ✅ WebGL Rendering<br>
            💡 Use WASD to move, drag mouse to look
        `;

        requestAnimationFrame(animate);
    }

    // Start
    statusEl.innerHTML = '✅ Engine ready';
    animate();

    // XR Button
    xrBtn.onclick = async () => {
        if (!navigator.xr) {
            statusEl.innerHTML = '❌ WebXR not supported (Chrome, Edge, Firefox Nightly)';
            return;
        }
        try {
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor']
            });
            statusEl.innerHTML = '✅ VR Session Active';
            xrBtn.textContent = '📴 Exit VR';
            xrBtn.onclick = () => session.end();
            session.addEventListener('end', () => {
                statusEl.innerHTML = '✅ Back to desktop';
                xrBtn.textContent = '📱 Enter VR';
                xrBtn.onclick = arguments.callee;
            });
        } catch (e) {
            statusEl.innerHTML = '⚠️ WebXR Error: ' + e.message;
        }
    };

})();
