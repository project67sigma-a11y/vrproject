// Jeddah Tower VR - Simple WebGL Engine
(function() {
    const canvas = document.getElementById('gameCanvas');
    const gl = canvas.getContext('webgl');
    const statusEl = document.getElementById('status');
    
    if (!gl) {
        statusEl.innerHTML = '❌ WebGL Failed!';
        return;
    }
    
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.5, 0.8, 1.0, 1.0);
    
    // Simple shader program
    function makeShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }
    
    const vs = makeShader(gl.VERTEX_SHADER, `
        attribute vec3 pos;
        attribute vec3 col;
        uniform mat4 proj, view, model;
        varying vec3 color;
        void main() {
            gl_Position = proj * view * model * vec4(pos, 1.0);
            color = col;
        }
    `);
    
    const fs = makeShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec3 color;
        void main() {
            gl_FragColor = vec4(color, 1.0);
        }
    `);
    
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(prog));
        statusEl.innerHTML = '❌ Shader Link Failed!';
        return;
    }
    
    gl.useProgram(prog);
    
    // Simple cube
    const cubeVerts = [
        -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1,
        -1,-1,-1, -1, 1,-1,  1, 1,-1,  1,-1,-1,
        -1, 1,-1, -1, 1, 1,  1, 1, 1,  1, 1,-1,
        -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,
         1,-1,-1,  1, 1,-1,  1, 1, 1,  1,-1, 1,
        -1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1
    ];
    
    const cubeCols = [];
    const cols = [[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1]];
    cols.forEach(c => { for(let i=0;i<4;i++) cubeCols.push(...c); });
    
    const cubeIdx = [
        0,1,2, 0,2,3,   4,5,6, 4,6,7,
        8,9,10, 8,10,11, 12,13,14, 12,14,15,
        16,17,18, 16,18,19, 20,21,22, 20,22,23
    ];
    
    const vao = gl.createVertexArray ? gl.createVertexArray() : null;
    if(vao) gl.bindVertexArray(vao);
    
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'pos');
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);
    
    const cb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeCols), gl.STATIC_DRAW);
    const colLoc = gl.getAttribLocation(prog, 'col');
    gl.vertexAttribPointer(colLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colLoc);
    
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIdx), gl.STATIC_DRAW);
    
    const keys = {};
    window.addEventListener('keydown', e => keys[e.key] = 1);
    window.addEventListener('keyup', e => keys[e.key] = 0);
    
    let mx = 0;
    canvas.addEventListener('mousedown', () => {
        canvas.requestPointerLock();
    });
    document.addEventListener('mousemove', e => {
        if (document.pointerLockElement === canvas) {
            mx -= e.movementX * 0.01;
        }
    });
    
    const cam = { x:0, y:2, z:15, ax: 0, ay: 0 };
    
    function mat4() {
        return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    }
    
    function matMul(a, b) {
        const c = mat4();
        for(let i=0;i<4;i++) {
            for(let j=0;j<4;j++) {
                c[i*4+j] = 0;
                for(let k=0;k<4;k++) {
                    c[i*4+j] += a[i*4+k] * b[k*4+j];
                }
            }
        }
        return c;
    }
    
    function translate(m, x, y, z) {
        const t = mat4();
        t[12] = x; t[13] = y; t[14] = z;
        return matMul(m, t);
    }
    
    function scale(m, x, y, z) {
        const s = mat4();
        s[0] = x; s[5] = y; s[10] = z;
        return matMul(m, s);
    }
    
    function perspective(fov, asp, n, f) {
        const t = Math.tan(fov/2);
        const p = mat4();
        p[0] = 1/(t*asp);
        p[5] = 1/t;
        p[10] = -(f+n)/(f-n);
        p[11] = -1;
        p[14] = -2*f*n/(f-n);
        return p;
    }
    
    function lookAt(ex, ey, ez, cx, cy, cz) {
        const f = [ex-cx, ey-cy, ez-cz];
        const len = Math.sqrt(f[0]*f[0] + f[1]*f[1] + f[2]*f[2]);
        f[0]/=len; f[1]/=len; f[2]/=len;
        
        const s = [0*f[2]-1*f[1], 1*f[0]-0*f[2], 0*f[1]-0*f[0]];
        const slen = Math.sqrt(s[0]*s[0] + s[1]*s[1] + s[2]*s[2]);
        s[0]/=slen; s[1]/=slen; s[2]/=slen;
        
        const u = [f[1]*s[2]-f[2]*s[1], f[2]*s[0]-f[0]*s[2], f[0]*s[1]-f[1]*s[0]];
        
        const l = mat4();
        l[0]=s[0]; l[4]=s[1]; l[8]=s[2];
        l[1]=u[0]; l[5]=u[1]; l[9]=u[2];
        l[2]=f[0]; l[6]=f[1]; l[10]=f[2];
        l[12] = -s[0]*ex - s[1]*ey - s[2]*ez;
        l[13] = -u[0]*ex - u[1]*ey - u[2]*ez;
        l[14] = -f[0]*ex - f[1]*ey - f[2]*ez;
        return l;
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if(keys['w']) { cam.x += Math.sin(mx)*0.2; cam.z += Math.cos(mx)*0.2; }
        if(keys['s']) { cam.x -= Math.sin(mx)*0.2; cam.z -= Math.cos(mx)*0.2; }
        if(keys['a']) { cam.x -= Math.cos(mx)*0.2; cam.z += Math.sin(mx)*0.2; }
        if(keys['d']) { cam.x += Math.cos(mx)*0.2; cam.z -= Math.sin(mx)*0.2; }
        if(keys[' ']) cam.y += 0.1;
        if(keys['Shift']) cam.y -= 0.1;
        
        const proj = perspective(Math.PI/3, canvas.width/canvas.height, 0.1, 1000);
        const view = lookAt(cam.x, cam.y, cam.z, cam.x+Math.sin(mx), cam.y, cam.z+Math.cos(mx));
        
        // Draw buildings
        for(let x=-10; x<=10; x+=2) {
            for(let z=-10; z<=10; z+=2) {
                const h = Math.abs(Math.sin(x*0.3)*Math.cos(z*0.3))*8 + 2;
                let m = scale(translate(mat4(), x, h/2, z), 0.9, h, 0.9);
                m = matMul(view, m);
                m = matMul(proj, m);
                
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'proj'), false, proj);
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'view'), false, view);
                gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'model'), false, scale(translate(mat4(), x, h/2, z), 0.9, h, 0.9));
                
                gl.drawElements(gl.TRIANGLES, cubeIdx.length, gl.UNSIGNED_SHORT, 0);
            }
        }
        
        // Tower
        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'model'), false, scale(translate(mat4(), 0, 10, 0), 2, 20, 2));
        gl.drawElements(gl.TRIANGLES, cubeIdx.length, gl.UNSIGNED_SHORT, 0);
        
        statusEl.innerHTML = `📍 (${cam.x.toFixed(1)}, ${cam.y.toFixed(1)}, ${cam.z.toFixed(1)}) 🏢 برج جدة`;
        
        requestAnimationFrame(draw);
    }
    
    statusEl.innerHTML = '✅ Ready!';
    draw();
})();
