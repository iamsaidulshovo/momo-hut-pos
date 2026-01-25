/**
 * MOMO HUT POS - Fixed Script
 */

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
let mainChart = null;

function init() {
    // অ্যাপের অন্যান্য জিনিস লোড হওয়ার আগে সিকিউরিটি চেক করবে
    checkSecurity(); 
    
    // আপনার আগের কোডগুলো নিচে থাকবে
    renderMenu();
    renderTabs();
    const dateEl = document.getElementById('exp-date');
    if(dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    refreshOrderUI();
}

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

function refreshOrderUI() {
    const cur = orders[activeTabId];
    let sub = 0;
    const rowsContainer = document.getElementById('cart-rows');
    if(rowsContainer) rowsContainer.innerHTML = ""; // আগের লিস্ট পরিষ্কার করা

    // মেনু কার্ডে সব সংখ্যা ০ করা
    document.querySelectorAll('.qty-display').forEach(s => s.innerText = "0");

    // লুপিং এর মাধ্যমে প্রতিটি ইউনিক আইটেম রো তৈরি
    for (let id in cur.cart) {
        const item = cur.cart[id];
        sub += item.price;

        // মেনু কার্ডের সংখ্যা আপডেট
        const menuQtyEl = document.getElementById("qty-" + item.name.replace(/\s+/g, '-'));
        if (menuQtyEl) menuQtyEl.innerText = parseInt(menuQtyEl.innerText) + 1;

        // ডাইন-ইন/পার্সেল রো তৈরি (এটাই আপনার মেইন রিকোয়ারমেন্ট)
        if(rowsContainer) {
            rowsContainer.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:5px 0;">
                    <span style="font-size:12px; color:#333;">${item.name}</span>
                    <select onchange="updateItemType('${id}', this.value)" style="font-size:11px; padding:2px; border-radius:5px; border:1px solid #ff4757;">
                        <option value="Dine-in" ${item.type === 'Dine-in' ? 'selected' : ''}>🍽️ Dine</option>
                        <option value="Parcel" ${item.type === 'Parcel' ? 'selected' : ''}>📦 Parcel</option>
                    </select>
                </div>`;
        }
    }
    
    // আপনার বিদ্যমান ক্যালকুলেশন লজিক
    const d = document.getElementById('discount') ? parseFloat(document.getElementById('discount').value) || 0 : 0;
    const c = document.getElementById('container') ? parseFloat(document.getElementById('container').value) || 0 : 0;
    const dl = document.getElementById('delivery') ? parseFloat(document.getElementById('delivery').value) || 0 : 0;
    
    cur.subtotal = sub; 
    cur.total = (sub - d) + c + dl;
    
    if(document.getElementById('total')) document.getElementById('total').innerText = cur.total;
    if(document.getElementById('subtotal')) document.getElementById('subtotal').innerText = sub;
}

// সিলেক্ট করা টাইপ আপডেট করার নতুন ফাংশন (এটি script.js এর নিচে যোগ করুন)
function updateItemType(id, type) {
    orders[activeTabId].cart[id].type = type;
}

function updateQty(name, price, change) {
    const cur = orders[activeTabId];
    if (change > 0) {
        // প্রতিটি ক্লিকের জন্য একটি ইউনিক আইডি তৈরি করা
        const rowId = "item-" + Date.now() + Math.floor(Math.random() * 1000);
        cur.cart[rowId] = { name: name, qty: 1, price: price, type: "Dine-in" };
    } else {
        // মাইনাস চাপলে ওই নামের শেষ আইটেমটি খুঁজে ডিলিট করা
        const keys = Object.keys(cur.cart).filter(k => cur.cart[k].name === name);
        if (keys.length > 0) delete cur.cart[keys[keys.length - 1]];
    }
    refreshOrderUI();
}

function refreshOrderUI() {
    const cur = orders[activeTabId];
    let sub = 0;
    const rowsContainer = document.getElementById('cart-rows');
    
    // UI পরিষ্কার করা
    if (rowsContainer) rowsContainer.innerHTML = ""; 
    document.querySelectorAll('.qty-display').forEach(s => s.innerText = "0");

    // কার্ট থেকে ডাটা নিয়ে রো তৈরি
    for (let id in cur.cart) {
        const item = cur.cart[id];
        sub += item.price;

        // মেনু কার্ডে সংখ্যা আপডেট
        const menuQtyEl = document.getElementById("qty-" + item.name.replace(/\s+/g, '-'));
        if (menuQtyEl) menuQtyEl.innerText = parseInt(menuQtyEl.innerText) + 1;

        // ডাইন-ইন/পার্সেল রো জেনারেট করা
        if (rowsContainer) {
            rowsContainer.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:8px 0;">
                    <span style="font-size:13px; color:#2f3542;">${item.name}</span>
                    <select onchange="updateItemType('${id}', this.value)" style="font-size:12px; border:1px solid #ff4757; border-radius:5px;">
                        <option value="Dine-in" ${item.type === 'Dine-in' ? 'selected' : ''}>🍽️ Dine</option>
                        <option value="Parcel" ${item.type === 'Parcel' ? 'selected' : ''}>📦 Parcel</option>
                    </select>
                </div>`;
        }
    }

    // আপনার মেইন ক্যালকুলেশন লজিক
    const d = document.getElementById('discount') ? parseFloat(document.getElementById('discount').value) || 0 : 0;
    const c = document.getElementById('container') ? parseFloat(document.getElementById('container').value) || 0 : 0;
    const dl = document.getElementById('delivery') ? parseFloat(document.getElementById('delivery').value) || 0 : 0;
    
    cur.subtotal = sub; 
    cur.total = (sub - d) + c + dl;
    
    if(document.getElementById('subtotal')) document.getElementById('subtotal').innerText = sub;
    if(document.getElementById('total')) document.getElementById('total').innerText = cur.total;
    if(typeof calcChange === "function") calcChange();
}

// ✅ এক ক্লিকে সব আইটেম আপডেট করার নতুন ফাংশন
function bulkSetType(newType) {
    const cur = orders[activeTabId];
    if (Object.keys(cur.cart).length === 0) return;
    
    for (let id in cur.cart) {
        cur.cart[id].type = newType;
    }
    
    refreshOrderUI(); // পরিবর্তনগুলো স্ক্রিনে দেখানোর জন্য
}

// টাইপ আপডেট ফাংশন
function updateItemType(id, type) {
    if(orders[activeTabId].cart[id]) {
        orders[activeTabId].cart[id].type = type;
    }
}

// আইটেমের টাইপ (Dine/Parcel) আপডেট করার ফাংশন (script.js এর শেষে রাখুন)
function updateItemType(id, type) {
    orders[activeTabId].cart[id].type = type;
}

// ✅ ফিক্সড saveOrder ফাংশন (যেটি বাটন ঠিক করবে)
function saveOrder() {
    const cur = orders[activeTabId];
    if (!cur || Object.keys(cur.cart).length === 0) return alert("অর্ডার খালি!");

    const nameEl = document.getElementById('customer-name');
    const phoneEl = document.getElementById('customer-phone');
    const tableEl = document.getElementById('table-no');
    const prepTime = parseInt(document.getElementById('prep-time')?.value) || 15;

    const disc = parseFloat(document.getElementById('discount')?.value) || 0;
    const cont = parseFloat(document.getElementById('container')?.value) || 0;
    const deli = parseFloat(document.getElementById('delivery')?.value) || 0;

    // ১. প্রতিটি আইটেমের জন্য ডিফল্ট 'pending' স্ট্যাটাস যোগ করা
    const processedItems = JSON.parse(JSON.stringify(cur.cart));
    for (let id in processedItems) {
        processedItems[id].itemStatus = 'pending'; 
    }

    // ২. অর্ডার রেকর্ড তৈরি (নতুন ট্র্যাকিং ডাটা সহ)
    const record = { 
        id: orderID, 
        status: 'active', // এটি ড্যাশবোর্ডে অর্ডারটি দেখাবে
        table: tableEl?.value || "Takeaway",
        customerName: nameEl?.value || "Guest",
        customerPhone: phoneEl?.value || "N/A",
        items: processedItems, 
        total: cur.total, 
        subtotal: cur.subtotal,
        discount: disc,
        container: cont,
        delivery: deli,
        date: new Date().toISOString().split('T')[0], 
        time: new Date().toLocaleTimeString(),
        endTime: new Date().getTime() + (prepTime * 60000) // টাইমার সেট করা
    };

    // ৩. হিস্টোরি এবং লাস্ট আইডি সেভ করা
    let history = JSON.parse(localStorage.getItem('momo_history') || "[]");
    history.unshift(record);
    localStorage.setItem('momo_history', JSON.stringify(history));
    localStorage.setItem('momo_lastID', orderID++);
    
    // ৪. লয়্যালিটি পয়েন্ট আপডেট
    if (record.customerPhone !== "N/A") {
        updateCustomerLoyalty(record.customerPhone, record.customerName, record.total);
    }

    // ৫. প্রিন্ট এবং ক্লিয়ার করা
    printReceipts(record);
    resetCurrentOrder();
    
    // ড্যাশবোর্ড আপডেট করা
    if(typeof renderActiveDashboard === "function") renderActiveDashboard();
    
    alert("অর্ডার সফলভাবে সেভ হয়েছে!");
}

function updateCustomerLoyalty(phone, name, billAmount) {
    let customers = JSON.parse(localStorage.getItem('momo_customers') || "{}");
    if(!customers[phone]) customers[phone] = { name: name || "Unknown", points: 0 };
    
    // Proti 100 takay 5 point
    const earnedPoints = Math.floor(billAmount / 100) * 5;
    customers[phone].points += earnedPoints;
    customers[phone].name = name || customers[phone].name;
    
    localStorage.setItem('momo_customers', JSON.stringify(customers));
}

function printReceipts(o) {
    const frame = document.getElementById('printFrame').contentWindow;
    
    // Item list toiri
    let itemsHtml = Object.values(o.items).map(i => `
        <tr>
            <td align="left" style="padding: 2px 0;">${i.name}</td>
            <td align="center">1</td>
            <td align="right">${i.price}</td>
        </tr>
    `).join('');

    const customerReceipt = `
    <html>
    <head>
        <style>
            body { font-family: 'Courier New', Courier, monospace; width: 220px; text-align: center; font-size: 12px; margin: 0; padding: 10px; }
            h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
            .info { font-size: 11px; margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th { border-bottom: 1px dashed #000; padding-bottom: 3px; }
            .totals { text-align: right; margin-top: 8px; border-top: 1px dashed #000; padding-top: 5px; }
            .loyalty { font-size: 10px; margin-top: 10px; font-style: italic; }
            .footer { margin-top: 15px; font-size: 11px; border-top: 1px solid #000; padding-top: 5px; }
        </style>
    </head>
    <body>
        <h2>MOMO HUT</h2>
        <div class="info">
            Cumilla, Bangladesh<br>
            Order: #${o.id} | Table: ${o.table}<br>
            Date: ${o.date} | ${o.time}
        </div>
        <table>
            <thead>
                <tr><th align="left">Item</th><th align="center">Qty</th><th align="right">Price</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
            Subtotal: ${o.subtotal} TK<br>
            Discount: -${o.discount} TK<br>
            Charges: +${o.container + o.delivery} TK<br>
            <strong style="font-size: 14px;">Total: ${o.total} TK</strong>
        </div>
        <div class="loyalty">
            Customer: ${o.customerName}<br>
            * Points added for this purchase *
        </div>
        <div class="footer">
            THANK YOU FOR COMING!<br>
            Please visit again.
        </div>
    </body>
    </html>`;
    // KOT (Kitchen Copy) - Eta agey miss chilo
    let kotHtml = Object.values(o.items).map(i => `
        <div style="border-bottom:1px solid #000;padding:5px 0;text-align:left;">
            <b>${i.name}</b> <br> Type: ${i.type}
        </div>`).join('');

    const kitchenReceipt = `
    <html><body style="font-family:monospace;width:210px;font-size:14px;text-align:center;">
        <h2 style="margin:0;border-bottom:2px solid #000;">KITCHEN COPY</h2>
        <p><b>Order: #${o.id} | Table: ${o.table}</b></p>
        ${kotHtml}
        <p>${o.time}</p>
    </body></html>`;

    frame.document.open();
    frame.document.write(customerReceipt);
    frame.document.close();
    frame.focus();
    frame.print();

    setTimeout(() => {
        frame.document.open(); frame.document.write(kitchenReceipt); frame.document.close();
        frame.focus(); frame.print();
    }, 500);
    
}

function addExpense() {
    const date = document.getElementById('exp-date').value;
    const name = document.getElementById('exp-name').value;
    const qty = document.getElementById('exp-qty').value;
    const price = parseFloat(document.getElementById('exp-price').value);
    if(!date || !name || !price) return alert("সব তথ্য দিন!");
    let expenses = JSON.parse(localStorage.getItem('momo_expenses') || "[]");
    expenses.unshift({ date, name, qty, price });
    localStorage.setItem('momo_expenses', JSON.stringify(expenses));
    document.getElementById('exp-name').value = ""; document.getElementById('exp-qty').value = ""; document.getElementById('exp-price').value = "";
    renderExpenseList(date);
}

function renderExpenseList(d) {
    const expenses = JSON.parse(localStorage.getItem('momo_expenses') || "[]");
    const container = document.getElementById('today-expense-list');
    const totalBox = document.getElementById('today-expense-summary');
    let total = 0; container.innerHTML = "";
    expenses.filter(e => e.date === d).forEach(e => {
        total += e.price;
        container.innerHTML += `<div class="history-item" style="border-left-color:#ff4757"><b>${e.name} (${e.qty})</b><br>${e.price}৳</div>`;
    });
    if(totalBox) totalBox.innerText = `${d} তারিখের মোট খরচ: ${total}৳`;
}

function generateAdvancedReports() {
    const history = JSON.parse(localStorage.getItem('momo_history') || "[]");
    const expenses = JSON.parse(localStorage.getItem('momo_expenses') || "[]");
    const now = new Date(); const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(now.getDate() - 7);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const getSum = (arr, dateCond, field) => arr.filter(dateCond).reduce((a, b) => a + (b[field] || 0), 0);

    const sToday = getSum(history, o => o.date === today, 'total');
    const eToday = getSum(expenses, e => e.date === today, 'price');
    const sWeek = getSum(history, o => new Date(o.date) >= sevenDaysAgo, 'total');
    const eWeek = getSum(expenses, e => new Date(e.date) >= sevenDaysAgo, 'price');
    const sMonth = getSum(history, o => new Date(o.date) >= firstOfMonth, 'total');
    const eMonth = getSum(expenses, e => new Date(e.date) >= firstOfMonth, 'price');

    const statsEl = document.getElementById('stats-summary');
    if(statsEl) {
        statsEl.innerHTML = `
            <div class="stat-card"><h4>আজকের হিসাব</h4><p>বিক্রি: ${sToday}৳ | খরচ: ${eToday}৳</p><small>${today}</small></div>
            <div class="stat-card"><h4>সাপ্তাহিক হিসাব</h4><p>বিক্রি: ${sWeek}৳ | খরচ: ${eWeek}৳</p><small>গত ৭ দিন</small></div>
            <div class="stat-card"><h4>মাসিক হিসাব</h4><p>বিক্রি: ${sMonth}৳ | খরচ: ${eMonth}৳</p><small>চলতি মাস</small></div>
        `;
    }

    const chartData = {};
    for(let i=6; i>=0; i--) {
        let d = new Date(); d.setDate(d.getDate() - i); let ds = d.toISOString().split('T')[0];
        chartData[ds] = { s: getSum(history, o => o.date === ds, 'total'), e: getSum(expenses, e => e.date === ds, 'price') };
    }
    updateChart(chartData);
}

function updateChart(data) {
    const ctx = document.getElementById('mainChart');
    if(!ctx) return;
    if (mainChart) mainChart.destroy();
    mainChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(data).map(d => d.split('-')[2]),
            datasets: [{ label: 'বিক্রি', data: Object.values(data).map(x => x.s), backgroundColor: '#2ed573' }, { label: 'খরচ', data: Object.values(data).map(x => x.e), backgroundColor: '#ff4757' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function showCustomReport() {
    const date = document.getElementById('search-date').value;
    if(!date) return;
    const history = JSON.parse(localStorage.getItem('momo_history') || "[]");
    const expenses = JSON.parse(localStorage.getItem('momo_expenses') || "[]");
    const s = history.filter(o => o.date === date).reduce((a, b) => a + b.total, 0);
    const e = expenses.filter(ex => ex.date === date).reduce((a, b) => a + b.price, 0);
    document.getElementById('custom-report-result').innerHTML = `<div class="stat-card" style="border-left-color:#2f3542"><b>তারিখ: ${date}</b><br>বিক্রি: ${s}৳ | খরচ: ${e}৳<hr><b>লাভ: ${s - e}৳</b></div>`;
}

function filterMenu() {
    const term = document.getElementById('menu-search-input').value.toLowerCase();
    document.querySelectorAll('.menu-item-row').forEach(row => row.style.display = row.innerText.toLowerCase().includes(term) ? "flex" : "none");
}

function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active'); btn.classList.add('active');
    if(id === 'expense-page') renderExpenseList(document.getElementById('exp-date').value);
    if(id === 'history-page') loadHistory();
    if(id === 'report-page') generateAdvancedReports();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('momo_history') || "[]");
    const list = document.getElementById('history-list'); const today = new Date().toISOString().split('T')[0];
    let total = 0; list.innerHTML = "";
    history.forEach(o => {
        if(o.date === today) total += o.total;
        list.innerHTML += `<div class="history-item"><b>#${o.id}</b> - ${o.time}<br>মোট: ${o.total}৳<br><small>${Object.keys(o.items).join(', ')}</small></div>`;
    });
    document.getElementById('today-total-display').innerText = total;
}

function renderTabs() {
    const container = document.getElementById('active-order-tabs'); container.innerHTML = "";
    Object.keys(orders).forEach(id => {
        const div = document.createElement('div'); div.className = `order-tab ${id == activeTabId ? 'active' : ''}`;
        div.innerHTML = `ট্যাব ${id} <span onclick="removeTab(event, ${id})">×</span>`;
        div.onclick = () => { activeTabId = id; renderTabs(); refreshOrderUI(); }; container.appendChild(div);
    });
}
function addNewTab() { const nextId = Math.max(...Object.keys(orders).map(Number)) + 1; orders[nextId] = { cart: {}, total: 0, subtotal: 0, discount: 0, container: 0, delivery: 0 }; activeTabId = nextId; renderTabs(); refreshOrderUI(); }
function removeTab(e, id) { e.stopPropagation(); if (Object.keys(orders).length <= 1) return; delete orders[id]; if (activeTabId == id) activeTabId = Object.keys(orders)[0]; renderTabs(); refreshOrderUI(); }
function setCash(v) { document.getElementById('cash').value = v; calcChange(); }
function calcChange() { const p = parseFloat(document.getElementById('cash').value) || 0; const diff = p - orders[activeTabId].total; document.getElementById('change').innerText = diff > 0 ? diff : 0; }
function resetCurrentOrder() {
    orders[activeTabId] = { cart: {}, total: 0, subtotal: 0, discount: 0, container: 0, delivery: 0 };
    if(document.getElementById('discount')) document.getElementById('discount').value = 0;
    if(document.getElementById('container')) document.getElementById('container').value = 0;
    if(document.getElementById('delivery')) document.getElementById('delivery').value = 0;
    if(document.getElementById('cash')) document.getElementById('cash').value = "";
    if(document.getElementById('table-no')) document.getElementById('table-no').value = "";
    refreshOrderUI();
}

function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
}

// Tomar existing showPage function er bitore closeNav() add kore nio jate page select korle menu bondho hoy.

// ১. অর্ডার সেভ করার সময় টাইমার ডেটা যুক্ত করা
// আপনার saveOrder() ফাংশনের ভেতর record অবজেক্টে নিচের লাইনটি যোগ করুন:
// record.endTime = new Date().getTime() + (15 * 60000); // ১৫ মিনিট ডিফল্ট

// ২. ড্যাশবোর্ড রেন্ডার করার ফাংশন
function renderActiveDashboard() {
    const grid = document.getElementById('active-orders-grid');
    const history = JSON.parse(localStorage.getItem('momo_history')) || [];
    const activeOrders = history.filter(o => !o.status || o.status === 'active').slice(0, 6);
    
    grid.innerHTML = "";
    activeOrders.forEach(o => {
        // যদি আপনার কোডে endTime না থাকে তবে ১০ মিনিট ডিফল্ট ধরে টাইমার দেখাবে
        const endTime = o.endTime || (new Date(o.date + " " + o.time).getTime() + 10 * 60000);
        
        grid.innerHTML += `
            <div class="stat-card" style="margin-bottom:10px; border-left:5px solid #2ed573;">
                <div style="display:flex; justify-content:space-between;">
                    <strong>#${o.id} - Table: ${o.table || 'N/A'}</strong>
                    <span class="live-timer" data-end="${endTime}" style="color:#ff4757; font-weight:bold;">00:00</span>
                </div>
                <p style="font-size:12px; margin:5px 0;">Items: ${Object.keys(o.items).join(', ')}</p>
            </div>`;
    });
}

// ৩. লাইভ টাইমার আপডেট করার লজিক
setInterval(function() {
    document.querySelectorAll('.live-timer').forEach(timer => {
        const endTime = parseInt(timer.getAttribute('data-end'));
        const now = new Date().getTime();
        const diff = endTime - now;

        if (diff > 0) {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timer.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        } else {
            timer.innerText = "LATE / READY";
            timer.style.color = "red";
        }
    });
}, 1000);

// ৪. showPage ফাংশনে নিচের লাইনটি যোগ করুন
// if(id === 'active-dashboard') renderActiveDashboard();
function clearHistory() { if(confirm("মুছবেন?")) { localStorage.clear(); location.reload(); } }
// ড্যাশবোর্ড রেন্ডার ফাংশন
function renderActiveDashboard() {
    const grid = document.getElementById('active-orders-grid');
    const history = JSON.parse(localStorage.getItem('momo_history')) || [];
    // শুধু 'active' স্ট্যাটাস অর্ডারগুলো দেখাবে
    const activeOrders = history.filter(o => o.status === 'active');
    
    grid.innerHTML = activeOrders.length === 0 ? "<p style='text-align:center;'>No running orders</p>" : "";
    
    activeOrders.forEach((o) => {
        let itemsHtml = "";
        
        // প্রতিটি আইটেমের জন্য আলাদা চেক বক্স এবং স্ট্যাটাস তৈরি
        for (let itemId in o.items) {
            const item = o.items[itemId];
            const isDone = item.itemStatus === 'served';
            
            itemsHtml += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:${isDone ? '#d1fadf' : '#fff'}; padding:8px; border-radius:8px; margin-bottom:5px; border:1px solid #eee;">
                    <span style="font-size:13px; ${isDone ? 'text-decoration:line-through; color:gray;' : 'color:#2f3542; font-weight:bold;'}">
                        ${item.name} (${item.type})
                    </span>
                    ${!isDone ? 
                        `<button onclick="markItemServed(${o.id}, '${itemId}')" style="background:#2ed573; color:white; border:none; padding:4px 10px; border-radius:5px; cursor:pointer; font-size:11px;">Done</button>` 
                        : '<span style="color:#12b76a; font-weight:bold;">✅</span>'}
                </div>`;
        }

        grid.innerHTML += `
            <div class="order-card" style="border-left: 6px solid #ff4757; margin-bottom:20px; padding:15px; background:white; border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <b style="font-size:16px;">#${o.id} - Table: ${o.table || 'N/A'}</b>
                    <span class="timer-tag" data-end="${o.endTime}" style="background:#f1f2f6; padding:3px 8px; border-radius:6px; font-weight:bold;">--:--</span>
                </div>
                <div style="margin-top:10px;">${itemsHtml}</div>
                <button onclick="markAsServed(${o.id})" style="width:100%; margin-top:12px; background:#2f3542; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:14px;">
                    পুরো অর্ডার কমপ্লিট
                </button>
            </div>`;
    });
}

// আলাদা আইটেম মার্ক করার নতুন ফাংশন
function markItemServed(orderId, itemId) {
    let history = JSON.parse(localStorage.getItem('momo_history')) || [];
    const orderIdx = history.findIndex(o => o.id == orderId);
    
    if (orderIdx !== -1) {
        if (!history[orderIdx].items[itemId]) return;
        history[orderIdx].items[itemId].itemStatus = 'served'; 
        localStorage.setItem('momo_history', JSON.stringify(history));
        renderActiveDashboard(); // ড্যাশবোর্ড আপডেট
    }
}

// অর্ডার কমপ্লিট করার ফাংশন
function markAsServed(id) {
    let history = JSON.parse(localStorage.getItem('momo_history')) || [];
    const idx = history.findIndex(o => o.id == id);
    if (idx !== -1) {
        history[idx].status = 'completed'; // ড্যাশবোর্ড থেকে সরিয়ে দেওয়া
        localStorage.setItem('momo_history', JSON.stringify(history));
        renderActiveDashboard();
    }
}

// টাইমার আপডেট লজিক
setInterval(() => {
    const now = new Date().getTime();
    document.querySelectorAll('.timer-tag').forEach(t => {
        const diff = t.getAttribute('data-end') - now;
        if (diff > 0) {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            t.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
        } else {
            t.innerText = "LATE";
            t.style.color = "red";
        }
    });
    const clock = document.getElementById('live-clock');
    if(clock) clock.innerText = new Date().toLocaleTimeString();
}, 1000);

// showPage ফাংশন আপডেট (Active Dashboard এর জন্য)
// ✅ আপডেটেড showPage ফাংশন (স্টাফ লিস্ট সাপোর্ট সহ)
function showPage(id, btn) {
    // সব পেজ এবং বাটন থেকে 'active' ক্লাস সরানো
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // সিলেক্ট করা পেজটি দেখানো
    const targetPage = document.getElementById(id);
    if (targetPage) targetPage.classList.add('active');
    
    // যদি বাটন থাকে তবে সেটিকে হাইলাইট করা
    if (btn) btn.classList.add('active');

    // পেজ অনুযায়ী ডাটা লোড করা
    if (id === 'expense-page') renderExpenseList(document.getElementById('exp-date').value);
    if (id === 'history-page') loadHistory();
    if (id === 'report-page') generateAdvancedReports();
    
    // নতুন যোগ করা: স্টাফ লিস্ট পেজে গেলে লিস্ট রিফ্রেশ হবে
    if (id === 'staff-list-page') renderStaffNameList();
}

// Eita active-dashboard ba kitchen ticket-e parcel track korbe
function setOrderType(rowId, type) {
    const cur = orders[activeTabId];
    if (cur.cart[rowId]) {
        cur.cart[rowId].type = type;
    }
}
// সব আইটেম একসাথে আপডেট করার ফাংশন
function bulkSetType(newType) {
    const cur = orders[activeTabId];
    if (Object.keys(cur.cart).length === 0) return;
    
    // কার্টের সব আইটেমের টাইপ লুপ করে বদলে দেওয়া
    for (let id in cur.cart) {
        cur.cart[id].type = newType;
    }
    
    // UI রিফ্রেশ করা যাতে পরিবর্তন দেখা যায়
    refreshOrderUI();
}
function checkLoyalty() {
    const phone = document.getElementById('customer-phone').value;
    const statusEl = document.getElementById('customer-status');
    const infoEl = document.getElementById('loyalty-info');
    const nameEl = document.getElementById('customer-name');

    if (phone.length < 11) {
        statusEl.innerText = "New Customer";
        statusEl.style.background = "#eee";
        infoEl.innerText = "";
        return;
    }

    const customers = JSON.parse(localStorage.getItem('momo_customers') || "{}");
    if (customers[phone]) {
        statusEl.innerText = "Existing Customer";
        statusEl.style.background = "#d1fadf"; // Greenish
        statusEl.style.color = "#12b76a";
        infoEl.innerText = "Points: " + customers[phone].points;
        nameEl.value = customers[phone].name;
    } else {
        statusEl.innerText = "New Customer";
        statusEl.style.background = "#fee4e2"; // Reddish
        statusEl.style.color = "#f04438";
        infoEl.innerText = "Points: 0";
    }
}
let currentViewStaffId = null;

// ১. স্টাফ লিস্ট রেন্ডার করা (Sidebar বা Page থেকে দেখলে)
function renderStaffNameList() {
    const staffs = JSON.parse(localStorage.getItem('momo_staff_data') || "[]");
    const container = document.getElementById('staff-name-list');
    if (!container) return;
    container.innerHTML = "";
    
    staffs.forEach(s => {
        container.innerHTML += `
            <div class="history-item" onclick="openStaffPage(${s.id})" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                    <b style="font-size:16px;">${s.name}</b><br>
                    <small style="color:#666;">${s.post}</small>
                </div>
                <span style="color:#007bff; font-weight:bold;">View Sheet ⮕</span>
            </div>`;
    });
}

// ২. নতুন স্টাফ প্রোফাইল তৈরি করা
function addNewStaffProfile() {
    const name = document.getElementById('new-staff-name').value;
    const post = document.getElementById('new-staff-post').value;
    const email = document.getElementById('new-staff-email').value;
    
    if (!name || !email) return alert("দয়া করে নাম এবং ইমেইল দিন!");
    
    let staffs = JSON.parse(localStorage.getItem('momo_staff_data') || "[]");
    staffs.push({
        id: Date.now(),
        name: name,
        post: post,
        email: email,
        sheet: {} // এখানে হাজিরা ডাটা জমা থাকবে
    });
    
    localStorage.setItem('momo_staff_data', JSON.stringify(staffs));
    
    // ইনপুট বক্স ক্লিয়ার করা
    document.getElementById('new-staff-name').value = "";
    document.getElementById('new-staff-post').value = "";
    document.getElementById('new-staff-email').value = "";
    
    renderStaffNameList();
    alert("নতুন স্টাফ সফলভাবে যোগ হয়েছে!");
}

// ৩. ব্যক্তিগত এডিটেবল শিট ওপেন করা
function openStaffPage(id) {
    currentViewStaffId = id;
    const staffs = JSON.parse(localStorage.getItem('momo_staff_data') || "[]");
    const staff = staffs.find(s => s.id === id);
    
    document.getElementById('display-staff-name').innerText = staff.name;
    document.getElementById('display-staff-post').innerText = "Position: " + staff.post;
    
    const tbody = document.getElementById('staff-monthly-sheet');
    if (!tbody) return;
    tbody.innerHTML = "";
    
    // চলতি মাসের দিন সংখ্যা বের করা
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        let dayData = staff.sheet?.[i] || {status:'', in:'', out:'', break:'', note:''};
        
        tbody.innerHTML += `
            <tr>
                <td style="border:1px solid #ddd; background:#f1f2f6; font-weight:bold;">${i}</td>
                <td style="border:1px solid #ddd; padding:0;"><input type="text" class="sheet-input" oninput="updateSheet(${i}, 'status', this.value)" value="${dayData.status || ''}"></td>
                <td style="border:1px solid #ddd; padding:0;"><input type="text" class="sheet-input" oninput="updateSheet(${i}, 'in', this.value)" value="${dayData.in || ''}"></td>
                <td style="border:1px solid #ddd; padding:0;"><input type="text" class="sheet-input" oninput="updateSheet(${i}, 'out', this.value)" value="${dayData.out || ''}"></td>
                <td style="border:1px solid #ddd; padding:0;"><input type="text" class="sheet-input" oninput="updateSheet(${i}, 'break', this.value)" value="${dayData.break || ''}"></td>
                <td style="border:1px solid #ddd; padding:0;"><input type="text" class="sheet-input" oninput="updateSheet(${i}, 'note', this.value)" value="${dayData.note || ''}"></td>
            </tr>`;
    }
    showPage('staff-detail-page');
}

// ৪. শিটের ডাটা অটো-সেভ করা
function updateSheet(day, field, val) {
    let staffs = JSON.parse(localStorage.getItem('momo_staff_data') || "[]");
    let idx = staffs.findIndex(s => s.id === currentViewStaffId);
    
    if (!staffs[idx].sheet) staffs[idx].sheet = {};
    if (!staffs[idx].sheet[day]) staffs[idx].sheet[day] = {};
    
    staffs[idx].sheet[day][field] = val;
    localStorage.setItem('momo_staff_data', JSON.stringify(staffs));
}

// ৫. স্টাফ প্রোফাইল ডিলিট করা
function deleteStaffProfile() {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই প্রোফাইলটি মুছে ফেলতে চান?")) return;
    
    let staffs = JSON.parse(localStorage.getItem('momo_staff_data') || "[]");
    staffs = staffs.filter(s => s.id !== currentViewStaffId);
    
    localStorage.setItem('momo_staff_data', JSON.stringify(staffs));
    showPage('staff-list-page');
    renderStaffNameList();
}

// ৬. সম্পূর্ণ শিট ইমেইল করা
function sendStaffEmail() {
    const staffs = JSON.parse(localStorage.getItem('momo_staff_data') || "[]");
    const staff = staffs.find(s => s.id === currentViewStaffId);
    
    if (!staff.sheet || Object.keys(staff.sheet).length === 0) {
        return alert("শিটে কোনো ডাটা নেই!");
    }

    let body = `Momo Hut - Attendance Report: ${staff.name} (${staff.post})\n\n`;
    body += `Date | Status | In | Out | Break | Note\n`;
    body += `-------------------------------------------\n`;
    
    Object.keys(staff.sheet).sort((a,b) => a-b).forEach(day => {
        let d = staff.sheet[day];
        body += `${day} | ${d.status || '-'} | ${d.in || '-'} | ${d.out || '-'} | ${d.break || '-'} | ${d.note || '-'}\n`;
    });

    window.location.href = `mailto:${staff.email}?subject=Monthly Attendance Sheet&body=${encodeURIComponent(body)}`;
}
// --- SUPER SONIC SECURITY SYSTEM ---

// ১. পিন কনফিগারেশন (লোকাল স্টোরেজ থেকে লোড হবে, না থাকলে ডিফল্ট ১২৩৪)
let ADMIN_PIN = localStorage.getItem('momo_admin_pin') || "2025"; 
let isLocked = localStorage.getItem('momo_locked') === 'true';

// ২. সিস্টেম লক এবং আনলক লজিক
function checkSecurity() {
    if (isLocked) {
        document.getElementById('pin-overlay').style.display = 'flex';
    }
}

function lockSystem() {
    isLocked = true;
    localStorage.setItem('momo_locked', 'true');
    document.getElementById('pin-overlay').style.display = 'flex';
}

function unlockSystem() {
    const input = document.getElementById('admin-pin-input').value;
    if (input === ADMIN_PIN) {
        isLocked = false;
        localStorage.setItem('momo_locked', 'false');
        document.getElementById('pin-overlay').style.display = 'none';
        document.getElementById('admin-pin-input').value = ""; // ক্লিয়ার ইনপুট
    } else {
        alert("ভুল পিন! প্রবেশাধিকার সংরক্ষিত।");
        document.getElementById('admin-pin-input').value = "";
    }
}

// ৩. গুরুত্বপূর্ণ কাজের আগে পিন ভেরিফিকেশন
function verifyAction(callback) {
    const pin = prompt("অ্যাডমিন পিন কোডটি দিন:");
    if (pin === ADMIN_PIN) {
        callback();
    } else {
        alert("ভুল পিন! এই কাজটি করার অনুমতি নেই।");
    }
}

// ৪. অ্যাডমিন পিন পরিবর্তনের সিস্টেম
function changeAdminPin() {
    const currentPinInput = prompt("বর্তমান পিনটি দিন:");
    
    if (currentPinInput === ADMIN_PIN) {
        const newPin = prompt("নতুন ৪ ডিজিটের পিন কোডটি লিখুন:");
        
        if (newPin && newPin.length === 4 && !isNaN(newPin)) {
            const confirmPin = prompt("নিশ্চিত করতে নতুন পিনটি পুনরায় লিখুন:");
            
            if (newPin === confirmPin) {
                ADMIN_PIN = newPin;
                localStorage.setItem('momo_admin_pin', newPin); // নতুন পিন স্থায়ীভাবে সেভ
                alert("পিন সফলভাবে পরিবর্তন হয়েছে! ✅");
            } else {
                alert("পিন ম্যাচ করেনি!");
            }
        } else {
            alert("ভুল ফরম্যাট! ৪টি সংখ্যা ব্যবহার করুন।");
        }
    } else {
        alert("ভুল পিন!");
    }
}

// ৫. ডিলিট এবং ক্লিয়ার ফাংশনগুলোর সুরক্ষা নিশ্চিত করা
const originalClearHistory = clearHistory;
clearHistory = function() {
    verifyAction(() => originalClearHistory());
};

const originalDeleteStaff = deleteStaffProfile;
deleteStaffProfile = function() {
    verifyAction(() => originalDeleteStaff());
};

// ৬. ইনিশিয়ালাইজেশন চেক
const baseInit = init;
init = function() {
    baseInit();
    checkSecurity();
};
function checkSecurity() {
    // অ্যাপ ওপেন হলেই স্ক্রিন লক দেখাবে
    document.getElementById('pin-overlay').style.display = 'flex';
    localStorage.setItem('momo_locked', 'true'); // এটি অ্যাপের লক স্ট্যাটাস সেভ রাখবে
}
// ১. ইউজার মোড কনফিগারেশন
let currentUserMode = localStorage.getItem('momo_user_mode') || "Admin"; // ডিফল্ট অ্যাডমিন

function applyUserRestrictions() {
    const isStaff = currentUserMode === "Staff";
    const modeDisplay = document.getElementById('current-mode-display');
    if(modeDisplay) modeDisplay.innerText = currentUserMode;

    // ১. অনুমোদিত পেজগুলোর লিস্ট
    const allowedStaffPages = ['active-dashboard', 'order-page', 'history-page']; 
    
    // ২. সাইডবার লিঙ্ক কন্ট্রোল
    const sidebarLinks = document.querySelectorAll('#mySidebar a');
    sidebarLinks.forEach(link => {
        const onClickAttr = link.getAttribute('onclick') || "";
        
        // শুধু 'showPage' ফাংশন আছে এমন লিঙ্কগুলো চেক করা
        if (onClickAttr.includes('showPage')) {
            const isAllowed = allowedStaffPages.some(pageId => onClickAttr.includes(pageId));
            
            if (isStaff && !isAllowed) {
                link.style.display = "none"; // স্টাফ মোডে নিষিদ্ধ লিঙ্ক লুকিয়ে ফেলা
            } else {
                link.style.display = "block"; // অ্যাডমিন মোডে সব দেখানো
            }
        }
    });

    // ৩. মেইন ড্যাশবোর্ড বা নেভিগেশন ট্যাব কন্ট্রোল
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick') || "";
        const isAllowed = allowedStaffPages.some(pageId => onClickAttr.includes(pageId));
        
        if (isStaff && !isAllowed) {
            btn.style.display = "none"; 
        } else {
            btn.style.display = "block";
        }
    });

    // ৪. নিষিদ্ধ পেজে থাকলে অটোমেটিক 'order-page' এ পাঠিয়ে দেওয়া
    const activePage = document.querySelector('.page.active');
    if (isStaff && activePage) {
        if (!allowedStaffPages.includes(activePage.id)) {
            showPage('order-page'); 
        }
    }
}

// ২. মোড পরিবর্তন করার ফাংশন
function switchUserMode() {
    if (currentUserMode === "Admin") {
        // অ্যাডমিন থেকে স্টাফে যেতে কোনো পিন লাগবে না
        currentUserMode = "Staff";
        localStorage.setItem('momo_user_mode', "Staff");
        alert("এখন আপনি Staff Mode-এ আছেন।");
    } else {
        // স্টাফ থেকে অ্যাডমিনে ফিরতে পিন লাগবে
        const pin = prompt("অ্যাডমিন পিন দিন:");
        if (pin === (localStorage.getItem('momo_admin_pin') || "2025")) {
            currentUserMode = "Admin";
            localStorage.setItem('momo_user_mode', "Admin");
            alert("Welcome back, Admin!");
        } else {
            alert("ভুল পিন! আপনি অ্যাডমিন হতে পারবেন না।");
        }
    }
    applyUserRestrictions();
}

// ৩. ইনিশিয়ালাইজেশন আপডেট
const baseInitWithUser = init;
init = function() {
    baseInitWithUser();
    applyUserRestrictions();
};
init();
