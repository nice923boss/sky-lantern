class LanternRenderer {
    constructor() {
        this.cache = {}; // Cache offscreen canvases by color
    }

    getTexture(color, scale = 1) {
        const key = `${color}-${scale}`;
        if (this.cache[key]) return this.cache[key];

        const w = 60 * scale;
        const h = 80 * scale;
        const canvas = document.createElement('canvas');
        canvas.width = w + 40;
        canvas.height = h + 40;
        const ctx = canvas.getContext('2d');
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.shadowBlur = 20 * scale;
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.moveTo(cx - w/2, cy - h/4);
        ctx.bezierCurveTo(cx - w/2, cy - h/2, cx + w/2, cy - h/2, cx + w/2, cy - h/4);
        ctx.lineTo(cx + w*0.35, cy + h/2);
        ctx.bezierCurveTo(cx, cy + h/2 + 10*scale, cx, cy + h/2 + 10*scale, cx - w*0.35, cy + h/2);
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, 5*scale, cx, cy, w);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.4, color);
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fill();

        this.cache[key] = canvas;
        return canvas;
    }

    drawFlame(ctx, x, y, scale, time) {
        const flicker = Math.sin(time * 10) * 0.2 + 0.8;
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.ellipse(x, y + 35*scale, 8*scale * flicker, 5*scale, 0, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255, 100, 0, ${0.6 * flicker})`;
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}