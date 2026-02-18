const modalCreate = document.getElementById('createModal');
const modalDetail = document.getElementById('detailModal');
const modalAdmin = document.getElementById('adminModal');
const btnOpenCreate = document.getElementById('btnOpenCreate');
const adminTrigger = document.getElementById('adminTrigger');
const btnCloseList = document.querySelectorAll('.btn-close');

let currentLanternId = null;
let currentDetailId = null;
let currentDraft = {
    color: '#FF8C42',
    wish_category: '其他'
};

const colors = [
    '#FF8C42', '#FF5E8A', '#42BFFF', '#42FF9B', 
    '#FFD700', '#B87FFF', '#FF6B6B', '#F0F0F0'
];

function initUI() {
    // 顏色選擇器
    const picker = document.getElementById('colorPicker');
    colors.forEach(c => {
        const dot = document.createElement('div');
        dot.className = 'color-dot';
        dot.style.backgroundColor = c;
        dot.onclick = () => selectColor(c, dot);
        picker.appendChild(dot);
    });
    selectColor(colors[0], picker.children[0]);

    // 類別按鈕
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDraft.wish_category = btn.dataset.val;
            checkFormValidity();
        };
    });

    // 輸入監聽
    document.getElementById('authorName').oninput = checkFormValidity;
    document.getElementById('messageInput').oninput = (e) => {
        document.getElementById('charCount').innerText = e.target.value.length;
        checkFormValidity();
    };
}

function selectColor(color, el) {
    currentDraft.color = color;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    updatePreview();
}

function updatePreview() {
    const previewDiv = document.getElementById('lanternPreview');
    previewDiv.innerHTML = '';
    const fakeLantern = document.createElement('div');
    fakeLantern.style.width = '60px';
    fakeLantern.style.height = '80px';
    fakeLantern.style.margin = '20px auto';
    fakeLantern.style.background = `radial-gradient(circle, white 10%, ${currentDraft.color} 90%)`;
    fakeLantern.style.borderRadius = '10px 10px 30px 30px';
    fakeLantern.style.boxShadow = `0 0 20px ${currentDraft.color}`;
    previewDiv.appendChild(fakeLantern);
}

function checkFormValidity() {
    const name = document.getElementById('authorName').value.trim();
    const msg = document.getElementById('messageInput').value.trim();
    const btn = document.getElementById('btnRelease');
    
    if (name && msg) {
        btn.disabled = false;
        currentDraft.author_name = name;
        currentDraft.message = msg;
    } else {
        btn.disabled = true;
    }
}

// 開啟製作流程 (直接建立草稿)
btnOpenCreate.onclick = async () => {
    btnOpenCreate.disabled = true;
    try {
        const res = await API.create();
        currentLanternId = res.lantern_id;
        
        // 重置表單
        document.getElementById('authorName').value = '';
        document.getElementById('messageInput').value = '';
        document.getElementById('charCount').innerText = '0';
        selectColor(colors[0], document.querySelector('.color-dot'));
        document.getElementById('btnRelease').disabled = true;
        
        modalCreate.classList.remove('hidden');
    } catch(e) {
        showToast("連線錯誤，請稍後再試");
    } finally {
        btnOpenCreate.disabled = false;
    }
};

// 釋放按鈕
document.getElementById('btnRelease').onclick = async () => {
    const editRes = await API.edit(currentLanternId, currentDraft);
    if (!editRes.success) { alert("儲存失敗"); return; }

    const releaseRes = await API.release(currentLanternId);
    if (releaseRes.error) { alert("釋放失敗"); return; }

    modalCreate.classList.add('hidden');
    window.startReleaseAnimation(releaseRes);
};

// 詳情 Modal
window.openDetailModal = (data) => {
    currentDetailId = data.id;
    const m = document.querySelector('.detail-card');
    m.querySelector('.author-display').innerText = data.author_name;
    m.querySelector('.message-display').innerText = data.message;
    m.querySelector('.wish-tag').innerText = data.wish_category;
    m.querySelector('.time-display').innerText = new Date(data.released_at).toLocaleString();
    
    const icon = m.querySelector('.lantern-icon-large');
    icon.style.background = data.color;
    icon.style.boxShadow = `0 0 20px ${data.color}`;

    // 檢查管理者權限
    const token = localStorage.getItem('adminToken');
    const adminDiv = document.getElementById('adminControls');
    if (token) {
        adminDiv.classList.remove('hidden');
    } else {
        adminDiv.classList.add('hidden');
    }

    modalDetail.classList.remove('hidden');
};

// 關閉按鈕
btnCloseList.forEach(btn => {
    btn.onclick = (e) => e.target.closest('.modal').classList.add('hidden');
});

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 2000);
}

// --- 管理者相關 ---
adminTrigger.onclick = () => {
    modalAdmin.classList.remove('hidden');
    document.getElementById('adminError').innerText = '';
    document.getElementById('adminPassword').value = '';
};

document.getElementById('btnAdminLogin').onclick = async () => {
    const pwd = document.getElementById('adminPassword').value;
    const res = await API.adminLogin(pwd);
    if (res.success) {
        localStorage.setItem('adminToken', res.token);
        modalAdmin.classList.add('hidden');
        showToast("管理者登入成功 👮‍♂️");
    } else {
        document.getElementById('adminError').innerText = '密碼錯誤';
    }
};

document.getElementById('btnAdminDelete').onclick = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    
    if (confirm('確定要刪除這個天燈嗎？')) {
        const res = await API.adminDelete(currentDetailId, token);
        if (res.success) {
            showToast("天燈已刪除");
            modalDetail.classList.add('hidden');
            // 通知 Main.js 移除畫面物件
            window.removeLanternFromScene(currentDetailId);
        } else {
            alert('刪除失敗：' + (res.error || '未知錯誤'));
            if(res.status === 403) localStorage.removeItem('adminToken');
        }
    }
};

initUI();