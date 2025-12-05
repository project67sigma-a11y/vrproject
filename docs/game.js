// 3D WebGL Game Engine - Jeddah Tower VR
(function() {
    const canvas = document.getElementById('gameCanvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    const statusEl = document.getElementById('status');
    const xrBtn = document.getElementById('xrBtn');

    if (!gl) {
        statusEl.innerHTML = '❌ WebGL not supported!';
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.5, 0.8, 1.0, 1.0);

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
        pos: [0, 2, 15],
        angle: 0,
        pitch: 0
    };

    // Shaders
    const vertexShaderSource = `
        precision highp float;
        
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec3 aColor;
        
        uniform mat4 uProjection;
        uniform mat4 uView;
        uniform mat4 uModel;
        
        varying vec3 vNormal;
        varying vec3 vColor;
        varying vec3 vFragPos;
        
        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
            vFragPos = vec3(uModel * vec4(aPosition, 1.0));
            vNormal = aNormal;
            vColor = aColor;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        
        varying vec3 vNormal;
        varying vec3 vColor;
        varying vec3 vFragPos;
        
        uniform vec3 uLightPos;
        
        void main() {
            vec3 norm = normalize(vNormal);
            vec3 lightDir = normalize(uLightPos - vFragPos);
            float diff = max(dot(norm, lightDir), 0.3);
            
            gl_FragColor = vec4(vColor * diff, 1.0);
        }
    `;

    // Compile shader
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader Error:', gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Matrix math
    function matIdentity() {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    function matTranslate(m, x, y, z) {
        const out = m.slice();
        out[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
        out[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
        out[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
        return out;
    }

    function matScale(m, x, y, z) {
        const out = m.slice();
        out[0] *= x;
        out[1] *= x;
        out[2] *= x;
        out[4] *= y;
        out[5] *= y;
        out[6] *= y;
        out[8] *= z;
        out[9] *= z;
        out[10] *= z;
        return out;
    }

    function matPerspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ];
    }

    function matLookAt(eye, center, up) {
        const f = [eye[0] - center[0], eye[1] - center[1], eye[2] - center[2]];
        const len = Math.sqrt(f[0]*f[0] + f[1]*f[1] + f[2]*f[2]);
        f[0] /= len; f[1] /= len; f[2] /= len;

        const s = [up[1]*f[2] - up[2]*f[1], up[2]*f[0] - up[0]*f[2], up[0]*f[1] - up[1]*f[0]];
        const slen = Math.sqrt(s[0]*s[0] + s[1]*s[1] + s[2]*s[2]);
        s[0] /= slen; s[1] /= slen; s[2] /= slen;

        const u = [f[1]*s[2] - f[2]*s[1], f[2]*s[0] - f[0]*s[2], f[0]*s[1] - f[1]*s[0]];

        return [
            s[0], u[0], f[0], 0,
            s[1], u[1], f[1], 0,
            s[2], u[2], f[2], 0,
            -(s[0]*eye[0] + s[1]*eye[1] + s[2]*eye[2]),
            -(u[0]*eye[0] + u[1]*eye[1] + u[2]*eye[2]),
            -(f[0]*eye[0] + f[1]*eye[1] + f[2]*eye[2]),
            1
        ];
    }

    // Create cube mesh
    function createCube(size) {
        const s = size / 2;
        const positions = [
            -s, -s, s,   s, -s, s,   s, s, s,  -s, s, s,  // front
            -s, -s, -s,  -s, s, -s,  s, s, -s,  s, -s, -s,  // back
            -s, s, -s,  -s, s, s,   s, s, s,   s, s, -s,  // top
            -s, -s, -s,  s, -s, -s,  s, -s, s, -s, -s, s,  // bottom
            s, -s, -s,   s, s, -s,   s, s, s,   s, -s, s,  // right
            -s, -s, -s,  -s, -s, s, -s, s, s,  -s, s, -s   // left
        ];

        const normals = [
            0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  // front
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,  // back
            0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  // top
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,  // bottom
            1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  // right
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0   // left
        ];

        const colors = [];
        const faceColors = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]];
        faceColors.forEach(c => { for (let i = 0; i < 4; i++) colors.push(...c); });

        const indices = [
            0,1,2, 0,2,3,   4,5,6, 4,6,7,
            8,9,10, 8,10,11, 12,13,14, 12,14,15,
            16,17,18, 16,18,19, 20,21,22, 20,22,23
        ];

        const vao = gl.createVertexArray ? gl.createVertexArray() : null;
        if (vao) gl.bindVertexArray(vao);

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'aPosition'), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aPosition'));

        const normBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'aNormal'), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aNormal'));

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'aColor'), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aColor'));

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return { vao, indexCount: indices.length };
    }

    const cube = createCube(1);

    // Input
    const keys = {};
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    let mouseDown = false;
    canvas.addEventListener('mousedown', () => {
        mouseDown = true;
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        canvas.requestPointerLock();
    });
    canvas.addEventListener('mouseup', () => mouseDown = false);
    document.addEventListener('mousemove', (e) => {
        if (mouseDown) {
            camera.angle -= e.movementX * 0.005;
            camera.pitch -= e.movementY * 0.005;
            camera.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.pitch));
        }
    });

    // Render loop
    function animate() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Update camera
        const moveSpeed = 0.15;
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
        if (keys[' ']) camera.pos[1] += moveSpeed * 0.5;
        if (keys['shift']) camera.pos[1] -= moveSpeed * 0.5;

        // Camera view
        const target = [
            camera.pos[0] + Math.sin(camera.angle),
            camera.pos[1] + Math.tan(camera.pitch),
            camera.pos[2] + Math.cos(camera.angle)
        ];

        const proj = matPerspective(Math.PI / 3, canvas.width / canvas.height, 0.1, 1000);
        const view = matLookAt(camera.pos, target, [0, 1, 0]);
        const lightPos = [15, 15, 15];

        // Draw buildings
        if (cube.vao) gl.bindVertexArray(cube.vao);

        for (let x = -10; x <= 10; x += 2) {
            for (let z = -10; z <= 10; z += 2) {
                const h = Math.abs(Math.sin(x * 0.3) * Math.cos(z * 0.3)) * 8 + 2;
                
                let model = matIdentity();
                model = matTranslate(model, x, h / 2, z);
                model = matScale(model, 0.9, h, 0.9);

                gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, proj);
                gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, view);
                gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, model);
                gl.uniform3fv(gl.getUniformLocation(program, 'uLightPos'), lightPos);

                gl.drawElements(gl.TRIANGLES, cube.indexCount, gl.UNSIGNED_SHORT, 0);
            }
        }

        // Central tower (Jeddah)
        let tower = matIdentity();
        tower = matTranslate(tower, 0, 10, 0);
        tower = matScale(tower, 2, 20, 2);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, proj);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, view);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, tower);
        gl.uniform3fv(gl.getUniformLocation(program, 'uLightPos'), lightPos);
        gl.drawElements(gl.TRIANGLES, cube.indexCount, gl.UNSIGNED_SHORT, 0);

        // Status
        statusEl.innerHTML = `
            📍 Pos: (${camera.pos[0].toFixed(1)}, ${camera.pos[1].toFixed(1)}, ${camera.pos[2].toFixed(1)})<br>
            🏢 برج جدة - Jeddah Tower<br>
            ⌨️ WASD Move | Mouse Look | Space/Shift Up/Down
        `;

        requestAnimationFrame(animate);
    }

    statusEl.innerHTML = '✅ Engine Ready - WebGL Rendering';
    animate();

    // XR
    xrBtn.onclick = async () => {
        if (!navigator.xr) {
            statusEl.innerHTML = '❌ WebXR not available';
            return;
        }
        try {
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor']
            });
            statusEl.innerHTML = '✅ VR Mode Activated';
            xrBtn.textContent = '📴 Exit VR';
            session.addEventListener('end', () => {
                statusEl.innerHTML = '✅ Back to Desktop';
                xrBtn.textContent = '📱 Enter VR';
            });
        } catch (e) {
            statusEl.innerHTML = '⚠️ ' + e.message;
        }
    };

})();
