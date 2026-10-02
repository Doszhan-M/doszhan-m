export function createAsciiFluid(previewSection) {
    const RAMP = ".:-=+*#%@";
    const COLOR = "19, 190, 62";
    const STEP_MS = 1000 / 60;
    const PRESSURE_ITERATIONS = 12;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.classList.add("preview__video");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.display = "none";
    previewSection.insertBefore(canvas, previewSection.firstChild);
    const ctx = canvas.getContext("2d");

    let cellW, cellH, cols, rows, W, H, size;
    let u, v, u0, v0, dens, dens0, pressure, divergence;
    let dpr = 1;

    function setup() {
        const isMobile = window.innerWidth <= 812;
        cellW = isMobile ? 12 : 10;
        cellH = isMobile ? 20 : 18;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        cols = Math.ceil(width / cellW);
        rows = Math.ceil(height / cellH);
        W = cols + 2;
        H = rows + 2;
        size = W * H;
        u = new Float32Array(size);
        v = new Float32Array(size);
        u0 = new Float32Array(size);
        v0 = new Float32Array(size);
        dens = new Float32Array(size);
        dens0 = new Float32Array(size);
        pressure = new Float32Array(size);
        divergence = new Float32Array(size);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `bold ${cellH - 2}px "Courier New", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    }

    function splat(cx, cy, vx, vy, amount) {
        const radius = 4;
        for (let j = -radius; j <= radius; j++) {
            for (let i = -radius; i <= radius; i++) {
                const x = cx + i + 1;
                const y = cy + j + 1;
                if (x < 1 || x > cols || y < 1 || y > rows) continue;
                const falloff = Math.max(0, 1 - Math.hypot(i, j) / (radius + 0.5));
                const idx = x + y * W;
                u[idx] += vx * falloff;
                v[idx] += vy * falloff;
                dens[idx] = Math.min(1.5, dens[idx] + amount * falloff);
            }
        }
    }

    function advect(dst, src, uu, vv) {
        for (let y = 1; y <= rows; y++) {
            for (let x = 1; x <= cols; x++) {
                const idx = x + y * W;
                const px = Math.min(Math.max(x - uu[idx], 0.5), cols + 0.5);
                const py = Math.min(Math.max(y - vv[idx], 0.5), rows + 0.5);
                const x0 = Math.floor(px);
                const y0 = Math.floor(py);
                const sx = px - x0;
                const sy = py - y0;
                const i0 = x0 + y0 * W;
                dst[idx] =
                    (1 - sy) * ((1 - sx) * src[i0] + sx * src[i0 + 1]) +
                    sy * ((1 - sx) * src[i0 + W] + sx * src[i0 + W + 1]);
            }
        }
    }

    function project() {
        pressure.fill(0);
        for (let y = 1; y <= rows; y++) {
            for (let x = 1; x <= cols; x++) {
                const idx = x + y * W;
                divergence[idx] = -0.5 * (u[idx + 1] - u[idx - 1] + v[idx + W] - v[idx - W]);
            }
        }
        for (let k = 0; k < PRESSURE_ITERATIONS; k++) {
            for (let y = 1; y <= rows; y++) {
                for (let x = 1; x <= cols; x++) {
                    const idx = x + y * W;
                    pressure[idx] =
                        (divergence[idx] +
                            pressure[idx - 1] + pressure[idx + 1] +
                            pressure[idx - W] + pressure[idx + W]) / 4;
                }
            }
        }
        for (let y = 1; y <= rows; y++) {
            for (let x = 1; x <= cols; x++) {
                const idx = x + y * W;
                u[idx] -= 0.5 * (pressure[idx + 1] - pressure[idx - 1]);
                v[idx] -= 0.5 * (pressure[idx + W] - pressure[idx - W]);
            }
        }
    }

    function step() {
        project();
        u0.set(u);
        v0.set(v);
        advect(u, u0, u0, v0);
        advect(v, v0, u0, v0);
        project();
        dens0.set(dens);
        advect(dens, dens0, u, v);
        for (let i = 0; i < size; i++) {
            dens[i] *= 0.99;
            u[i] *= 0.996;
            v[i] *= 0.996;
        }
    }

    function render() {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        const levels = RAMP.length;
        for (let level = 0; level < levels; level++) {
            const lo = (level + 1) / (levels + 1) * 0.9;
            const hi = (level + 2) / (levels + 1) * 0.9;
            const char = RAMP[level];
            ctx.fillStyle = `rgba(${COLOR}, ${0.3 + 0.7 * (level / (levels - 1))})`;
            for (let y = 1; y <= rows; y++) {
                for (let x = 1; x <= cols; x++) {
                    const d = Math.pow(dens[x + y * W], 0.6);
                    if (d >= lo && (d < hi || level === levels - 1)) {
                        ctx.fillText(char, (x - 0.5) * cellW, (y - 0.5) * cellH);
                    }
                }
            }
        }
    }

    function randomSplat() {
        const cx = Math.floor(Math.random() * cols);
        const cy = Math.floor(Math.random() * rows);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        splat(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.9);
    }

    let lastPointer = null;
    let lastPointerTime = 0;
    let active = false;
    let running = false;
    let rafId = 0;
    let lastFrame = 0;
    let accumulator = 0;
    let lastIdleSplat = 0;
    let visible = true;

    window.addEventListener("pointermove", (event) => {
        if (!active) return;
        const rect = canvas.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        if (py < 0 || py > rect.height) {
            lastPointer = null;
            return;
        }
        const cx = Math.floor(px / cellW);
        const cy = Math.floor(py / cellH);
        if (lastPointer) {
            const dx = Math.max(-6, Math.min(6, (cx - lastPointer.cx) * 0.8));
            const dy = Math.max(-6, Math.min(6, (cy - lastPointer.cy) * 0.8));
            splat(cx, cy, dx, dy, 1.0);
        }
        lastPointer = {cx, cy};
        lastPointerTime = performance.now();
    }, {passive: true});

    window.addEventListener("pointerleave", () => { lastPointer = null; });

    function frame(now) {
        if (!running) return;
        accumulator += Math.min(now - lastFrame, 100);
        lastFrame = now;

        if (now - lastPointerTime > 2000 && now - lastIdleSplat > 1800) {
            randomSplat();
            lastIdleSplat = now;
        }
        while (accumulator >= STEP_MS) {
            step();
            accumulator -= STEP_MS;
        }
        render();
        rafId = requestAnimationFrame(frame);
    }

    function update() {
        const shouldRun = active && visible && !document.hidden;
        if (shouldRun && !running) {
            running = true;
            lastFrame = performance.now();
            accumulator = 0;
            rafId = requestAnimationFrame(frame);
        } else if (!shouldRun && running) {
            running = false;
            cancelAnimationFrame(rafId);
        }
    }

    new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        update();
    }).observe(previewSection);
    document.addEventListener("visibilitychange", update);

    let resizeTimer;
    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!active) return;
            const widthChanged = Math.round(canvas.clientWidth * dpr) !== canvas.width;
            const heightChanged = Math.abs(canvas.clientHeight * dpr - canvas.height) > 150;
            if (widthChanged || heightChanged) setup();
        }, 150);
    }).observe(canvas);

    function show() {
        active = true;
        canvas.style.display = "block";
        setup();
        lastPointer = null;
        lastPointerTime = 0;
        lastIdleSplat = 0;
        for (let i = 0; i < 4; i++) randomSplat();
        if (reducedMotion) {
            for (let i = 0; i < 40; i++) step();
            render();
            return;
        }
        update();
    }

    function hide() {
        active = false;
        canvas.style.display = "none";
        update();
    }

    return {show, hide};
}
