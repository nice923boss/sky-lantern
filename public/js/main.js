const canvas = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');
const renderer = new LanternRenderer();
const stars = new StarSystem(canvas);

let lanterns = []; 
let myLantern = null; 

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars.resize(canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

function loop(time) {
    const t = time / 1000;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.draw(time);

    const allLanterns = [...lanterns];
    if (myLantern) allLanterns.push(myLantern);

    allLanterns.sort((a, b) => a.y - b.y); // 遠的先畫 (高空 Y 值小)
    
    allLanterns.forEach(l => {
        updateLantern(l, t);
        drawLantern(l, t);
    });

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function updateLantern(l, t) {
    if (l.isAnimating) {
        if (l.y > canvas.height * 0.5) {
            l.y -= 2; 
            l.scale = 1.5 - ((canvas.height - l.y) / canvas.height) * 0.5;
        } else {
            l.isAnimating = false;
            if(l === myLantern) {
                addLanternToSky(l.data);
                myLantern = null;
                showToast("心願已飛向星空 ✨");
            }
        }
        return;
    }

    l.y -= l.speed;
    const sway = Math.sin(t + l.phase) * 20;
    l.visualX = l.x + sway;

    if (l.y < -100) {
        l.y = canvas.height + 100;
        l.x = Math.random() * canvas.width; 
    }

    const progress = l.y / canvas.height;
    l.scale = 0.4 + (progress * 0.6);
}

function drawLantern(l, t) {
    const img = renderer.getTexture(l.color, l.scale);
    const w = img.width;
    const h = img.height;
    ctx.drawImage(img, l.visualX - w/2, l.y - h/2);
    renderer.drawFlame(ctx, l.visualX, l.y, l.scale, t);
}

function createLanternObject(data) {
    return {
        id: data.id,
        x: (data.x_position / 100) * canvas.width,
        y: (data.y_position / 100) * canvas.height, 
        visualX: 0,
        speed: data.float_speed,
        phase: data.float_phase,
        color: data.color || '#FF8C42',
        scale: 1,
        author_name: data.author_name,
        message: data.message,
        wish_category: data.wish_category,
        released_at: data.released_at,
        data: data
    };
}

function addLanternToSky(data) {
    if (lanterns.find(l => l.id === data.id)) return;
    const obj = createLanternObject(data);
    lanterns.push(obj);
}

// 點擊偵測
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let clicked = null;
    for (let l of lanterns) {
        const dx = mx - l.visualX;
        const dy = my - l.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 40 * l.scale) {
            clicked = l;
            break; 
        }
    }

    if (clicked) {
        window.openDetailModal(clicked.data);
    }
});

// 管理者刪除後，立即從畫面移除
window.removeLanternFromScene = (id) => {
    lanterns = lanterns.filter(l => l.id !== id);
};

// 暴露給 Modal 使用
window.startReleaseAnimation = (lanternData) => {
    myLantern = {
        ...createLanternObject(lanternData),
        x: canvas.width / 2,
        y: canvas.height - 100,
        scale: 1.5,
        isAnimating: true,
        phase: 0,
        speed: 0
    };
};

// 初始載入
API.getActive().then(data => {
    data.lanterns.forEach(addLanternToSky);
    const btnLoad = document.getElementById('btnLoadMore');
    if (data.total_count > 200) {
        btnLoad.style.display = 'block';
        btnLoad.innerText = `載入更多天燈 ✨ (剩餘 ${data.total_count - lanterns.length})`;
    }
});

document.getElementById('btnLoadMore').addEventListener('click', async () => {
    const exclude = lanterns.map(l => l.id);
    const data = await API.getActive(0, exclude);
    
    data.lanterns.forEach(d => {
        const obj = createLanternObject(d);
        obj.y = canvas.height + 50 + Math.random() * 100;
        lanterns.push(obj);
    });

    if (lanterns.length > 300) {
        lanterns.splice(0, lanterns.length - 300);
    }
    
    const btnLoad = document.getElementById('btnLoadMore');
    const remaining = data.total_count - (exclude.length + data.lanterns.length);
    if (remaining <= 0) btnLoad.style.display = 'none';
    else btnLoad.innerText = `載入更多天燈 ✨ (剩餘 ${remaining})`;
});