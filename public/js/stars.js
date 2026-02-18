class StarSystem {
    constructor(canvas) {
        this.stars = [];
        this.numStars = 200;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.init();
    }

    init() {
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 0.5,
                alpha: Math.random(),
                flickerSpeed: 0.02 + Math.random() * 0.05,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    resize(w, h) {
        this.stars = [];
        this.init();
    }

    draw(time) {
        const ctx = this.ctx;
        ctx.fillStyle = "white";
        
        this.stars.forEach(star => {
            const opacity = 0.3 + 0.7 * Math.abs(Math.sin(time * star.flickerSpeed + star.phase));
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}