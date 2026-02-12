/**
 * MOMO HUT POS - Final Consolidated Script
 */

// ১. Firebase Setup (২০২৬ সালের জন্য সঠিক কনফিগারেশন)
// ১. Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyA4uXeqBJKXAMa4CYuYtgzNUhG6M-uGhq4",
  authDomain: "momo-hut-pos.firebaseapp.com",
  projectId: "momo-hut-pos",
  storageBucket: "momo-hut-pos.firebasestorage.app",
  messagingSenderId: "893528182676",
  appId: "1:893528182676:web:d2e2c602cee50fd6988981",
  measurementId: "G-9279GKCT6W",
  databaseURL: "https://momo-hut-pos-default-rtdb.firebaseio.com" // এটি একদম সঠিক URL
};

// অ্যাপটি অলরেডি শুরু হয়ে থাকলে পুনরায় করবে না
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const historyRef = db.ref('momo_history');
historyRef.keepSynced(true);

// ২. ডাটা এবং গ্লোবাল ভেরিয়েবল
const menuData = {
    "🥟 Steam Momo (6 Pcs)": [["Regular Steam Momo", 90], ["Sausage Carnival Momo", 150], ["Naga Momo", 100], ["Masala Momo", 100]],
    "🔥 Fried Momo (6 Pcs)": [["Fried Momo", 90], ["Naga Fried Momo", 110], ["Kurkure Momo", 120]],
    "🍖 BBQ Momo (6 Pcs)": [["Regular BBQ Momo", 110], ["Naga BBQ Momo", 120]],
    "🍱 Platters": [["Special Platter", 230], ["Kurkure Platter", 250]],
    "🥤 Drinks": [["Tea", 30], ["Coffee", 50], ["Soft Drinks", 25]]
};

let orders = { 1: { cart: {}, total: 0, subtotal: 0, discount: 0, container: 0, delivery: 0 } };
let activeTabId = 1;
let orderID = localStorage.getItem('momo_lastID') ? parseInt(localStorage.getItem('momo_lastID')) + 1 : 1001;
let currentUserMode = localStorage.getItem('momo_user_mode') || "Admin";

// ৩. মেইন ইনিশিয়াল ফাংশন
function init() {
    checkSecurity(); 
    renderMenu();
    renderTabs();
    refreshOrderUI();
    applyUserRestrictions();
    
    // ফায়ারবেস রিয়েল-টাইম ডাটা লিসেনার
    historyRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const syncedHistory = Object.values(data).sort((a, b) => b.id - a.id);
            localStorage.setItem('momo_history', JSON.stringify(syncedHistory));
            renderActiveDashboard();
            loadHistory();
        }
    });
}

// ৪. অর্ডার সেভ এবং Firebase পুশ (সংশোধিত লজিক)
function saveOrder() {
    const cur = orders[activeTabId];
    if (!cur || Object.keys(cur.cart).length === 0) return alert("অর্ডার খালি!");

    const record = { 
        id: orderID, 
        status: 'active', 
        table: document.getElementById('table-no')?.value || "Takeaway",
        customerName: document.getElementById('customer-name')?.value || "Guest",
        customerPhone: document.getElementById('customer-phone')?.value || "N/A",
        items: JSON.parse(JSON.stringify(cur.cart)), 
        total: cur.total, 
        subtotal: cur.subtotal,
        date: new Date().toISOString().split('T')[0], 
        time: new Date().toLocaleTimeString(),
        endTime: new Date().getTime() + (parseInt(document.getElementById('prep-time')?.value || 15) * 60000)
    };

    db.ref('momo_history/' + record.id).set(record)
    .then(() => {
        localStorage.setItem('momo_lastID', orderID++);
        printReceipts(record);
        resetCurrentOrder();
        alert("অর্ডার সফলভাবে সেভ হয়েছে! ✅");
    })
    .catch((err) => alert("Firebase Error: " + err.message));
}

// ৫. UI রিফ্রেশ লজিক
function refreshOrderUI() {
    const cur = orders[activeTabId];
    let sub = 0;
    const rowsContainer = document.getElementById('cart-rows');
    if (rowsContainer) rowsContainer.innerHTML = ""; 
    document.querySelectorAll('.qty-display').forEach(s => s.innerText = "0");

    for (let id in cur.cart) {
        const item = cur.cart[id];
        sub += item.price;
        const menuQtyEl = document.getElementById("qty-" + item.name.replace(/\s+/g, '-'));
        if (menuQtyEl) menuQtyEl.innerText = parseInt(menuQtyEl.innerText) + 1;

        if (rowsContainer) {
            rowsContainer.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:5px 0;">
                    <span style="font-size:12px;">${item.name}</span>
                    <select onchange="updateItemType('${id}', this.value)" style="font-size:11px; border:1px solid #ff4757; border-radius:5px;">
                        <option value="Dine-in" ${item.type === 'Dine-in' ? 'selected' : ''}>🍽️ Dine</option>
                        <option value="Parcel" ${item.type === 'Parcel' ? 'selected' : ''}>📦 Parcel</option>
                    </select>
                </div>`;
        }
    }
    const d = parseFloat(document.getElementById('discount')?.value) || 0;
    const c = parseFloat(document.getElementById('container')?.value) || 0;
    const dl = parseFloat(document.getElementById('delivery')?.value) || 0;
    
    cur.subtotal = sub;
    cur.total = (sub - d) + c + dl;
    if(document.getElementById('total')) document.getElementById('total').innerText = cur.total;
    if(document.getElementById('subtotal')) document.getElementById('subtotal').innerText = sub;
    calcChange();
}

// ৬. হিস্টোরি লোড (নাম ঠিক দেখানোর জন্য)
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('momo_history') || "[]");
    const list = document.getElementById('history-list');
    const today = new Date().toISOString().split('T')[0];
    let total = 0;
    
    if(!list) return;
    list.innerHTML = "";
    
    history.forEach(o => {
        if(o.date === today) total += o.total;
        const itemNames = Object.values(o.items).map(i => i.name).join(', ');

        list.innerHTML += `
            <div class="history-item" style="border-left:5px solid #ff4757; margin-bottom:10px; padding:10px; background:#fff; border-radius:10px;">
                <div style="display:flex; justify-content:space-between;">
                    <b>#${o.id} - ${o.time}</b>
                    <span style="color:#2ed573; font-weight:bold;">${o.total}৳</span>
                </div>
                <small style="color:#666;">Table: ${o.table} | Items: ${itemNames}</small>
            </div>`;
    });
    const display = document.getElementById('today-total-display');
    if(display) display.innerText = total + " TK";
}

// ৭. মেনু এবং ট্যাব কন্ট্রোল
function renderMenu() {
    const container = document.getElementById('menu-container');
    if(!container) return;
    container.innerHTML = "";
    for (let section in menuData) {
        container.innerHTML += `<div class="menu-section-title">${section}</div>`;
        menuData[section].forEach(item => {
            const safeId = "qty-" + item[0].replace(/\s+/g, '-');
            container.innerHTML += `<div class="menu-item-row"><span>${item[0]} (${item[1]}৳)</span><div class="controls"><button class="ctrl-btn" onclick="updateQty('${item[0]}', ${item[1]}, -1)">-</button> <span class="qty-display" id="${safeId}">0</span> <button class="ctrl-btn" onclick="updateQty('${item[0]}', ${item[1]}, 1)">+</button></div></div>`;
        });
    }
}

function updateQty(name, price, change) {
    const cur = orders[activeTabId];
    if (change > 0) {
        const rowId = "item-" + Date.now() + Math.floor(Math.random() * 1000);
        cur.cart[rowId] = { name: name, qty: 1, price: price, type: "Dine-in" };
    } else {
        const keys = Object.keys(cur.cart).filter(k => cur.cart[k].name === name);
        if (keys.length > 0) delete cur.cart[keys[keys.length - 1]];
    }
    refreshOrderUI();
}

function renderTabs() {
    const container = document.getElementById('active-order-tabs');
    if(!container) return;
    container.innerHTML = "";
    Object.keys(orders).forEach(id => {
        const div = document.createElement('div');
        div.className = `order-tab ${id == activeTabId ? 'active' : ''}`;
        div.innerHTML = `ট্যাব ${id} <span onclick="removeTab(event, ${id})">×</span>`;
        div.onclick = () => { activeTabId = id; renderTabs(); refreshOrderUI(); };
        container.appendChild(div);
    });
}

function addNewTab() { 
    const nextId = Math.max(...Object.keys(orders).map(Number)) + 1; 
    orders[nextId] = { cart: {}, total: 0, subtotal: 0, discount: 0, container: 0, delivery: 0 }; 
    activeTabId = nextId; renderTabs(); refreshOrderUI(); 
}

function removeTab(e, id) { 
    e.stopPropagation(); if (Object.keys(orders).length <= 1) return; 
    delete orders[id]; if (activeTabId == id) activeTabId = Object.keys(orders)[0]; 
    renderTabs(); refreshOrderUI(); 
}

// ৮. ড্যাশবোর্ড এবং টাইমার
function renderActiveDashboard() {
    const grid = document.getElementById('active-orders-grid');
    if(!grid) return;
    const history = JSON.parse(localStorage.getItem('momo_history')) || [];
    const activeOrders = history.filter(o => o.status === 'active');
    
    grid.innerHTML = activeOrders.length === 0 ? "<p style='text-align:center;'>No running orders</p>" : "";
    
    activeOrders.forEach((o) => {
        let itemsHtml = Object.values(o.items).map(item => `
            <div style="background:#f9f9f9; padding:5px; border-radius:5px; margin-bottom:3px; font-size:12px;">
                ${item.name} (${item.type})
            </div>
        `).join('');

        grid.innerHTML += `
            <div class="order-card" style="margin-bottom:15px; padding:15px; background:white; border-radius:10px; border-left:5px solid #ff4757;">
                <b>#${o.id} - Table: ${o.table}</b>
                <div style="margin:10px 0;">${itemsHtml}</div>
                <button onclick="markAsServed(${o.id})" style="width:100%; background:#2f3542; color:white; border:none; padding:8px; border-radius:5px;">অর্ডার কমপ্লিট</button>
            </div>`;
    });
}

function markAsServed(id) {
    db.ref(`momo_history/${id}/status`).set('completed');
}

// ৯. ইউটিলিটি এবং প্রিন্ট
function calcChange() {
    const cash = parseFloat(document.getElementById('cash')?.value) || 0;
    const diff = cash - orders[activeTabId].total;
    const display = document.getElementById('change');
    if (display) display.innerText = diff > 0 ? diff : 0;
}

function resetCurrentOrder() {
    orders[activeTabId] = { cart: {}, total: 0, subtotal: 0, discount: 0, container: 0, delivery: 0 };
    document.querySelectorAll('#discount, #container, #delivery, #cash, #table-no').forEach(el => el.value = "");
    refreshOrderUI();
}

function printReceipts(o) {
    const frame = document.getElementById('printFrame').contentWindow;
    let itemsHtml = Object.values(o.items).map(i => `<tr><td>${i.name}</td><td>1</td><td>${i.price}</td></tr>`).join('');
    const receipt = `<html><body style="font-family:monospace;width:210px;text-align:center;"><h2>MOMO HUT</h2><p>#${o.id} | ${o.date} ${o.time}</p><hr><table>${itemsHtml}</table><hr><p>Total: ${o.total} TK</p></body></html>`;
    frame.document.open(); frame.document.write(receipt); frame.document.close();
    frame.focus(); frame.print();
}

// ১০. সিকিউরিটি এবং শো পেজ
function checkSecurity() {
    const isLocked = localStorage.getItem('momo_locked') === 'true';
    if (isLocked && (localStorage.getItem('momo_user_mode') !== "Staff")) {
        document.getElementById('pin-overlay').style.display = 'flex';
    }
}

function applyUserRestrictions() {
    const isStaff = currentUserMode === "Staff";
    const allowed = ['active-dashboard', 'order-page', 'history-page'];
    document.querySelectorAll('.tab-btn, #mySidebar a').forEach(el => {
        const click = el.getAttribute('onclick') || "";
        if (click.includes('showPage')) {
            const isAllowed = allowed.some(p => click.includes(p));
            el.style.display = (isStaff && !isAllowed) ? "none" : "block";
        }
    });
}

function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active'); if (btn) btn.classList.add('active');
}

function openNav() { document.getElementById("mySidebar").style.width = "250px"; }
function closeNav() { document.getElementById("mySidebar").style.width = "0"; }
// লাইভ টাইমার আপডেট (প্রতি সেকেন্ডে)
setInterval(() => {
    const now = new Date().getTime();
    document.querySelectorAll('.timer-tag').forEach(t => {
        const endTime = t.getAttribute('data-end');
        const diff = endTime - now;
        if (diff > 0) {
            const m = Math.floor(diff / 60000), s = Math.floor((diff % 60000) / 1000);
            t.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        } else {
            t.innerText = "LATE"; t.style.color = "red";
        }
    });
}, 1000);
window.onload = init;
