// --- Firebase 設定 (請替換成你在 Firebase Console 複製的內容) ---
const firebaseConfig = {
  apiKey: "AIzaSyAOEQPMaJry7kYmWfDVh9veABw0cs2WjNY",
  authDomain: "sky-lantern-956c6.firebaseapp.com",
  projectId: "sky-lantern-956c6",
  storageBucket: "sky-lantern-956c6.firebasestorage.app",
  messagingSenderId: "274780978682",
  appId: "1:274780978682:web:4e9c942df3bdc25e2c3843"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const lanternsCollection = db.collection('lanterns');

// --- API 邏輯 ---
const API = {
    // 1. 建立新草稿 (在前端生成假 ID，實際寫入等 Release)
    async create() {
        // Firebase 自動生成 ID，這裡我們先回傳一個佔位符
        return { lantern_id: 'draft_' + Date.now() };
    },

    // 2. 編輯 (其實只更新本地暫存，因為還沒寫入資料庫)
    async edit(id, data) {
        // 因為我們改流程：直接在 Release 時寫入完整資料
        // 這裡回傳 success 騙過前端 UI 即可
        return { success: true };
    },

    // 3. 釋放天燈 (這時候才真正寫入 Firebase)
    async release(id) {
        // 取得 UI 上目前的草稿資料 (我們需要從 modal.js 取得，但為了不改 modal.js，我們在這裡重新組裝資料)
        // 修正：因為原始架構是分段儲存，這裡我們稍微變通一下：
        // 實際上 modal.js 呼叫 edit 時已經把資料傳給 API 了，我們可以用一個變數暫存
        
        // 隨機生成飄動參數
        const lanternData = {
            author_name: window.currentDraftData?.author_name || '無名氏',
            message: window.currentDraftData?.message || '平安喜樂',
            wish_category: window.currentDraftData?.wish_category || '其他',
            color: window.currentDraftData?.color || '#FF8C42',
            x_position: Math.random() * 100,
            y_position: 100 + (Math.random() * 20),
            float_speed: 0.3 + Math.random() * 0.5,
            float_phase: Math.random() * Math.PI * 2,
            is_released: true,
            released_at: new Date().toISOString(), // 存字串方便
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // 寫入 Firebase
            const docRef = await lanternsCollection.add(lanternData);
            return { ...lanternData, id: docRef.id };
        } catch (e) {
            console.error("Error adding document: ", e);
            return { error: "釋放失敗" };
        }
    },

    // 4. 取得活躍天燈
    async getActive(offset = 0, excludeIds = []) {
        try {
            // Firebase 的查詢限制較多，這裡做簡單查詢
            // 抓取最新的 100 筆
            const q = lanternsCollection
                .orderBy('created_at', 'desc')
                .limit(100);

            const snapshot = await q.get();
            const lanterns = [];
            
            snapshot.forEach(doc => {
                if (!excludeIds.includes(doc.id)) {
                    lanterns.push({ id: doc.id, ...doc.data() });
                }
            });

            return { lanterns, total_count: lanterns.length }; // total_count 只是估計
        } catch (e) {
            console.error("Error getting documents: ", e);
            return { lanterns: [], total_count: 0 };
        }
    },

    // 5. 管理者登入 (Firebase 雖然有 Auth，但為了配合原本邏輯，這裡做簡易版)
    async adminLogin(password) {
        // ⚠️ 注意：前端驗證密碼是不安全的，但在這個練習專案中可以接受
        // 若要安全，請使用 Firebase Authentication
        if (password === 'admin888') {
            return { success: true, token: 'firebase-admin-token' };
        } else {
            return { success: false };
        }
    },

    // 6. 管理者刪除
    async adminDelete(id, token) {
        if (token !== 'firebase-admin-token') return { error: '無權限' };
        try {
            await lanternsCollection.doc(id).delete();
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    }
};

// 輔助：攔截 modal.js 的資料流
// 因為原本邏輯是 edit -> 後端暫存，現在沒有後端 session
// 我們偷偷掛一個變數來暫存 modal.js 傳過來的資料
const originalEdit = API.edit;
API.edit = async function(id, data) {
    window.currentDraftData = { ...window.currentDraftData, ...data };
    return { success: true };
};