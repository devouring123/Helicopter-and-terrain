"use strict";

import * as mat4 from "./gl-matrix/mat4.js"
import * as vec4 from "./gl-matrix/vec4.js"
import * as vec3 from "./gl-matrix/vec3.js"
import {toRadian} from "./gl-matrix/common.js"

function main() {
    let canvas = document.getElementById('webgl');
    let gl = canvas.getContext('webgl2');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.1, 0.1, 0.1, 1);

    let M = mat4.create();
    mat4.translate(M, M, ([0, 0, 1]));
    let V = mat4.create();
    let azimuth = 45;
    let elevation = 30;

    let rotateAngle = 0;
    let height = 0;
    let forward = 0;
    let size = 0.1
    let fov = 50;
    let P = mat4.create();

    let axes = new Axes(gl);
    let terrain = new Terrain(gl);
    let chopper = new Chopper(gl, size);
    let propeller = new Propeller(gl, size);

    let delayValue = 200;
    let delay = 0;
    // light 관련
    const numLights = 20;
    let numLightsEnabled = 0;
    let lights = [];
    lights[0] = new Light(gl,
        [1.0,2.0,3.0,0.0],
        [0.5,0.5,0.5,1.0],
        [0.5,0.5,0.5,1.0],
        [0.5,0.5,0.5,1.0],
        [1.0,2.0,3.0,1.0],
        true);
    for(let i = 1; i < numLights; i++){
        lights[i] = new Light( gl,
            [0.0,0.0,0.0,1.0],
            [0.3,0.3,0.3,1.0],
            [0.3,0.3,0.3,1.0],
            [0.8,0.8,0.8,1.0],
            [0.0,0.0,0.0,0.0],
            false
        );
    }
    let material = new Material(
        [0.0215,0.1745,0.0215],
        [0.07568,0.61424,0.07568],
        [0.633,0.727811,0.633],
        0.6);
    let chopperMaterial = new Material(
        [0.1745,0.01175,0.01175],
        [0.61424,0.04136,0.04136],
        [0.727811,0.626959,0.626959],
        0.6);
    let propellerMaterial = new Material(
        [0.25,0.25,0.25],
        [0.4,0.4,0.4],
        [0.774597,0.774597,0.774597],
        0.6);
    document.getElementsByTagName("BODY")[0].onkeydown = function (ev) {
        switch (ev.key) {
            case 'ArrowUp':
                if (ev.getModifierState("Shift")) elevation += 5;
                else forward = -0.05;
                break;
            case 'ArrowDown':
                if (ev.getModifierState("Shift")) elevation += -5;
                else forward = 0.05;
                break;
            case 'ArrowLeft':
                if (ev.getModifierState("Shift")) azimuth += 5;
                else rotateAngle = -5;
                break;
            case 'ArrowRight':
                if (ev.getModifierState("Shift")) azimuth += -5;
                else rotateAngle = 5;
                break;
            case 'a':
            case 'A':
                height = 0.05;
                break;
            case 'z':
            case 'Z':
                height = -0.05;
                break;
            case ' ':
                if (delay === 0) {
                    delay = delayValue;
                    lights[(numLightsEnabled) % 19 + 1].turn_on(true);
                    lights[(numLightsEnabled++) % 19 + 1].setM(M);
                }
                break;
            case '=':
            case '+':
                fov = Math.max(fov - 5, 5);
                break;
            case '-':
            case '_':
                fov = Math.min(fov + 5, 120);
                break;
        }

        document.getElementsByTagName("BODY")[0].onkeyup = function (ev) {
            switch (ev.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    forward = 0;
                    break;
                case 'ArrowLeft':
                case 'ArrowRight':
                    rotateAngle = 0;
                    break;
                case 'a':
                case 'A':
                case 'z':
                case 'Z':
                    height = 0;
                    break;
            }
        }

        let keystroke = "";
        if (ev.getModifierState("Shift")) keystroke += "Shift + ";
        if (ev.key === ' ') keystroke += 'SpaceBar';
        else keystroke += ev.key;
        document.getElementById("output").innerHTML = keystroke;
    };

    let t_start = Date.now();
    let t_last = Date.now();
    const ANGLE_STEP_MESH = 60.0;

    let tick = function () {
        let now = Date.now();
        let elapsed = now - t_start;
        let tmp = now - t_last;
        t_last = now;
        if (delay > 0)
            delay -= tmp;
        else
            delay = 0;

        mat4.perspective(P, toRadian(fov), 1, 1, 100);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        transform_view(V, azimuth, elevation);
        axes.render(gl, V, P);
        terrain.render(gl, V, P, lights, material);

        mat4.translate(M, M, ([0, 0, height]));
        mat4.rotate(M, M, toRadian(-(rotateAngle) % 360.0), [0, 0, 1]);
        mat4.translate(M, M, ([0, forward, 0]));

        chopper.render(gl, M, V, P, lights, chopperMaterial);

        lights[0].render(gl, V, P, tmp)
        for(let i = 1; i < lights.length; i++){
            if(lights[i].enabled) {
                // console.log(lights[i].enabledTime);
                let dy = 0.008; // dy/dt = v;
                let dz = 0.0008 * 0.0008 * (Light.leftTime - lights[i].enabledTime) ;    // dz/dt = -gt;
                mat4.translate(lights[i].M, lights[i].M, [0, -dy, -dz * tmp])
                lights[i].render(gl, V, P, tmp);
            }
        }
        let SpinM = mat4.create();
        mat4.rotate(SpinM, M, toRadian(-((ANGLE_STEP_MESH * elapsed) / 100.0) % 360.0), [0, 0, 1]);
        propeller.render(gl, SpinM, V, P, lights, propellerMaterial);
        requestAnimationFrame(tick, canvas); // Request that the browser calls tick
    };
    tick();
}


function transform_view(V, azimuth, elevation) {
    mat4.fromTranslation(V, [0, 0, -6]);
    mat4.rotate(V, V, toRadian(elevation), [1, 0, 0]);
    mat4.rotate(V, V, -toRadian(azimuth), [0, 1, 0]);
    mat4.rotate(V, V, -toRadian(90), [0, 1, 0]);
    mat4.rotate(V, V, -toRadian(90), [1, 0, 0]);
}

class Axes {
    constructor(gl, length = 2) {
        this.MVP = mat4.create();
        if (!Axes.h_prog)
            Axes.h_prog = init_shaders(gl, Axes.src_shader_vert, Axes.src_shader_frag);
        this.init_vbo(gl, length);
    }

    init_vbo(gl, l) {
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const vertices = new Float32Array([
            0, 0, 0, 1, 0, 0,
            l, 0, 0, 1, 0, 0,
            0, 0, 0, 0, 1, 0,
            0, l, 0, 0, 1, 0,
            0, 0, 0, 0, 0, 1,
            0, 0, l, 0, 0, 1,
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const SZ = vertices.BYTES_PER_ELEMENT;

        gl.vertexAttribPointer(Axes.loc_aPosition, 3, gl.FLOAT, false, SZ * 6, 0);
        gl.enableVertexAttribArray(Axes.loc_aPosition);

        gl.vertexAttribPointer(Axes.loc_aColor, 3, gl.FLOAT, false, SZ * 6, SZ * 3);
        gl.enableVertexAttribArray(Axes.loc_aColor);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    set_uniform_matrices(gl, h_prog, V, P) {
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, V);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP);
    }

    render(gl, V, P) {
        gl.useProgram(Axes.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Axes.h_prog, V, P);
        gl.drawArrays(gl.LINES, 0, 6);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

Axes.loc_aPosition = 14;
Axes.loc_aColor = 15;
Axes.src_shader_vert =
    `#version 300 es
layout(location=${Axes.loc_aPosition}) in vec4 aPosition;
layout(location=${Axes.loc_aColor}) in vec4 aColor;
uniform mat4 MVP;
out vec4 vColor;
void main()
{
    gl_Position = MVP * aPosition;
    vColor = aColor;
}
`;
Axes.src_shader_frag =
    `#version 300 es
#ifdef GL_ES
precision mediump float;
#endif
in vec4 vColor;
out vec4 fColor;
void main()
{
    fColor = vColor;
}
`;

Axes.shader = null;

function init_shader(gl, type, src) {
    let h_shader = gl.createShader(type);
    if (!h_shader) return null;

    gl.shaderSource(h_shader, src);

    gl.compileShader(h_shader);

    let status = gl.getShaderParameter(h_shader, gl.COMPILE_STATUS);
    if (!status) {
        let err = gl.getShaderInfoLog(h_shader);
        console.log(`Failed to compile shader (${err})`);
        gl.deleteShader(h_shader);
        return null;
    }
    return h_shader;
}
function init_shaders(gl, src_vert, src_frag) {

    let h_vert = init_shader(gl, gl.VERTEX_SHADER, src_vert);
    let h_frag = init_shader(gl, gl.FRAGMENT_SHADER, src_frag);
    // if (!h_vert || !h_frag) return null;
    if (!h_frag) {
        console.log("fragment");
        return null;
    }
    if (!h_vert) {
        console.log("vertex");
        return null;
    }

    let h_prog = gl.createProgram();
    if (!h_prog) return null;

    gl.attachShader(h_prog, h_vert);
    gl.attachShader(h_prog, h_frag);

    gl.linkProgram(h_prog);

    let status = gl.getProgramParameter(h_prog, gl.LINK_STATUS);
    if (!status) {
        let err = gl.getProgramInfoLog(h_prog);
        console.log(`Failed to link program (${err})`);
        gl.deleteProgram(h_prog);
        gl.deleteShader(h_vert);
        gl.deleteShader(h_frag);
        return null;
    }
    return h_prog;
}

class Terrain {
    divisor = 200;
    constructor(gl) {
        this.MVP = mat4.create();
        this.MV = mat4.create();
        this.M = mat4.create();
        this.N = mat4.create();
        if (!Terrain.h_prog)
            Terrain.h_prog = init_shaders(gl, Terrain.src_shader_vert, Terrain.src_shader_frag);
        this.init_vbo(gl);
        this.initTextures(gl)
    }

    init_vbo(gl) {
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const texCoord = [];
        for (let y = 0; y <= this.divisor; y++) {
            for (let x = 0; x <= this.divisor; x++) {
                texCoord.push(x / this.divisor, y / this.divisor);
            }
        }

        const indices = [];
        const yLine = this.divisor + 1;
        for (let y = 0; y < this.divisor; y++) {
            let offset = y * (this.divisor + 1);
            for (let x = 0; x < this.divisor; x++) {
                indices.push(offset + x, offset + x + 1, offset + yLine + x + 1);
                indices.push(offset + x, offset + yLine + x + 1, offset + yLine + x);
            }
        }

        this.n = indices.length;
        // indices.forEach(element => console.log(element));

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        gl.vertexAttribPointer(Terrain.loc_aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(Terrain.loc_aTexCoord);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    initTextures(gl) {
        let texture = gl.createTexture();   // Create a texture object
        if (!texture) {
            console.log('Failed to create the texture object');
            return false;
        }
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        let image = new Image();  // Create the image object
        if (!image) {
            console.log('Failed to create the image object');
            return false;
        }

        image.addEventListener('load', function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        });
        // Tell the browser to load an image
        image.src = './yorkville.jpg';
        return true;
    }

    set_uniform_lights(gl, h_prog, lights, V) {
        let i = 0;
        let v = vec4.create();
        for(let name in lights)
        {
            let light = lights[name];
            mat4.copy(this.MV, V);
            mat4.multiply(this.MV, this.MV, light.M);
            vec4.transformMat4(v, light.position, this.MV);
            gl.uniform4fv(gl.getUniformLocation(h_prog,`light[${i}].position`), v);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].ambient`), light.ambient);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].diffuse`), light.diffusive);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].specular`), light.specular);
            gl.uniform1i(gl.getUniformLocation(h_prog,`light[${i}].enabled`), light.enabled);
            i++;
        }
    }
    set_uniform_material(gl, h_prog, mat) {
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.ambient"), mat.ambient);
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.diffuse"), mat.diffusive);
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.specular"), mat.specular);
        gl.uniform1f(gl.getUniformLocation(h_prog,"material.shininess"), mat.shininess*128.0);
    }

    set_uniform_matrices(gl, h_prog, V, P) {
        mat4.copy(this.MV, V);
        mat4.multiply(this.MV, this.MV, this.M);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MV"), false, this.MV);
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, this.MV);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP);
        mat4.copy(this.MVP, V);
        mat4.multiply(this.MVP, this.MVP, this.M);
        mat4.invert(this.N, this.MV);
        mat4.transpose(this.N, this.N);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "matNormal"), false, this.N);
    }

    render(gl, V, P, lights, material) {
        gl.useProgram(Terrain.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Terrain.h_prog, V, P);
        if(lights) this.set_uniform_lights(gl, Terrain.h_prog, lights, V);
        if(material) this.set_uniform_material(gl, Terrain.h_prog, material);
        gl.drawElements(gl.TRIANGLES, this.n, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

Terrain.shader = null;

Terrain.loc_aTexCoord = 0;

Terrain.src_shader_vert =
`#version 300 es
layout(location=${Terrain.loc_aTexCoord}) in vec2 aTexCoord;
uniform sampler2D uSampler;
out vec2 vTexCoord;

uniform mat4 MVP;
uniform mat4 MV;
uniform mat4 matNormal;

out vec3 vNormal;
out vec4 vPosEye;

void main() {
    float scale = 1.5;
    float height = texture(uSampler, aTexCoord).r;
    float forwardX = texture(uSampler, vec2(aTexCoord.x + 0.005, aTexCoord.y)).r;
    float backwardX = texture(uSampler, vec2(aTexCoord.x - 0.005, aTexCoord.y)).r;
    float centralX = scale * (forwardX - backwardX) * 100.0;

    float forwardY = texture(uSampler, vec2(aTexCoord.x, aTexCoord.y + 0.005)).r;
    float backwardY = texture(uSampler, vec2(aTexCoord.x, aTexCoord.y - 0.005)).r;
    float centralY = scale * (forwardY - backwardY) * 100.0;

    float size = 4.0;
    gl_Position = MVP * vec4(float(size * (aTexCoord.x - 0.5)), float(size * (aTexCoord.y - 0.5)), height * scale - 0.75 , 1.0);
    vTexCoord = aTexCoord;
    
    vPosEye = MV * vec4(float(size * (aTexCoord.x - 0.5)), float(size * (aTexCoord.y - 0.5)), height * scale - 0.75 , 1.0);
    vec3 aNormal = normalize(cross(vec3(size, 0, centralX), vec3(0, size, centralY)));
    vNormal = normalize(mat3(matNormal) * aNormal);
    
}`;

Terrain.src_shader_frag =
`#version 300 es
        precision mediump float;
        in vec4	vPosEye;
        in vec3	vNormal;
        out vec4 fColor;
        struct TMaterial
        {
        	vec3	ambient;
        	vec3	diffuse;
        	vec3	specular;
        	vec3	emission;
        	float	shininess;
        };
        struct TLight
        {
        	vec4	position;
        	vec3	ambient;
        	vec3	diffuse;
        	vec3	specular;
        	bool	enabled;
        };
        uniform TMaterial	material;
        uniform TLight		light[20];
        void main()
        {
        	vec3	n = normalize(vNormal);
        	vec3	l;
        	vec3	v = normalize(-vPosEye.xyz);
        	fColor = vec4(0.0);
        	for(int i = 0 ; i < 20 ; i++)
        	{
        		if(light[i].enabled)
        		{
        			if(light[i].position.w == 1.0)
        				l = normalize((light[i].position - vPosEye).xyz);		// positional light
        			else
        				l = normalize((light[i].position).xyz);	// directional light
        			float	l_dot_n = max(dot(l, n), 0.0);
        			vec3	ambient = light[i].ambient * material.ambient;
        			vec3	diffuse = light[i].diffuse * material.diffuse * l_dot_n;
        			vec3	specular = vec3(0.0);
        			if(l_dot_n > 0.0)
        			{
        				vec3	h = normalize(l + v);
        				specular = light[i].specular * material.specular * pow(max(dot(h, n), 0.0), material.shininess);
        			}
        			fColor += vec4(ambient + diffuse + specular, 1);
        		}
        	}
        	fColor.w = 1.0;
        }`
;


class Chopper {
    constructor(gl, length = 0.4) {
        this.MVP = mat4.create();
        this.MV = mat4.create();
        this.M = mat4.create();
        this.N = mat4.create();
        if (!Chopper.h_prog)
            Chopper.h_prog = init_shaders(gl, Chopper.src_shader_vert, Chopper.src_shader_frag);
        this.init_vbo(gl, length);
    }

    init_vbo(gl, l) {
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const vertices = new Float32Array([
            //front
            l, -l, -l, l, l, -l, l, l, l,
            l, -l, -l, l, l, l, l, -l, l,
            //left
            -l, -l, -l, l, -l, -l, l, -l, l,
            -l, -l, -l, l, -l, l, -l, -l, l,
            //right
            l, l, -l, -l, l, -l, -l, l, l,
            l, l, -l, -l, l, l, l, l, l,
            //back
            -l, l, -l, -l, -l, -l, -l, -l, l,
            -l, l, -l, -l, -l, l, -l, l, l,
            //up
            l, -l, l, l, l, l, -l, l, l,
            l, -l, l, -l, l, l, -l, -l, l,
            //down
            -l, -l, -l, -l, l, -l, l, l, -l,
            -l, -l, -l, l, l, -l, l, -l, -l,
            //tailfront
            l / 2, l, -l / 2, l / 2, 3 * l, -l / 2, l / 2, 3 * l, l / 2,
            l / 2, l, -l / 2, l / 2, 3 * l, l / 2, l / 2, l, l / 2,
            //tailright
            l / 2, 3 * l, -l / 2, -l / 2, 3 * l, -l / 2, -l / 2, 3 * l, l / 2,
            l / 2, 3 * l, -l / 2, -l / 2, 3 * l, l / 2, l / 2, 3 * l, l / 2,
            //tailback
            -l / 2, 3 * l, -l / 2, -l / 2, l, -l / 2, -l / 2, l, l / 2,
            -l / 2, 3 * l, -l / 2, -l / 2, l, l / 2, -l / 2, 3 * l, l / 2,
            //tailup
            l / 2, l, l / 2, l / 2, 3 * l, l / 2, -l / 2, 3 * l, l / 2,
            l / 2, l, l / 2, -l / 2, 3 * l, l / 2, -l / 2, l, l / 2,
            //taildown
            -l / 2, l, -l / 2, -l / 2, 3 * l, -l / 2, l / 2, 3 * l, -l / 2,
            -l / 2, l, -l / 2, l / 2, 3 * l, -l / 2, l / 2, l, -l / 2,
        ]);

        const normals = new Float32Array([
            //front
            1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0,
            //left
            0, -1, 0, 0, -1, 0, 0, -1, 0,
            0, -1, 0, 0, -1, 0, 0, -1, 0,
            //right
            0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0,
            //back
            -1, 0, 0, -1, 0, 0, -1, 0, 0,
            -1, 0, 0, -1, 0, 0, -1, 0, 0,
            //up
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            //down
            0, 0, -1, 0, 0, -1, 0, 0, -1,
            0, 0, -1, 0, 0, -1, 0, 0, -1,
            //tailfront
            1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0,
            //tailright
            0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0,
            //tailback
            -1, 0, 0, -1, 0, 0, -1, 0, 0,
            -1, 0, 0, -1, 0, 0, -1, 0, 0,
            //tailup
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            //taildown
            0, 0, -1, 0, 0, -1, 0, 0, -1,
            0, 0, -1, 0, 0, -1, 0, 0, -1,
        ]);

        const color = [];
        for (let i = 0; i < vertices.length / 3; i++) {
            color.push(0.1);
            color.push(0.9);
            color.push(0.1);
        }

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(Chopper.loc_aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(Chopper.loc_aNormal);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(Chopper.loc_aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(Chopper.loc_aPosition);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        gl.vertexAttribPointer(Chopper.loc_aColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(Chopper.loc_aColor);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    set_uniform_matrices(gl, h_prog, M, V, P) {
        mat4.copy(this.M, M);
        mat4.copy(this.MV, V);
        mat4.multiply(this.MV, this.MV, this.M);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MV"), false, this.MV);
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, this.MV);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP);
        mat4.copy(this.MVP, V);
        mat4.multiply(this.MVP, this.MVP, this.M);
        mat4.invert(this.N, this.MV);
        mat4.transpose(this.N, this.N);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "matNormal"), false, this.N);
    }

    set_uniform_lights(gl, h_prog, lights, V)
    {
        let i = 0;
        let v = vec4.create();
        for(let name in lights)
        {
            let light = lights[name];
            mat4.copy(this.MV, V);
            mat4.multiply(this.MV, this.MV, light.M);
            vec4.transformMat4(v, light.position, this.MV);
            gl.uniform4fv(gl.getUniformLocation(h_prog,`light[${i}].position`), v);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].ambient`), light.ambient);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].diffuse`), light.diffusive);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].specular`), light.specular);
            gl.uniform1i(gl.getUniformLocation(h_prog,`light[${i}].enabled`), light.enabled);
            i++;
        }
    }
    set_uniform_material(gl, h_prog, mat)
    {
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.ambient"), mat.ambient);
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.diffuse"), mat.diffusive);
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.specular"), mat.specular);
        gl.uniform1f(gl.getUniformLocation(h_prog,"material.shininess"), mat.shininess*128.0);
    }

    render(gl, M, V, P, lights, material) {
        gl.useProgram(Chopper.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Chopper.h_prog, M, V, P);
        if(lights) this.set_uniform_lights(gl, Chopper.h_prog, lights, V);
        if(material) this.set_uniform_material(gl, Chopper.h_prog, material);
        gl.drawArrays(gl.TRIANGLES, 0, 66);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

Chopper.loc_aPosition = 2;
Chopper.loc_aNormal = 4;

Chopper.src_shader_vert =
`#version 300 es
layout(location=${Chopper.loc_aPosition}) in vec4 aPosition;
layout(location=${Chopper.loc_aNormal}) in vec3 aNormal;

uniform mat4 MVP;
uniform mat4 MV;
uniform mat4 matNormal;

out vec4 vPosEye;
out vec3 vNormal;

void main()
{
    gl_Position = MVP * aPosition;
    vPosEye = MV * aPosition;
    vNormal = normalize(mat3(matNormal) * aNormal);
}
`;


Chopper.src_shader_frag =
    `#version 300 es
        precision mediump float;
        in vec4	vPosEye;
        in vec3	vNormal;
        out vec4 fColor;
        struct TMaterial
        {
        	vec3	ambient;
        	vec3	diffuse;
        	vec3	specular;
        	vec3	emission;
        	float	shininess;
        };
        struct TLight
        {
        	vec4	position;
        	vec3	ambient;
        	vec3	diffuse;
        	vec3	specular;
        	bool	enabled;
        };
        uniform TMaterial	material;
        uniform TLight		light[20];
        void main()
        {
        	vec3	n = normalize(vNormal);
        	vec3	l;
        	vec3	v = normalize(-vPosEye.xyz);
        	fColor = vec4(0.0);
        	for(int i = 0 ; i < 20 ; i++)
        	{
        		if(light[i].enabled)
        		{
        			if(light[i].position.w == 1.0)
        				l = normalize((light[i].position - vPosEye).xyz);		// positional light
        			else
        				l = normalize((light[i].position).xyz);	// directional light
        			float	l_dot_n = max(dot(l, n), 0.0);
        			vec3	ambient = light[i].ambient * material.ambient;
        			vec3	diffuse = light[i].diffuse * material.diffuse * l_dot_n;
        			vec3	specular = vec3(0.0);
        			if(l_dot_n > 0.0)
        			{
        				vec3	h = normalize(l + v);
        				specular = light[i].specular * material.specular * pow(max(dot(h, n), 0.0), material.shininess);
        			}
        			fColor += vec4(ambient + diffuse + specular, 1);
        		}
        	}
        	fColor.w = 1.0;
        }`;

class Propeller {
    constructor(gl, length = 0.5) {
        this.MVP = mat4.create();
        this.MV = mat4.create();
        this.M = mat4.create();
        this.N = mat4.create();
        if (!Propeller.h_prog)
            Propeller.h_prog = init_shaders(gl, Propeller.src_shader_vert, Propeller.src_shader_frag);
        this.init_vbo(gl, length);
    }

    init_vbo(gl, l) {
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const vertices = new Float32Array([
            // Propeller
            0, 0, l + l / 4, -l / 2, -3 * l / 2, l + l / 4, l / 2, -3 * l / 2, l + l / 4,
            0, 0, l + l / 4, 3 * l / 2, -l / 2, l + l / 4, 3 * l / 2, l / 2, l + l / 4,
            0, 0, l + l / 4, l / 2, 3 * l / 2, l + l / 4, -l / 2, 3 * l / 2, l + l / 4,
            0, 0, l + l / 4, -3 * l / 2, l / 2, l + l / 4, -3 * l / 2, -l / 2, l + l / 4,
        ]);

        const normals = new Float32Array([
            //up
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, 1, 0, 0, 1, 0, 0, 1,
        ]);

        const color = [];
        for (let i = 0; i < vertices.length / 3; i++) {
            color.push(0.9);
            color.push(0.1);
            color.push(0.1);
        }

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        gl.vertexAttribPointer(Propeller.loc_aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(Propeller.loc_aNormal);

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(Propeller.loc_aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(Propeller.loc_aPosition);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        gl.vertexAttribPointer(Propeller.loc_aColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(Propeller.loc_aColor);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    set_uniform_matrices(gl, h_prog, M, V, P) {
        mat4.copy(this.M, M);
        mat4.copy(this.MV, V);
        mat4.multiply(this.MV, this.MV, this.M);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MV"), false, this.MV);
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, this.MV);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP);
        mat4.copy(this.MVP, V);
        mat4.multiply(this.MVP, this.MVP, this.M);
        mat4.invert(this.N, this.MV);
        mat4.transpose(this.N, this.N);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "matNormal"), false, this.N);
    }

    set_uniform_lights(gl, h_prog, lights, V)
    {
        let i = 0;
        let v = vec4.create();
        for(let name in lights)
        {
            let light = lights[name];
            mat4.copy(this.MV, V);
            mat4.multiply(this.MV, this.MV, light.M);
            vec4.transformMat4(v, light.position, this.MV);
            gl.uniform4fv(gl.getUniformLocation(h_prog,`light[${i}].position`), v);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].ambient`), light.ambient);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].diffuse`), light.diffusive);
            gl.uniform3fv(gl.getUniformLocation(h_prog,`light[${i}].specular`), light.specular);
            gl.uniform1i(gl.getUniformLocation(h_prog,`light[${i}].enabled`), light.enabled);
            i++;
        }
    }
    set_uniform_material(gl, h_prog, mat)
    {
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.ambient"), mat.ambient);
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.diffuse"), mat.diffusive);
        gl.uniform3fv(gl.getUniformLocation(h_prog,"material.specular"), mat.specular);
        gl.uniform1f(gl.getUniformLocation(h_prog,"material.shininess"), mat.shininess*128.0);
    }


    render(gl, M, V, P, lights, material) {
        gl.useProgram(Propeller.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Propeller.h_prog, M, V, P);
        if(lights) this.set_uniform_lights(gl, Propeller.h_prog, lights, V);
        if(material) this.set_uniform_material(gl, Propeller.h_prog, material);
        gl.drawArrays(gl.TRIANGLES, 0, 12);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

Propeller.loc_aPosition = 5;
Propeller.loc_aNormal = 7;

Propeller.src_shader_vert =
    `#version 300 es
layout(location=${Propeller.loc_aPosition}) in vec4 aPosition;
layout(location=${Propeller.loc_aNormal}) in vec3 aNormal;

uniform mat4 MVP;
uniform mat4 MV;
uniform mat4 matNormal;

out vec4 vPosEye;
out vec3 vNormal;

void main()
{
    gl_Position = MVP * aPosition;
    vPosEye = MV * aPosition;
    vNormal = normalize(mat3(matNormal) * aNormal);
}
`;


Propeller.src_shader_frag =
    `#version 300 es
        precision mediump float;
        in vec4	vPosEye;
        in vec3	vNormal;
        out vec4 fColor;
        struct TMaterial
        {
        	vec3	ambient;
        	vec3	diffuse;
        	vec3	specular;
        	vec3	emission;
        	float	shininess;
        };
        struct TLight
        {
        	vec4	position;
        	vec3	ambient;
        	vec3	diffuse;
        	vec3	specular;
        	bool	enabled;
        };
        uniform TMaterial	material;
        uniform TLight		light[20];
        void main()
        {
        	vec3	n = normalize(vNormal);
        	vec3	l;
        	vec3	v = normalize(-vPosEye.xyz);
        	fColor = vec4(0.0);
        	for(int i = 0 ; i < 20 ; i++)
        	{
        		if(light[i].enabled)
        		{
        			if(light[i].position.w == 1.0)
        				l = normalize((light[i].position - vPosEye).xyz);		// positional light
        			else
        				l = normalize((light[i].position).xyz);	// directional light
        			float	l_dot_n = max(dot(l, n), 0.0);
        			vec3	ambient = light[i].ambient * material.ambient;
        			vec3	diffuse = light[i].diffuse * material.diffuse * l_dot_n;
        			vec3	specular = vec3(0.0);
        			if(l_dot_n > 0.0)
        			{
        				vec3	h = normalize(l + v);
        				specular = light[i].specular * material.specular * pow(max(dot(h, n), 0.0), material.shininess);
        			}
        			fColor += vec4(ambient + diffuse + specular, 1);
        		}
        	}
        	fColor.w = 1.0;
        }`;

class Light {
    constructor(gl, position, ambient, diffusive, specular, direction, enabled,  M = false, velocity = 0) {
        this.position = vec4.clone(position);
        this.ambient = vec3.clone(ambient);
        this.diffusive = vec3.clone(diffusive);
        this.specular = vec3.clone(specular);
        this.enabled = enabled;
        this.M = mat4.create();
        this.MVP = mat4.create();
        this.direction = vec4.clone([direction[0], direction[1], direction[2], 0.0]);
        this.cutoff_angle = 180;
        this.enabledTime = 0;
        if (!Light.h_prog)
            Light.h_prog = init_shaders(gl, Light.src_shader_vert, Light.src_shader_frag);
    }

    set_type(positional) {
        if (positional) this.position[3] = 1.0;
        else this.position[3] = 0.0;
    }
    turn_on(enabled) {
        this.enabled = enabled;
        this.enabledTime = 3000;
    }

    setM(M){
        mat4.copy(this.M ,M);
    }

    render(gl, V, P, time) {
        this.enabledTime -= time;
        let v = vec4.create();
        gl.useProgram(Light.h_prog);
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, V);
        gl.uniformMatrix4fv(gl.getUniformLocation(Light.h_prog, "MVP"), false, this.MVP);
        vec4.transformMat4(v, this.position, this.M);
        gl.vertexAttrib4fv(Light.loc_aPosition, v);
        if(v[2] < -0.75) {
            this.turn_on(false);
        }
        if (this.enabled) gl.vertexAttrib3f(Light.loc_aColor, 1, 1, 1);
        else gl.vertexAttrib3f(Light.loc_aColor, .1, .1, .1);
        gl.drawArrays(gl.POINTS, 0, 1);
        gl.useProgram(null);
    }
}

Light.loc_aPosition = 11;
Light.loc_aColor = 12;
Light.leftTime = 3000;
Light.src_shader_vert =
    `#version 300 es
	layout(location=${Light.loc_aPosition}) in vec4 aPosition;
	layout(location=${Light.loc_aColor}) in vec4 aColor;
	uniform mat4 MVP;
	out vec4 vColor;
	void main()
	{
		gl_Position = MVP * vec4(aPosition.xyz, 1);
		gl_PointSize = 10.0;
		vColor = aColor;
	}
`;

Light.src_shader_frag =
    `#version 300 es
	#ifdef GL_ES
	precision mediump float;
	#endif
	in vec4 vColor;
    out vec4 fColor;
	void main()
	{
		fColor = vColor;
	}
`;

export class Material
{
    constructor(ambient, diffusive, specular, shininess)
    {
        this.ambient = vec3.clone(ambient);
        this.diffusive = vec3.clone(diffusive);
        this.specular = vec3.clone(specular);
        this.shininess = shininess;
    }
}

main();