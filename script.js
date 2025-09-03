document.addEventListener('DOMContentLoaded', () => {
    // --- SERVICE WORKER REGISTRATION ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW registered.')).catch(err => console.log('SW registration failed:', err));
        });
    }

    // --- ALL VARIABLES AND DOM ELEMENTS ---
    const body = document.body;
    const appHeader = document.getElementById('app-header');
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const clickSound = document.getElementById('click-sound');

    const viewTitles = {
        'app-homescreen': 'Accounts Toolkit', 'view-calculator': 'Calculator', 'view-percentage': 'Percentage Tool',
        'view-new-ratio': 'New Profit Ratio', 'view-divider': 'Ratio Divider', 'view-journal': 'Journal Guide',
        'view-notes': 'Notes', 'view-notes-details': 'Notes', 'view-notes-custom': 'My Custom Notes'
    };

    // --- CORE APP LOGIC ---
    const playSound = () => { clickSound.currentTime = 0; clickSound.play().catch(e => {}); };
    const vibrate = () => { if (navigator.vibrate) navigator.vibrate(20); playSound(); };
    function handleScroll() { if (this.scrollTop > 10) appHeader.classList.add('header-scrolled'); else appHeader.classList.remove('header-scrolled'); }
    const showView = (viewId, params = {}) => {
        vibrate();
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById(viewId);
        if (view) { view.classList.add('active'); view.scrollTop = 0; view.addEventListener('scroll', handleScroll); }
        headerTitle.textContent = viewTitles[viewId] || 'Accounts Toolkit';
        headerSubtitle.style.display = viewId === 'app-homescreen' ? 'block' : 'none';
        body.dataset.activeView = viewId;
        if (viewId === 'view-notes-details') renderNoteDetails(params.category);
        if (viewId === 'view-notes-custom') renderCustomNotes();
    };
    document.querySelectorAll('[data-view]').forEach(icon => icon.addEventListener('click', (e) => { e.preventDefault(); showView(icon.closest('[data-view]').dataset.view); }));
    document.getElementById('back-button').addEventListener('click', () => {
        const currentView = body.dataset.activeView;
        if (currentView === 'view-notes-details' || currentView === 'view-notes-custom') showView('view-notes'); else showView('app-homescreen');
    });

    // --- NOTES LOGIC ---
    const USER_NOTES_KEY = 'acct_notes_user_v2', CUSTOM_NOTES_KEY = 'acct_custom_notes_v1';
    let userNotes = JSON.parse(localStorage.getItem(USER_NOTES_KEY)) || {};
    const defaultNotes = {
        "Final Accounts": {
            "Trading Account": { debit: ["To Opening Stock", "To Purchases\n   Less: Purchases Return", "To Carriage Inwards", "To Freight", "To Wages (Direct)", "To Power & Fuel", "To Factory Rent", "To Factory Lighting", "To Royalty (Production related)", "To Octroi & Import Duty", "To Manufacturing Expenses", "To Dock Charges", "To Clearing Charges", "To Motive Power", "To Gas, Water & Steam", "To Coal, Oil & Fuel", "To Productive Expenses", "To Direct Expenses"], credit: ["By Sales\n   Less: Sales Return", "By Closing Stock", "By Goods Sent on Consignment"] },
            "Profit & Loss Account": { debit: ["To Office Rent", "To Office Lighting", "To Office Expenses", "To Insurance", "To Salaries", "To Wages (Indirect)", "To Postage", "To Telephone Expenses", "To Telegram Expenses", "To Printing & Stationery", "To Trade Expenses", "To Travelling Expenses", "To Conveyance", "To Carriage Outwards", "To Advertisement", "To Discount Allowed", "To Bad Debts", "To Repairs", "To Depreciation", "To Interest Paid", "To Commission Allowed", "To Bank Charges", "To Legal Expenses", "To Selling Expenses", "To Distribution Expenses", "To Packing Charges", "To General Expenses", "To Net Profit c/d"], credit: ["By Gross Profit b/d", "By Discount Received", "By Bad Debts Recovered", "By Commission Received", "By Rent Received", "By Interest Received", "By Dividend Received", "By Profit on Sale of Asset", "By Net Loss c/d"] },
            "Balance Sheet": { liabilities: ["Capital\nAdd: Net Profit\nLess: Drawings", "Reserve & Surplus", "Loans (Long Term)", "Debentures", "Bills Payable", "Creditors", "Outstanding Expenses", "Bank Overdraft", "Provision for Taxation", "Proposed Dividend", "General Reserve", "Provision for Doubtful Debts", "Contingent Liabilities"], assets: ["Goodwill", "Patents", "Trademarks", "Copyright", "Buildings", "Plant & Machinery", "Furniture", "Investments", "Debtors\nLess: Provision for Doubtful Debts", "Bills Receivable", "Closing Stock", "Prepaid Expenses", "Outstanding Income", "Accrued Income", "Cash in Hand", "Cash at Bank", "Loose Tools", "Vehicles", "Land"] }
        },
        "NPO Final Accounts": {
            "Income & Expenditure A/c": { debit: ["To Salaries", "To Rent", "To Taxes", "To Printing & Stationery", "To Postage", "To Telephone Expenses", "To General Expenses", "To Repairs", "To Depreciation", "To Insurance", "To Wages", "To Audit Fees", "To Honorarium", "To Sports Material Consumed", "To Cultural Program Expenses", "To Match Expenses", "To Tournament Expenses", "To Library Expenses", "To Subscription Paid to Other Clubs", "To Prize Distributed", "To Conveyance Expenses", "To Entertainment Expenses", "To Loss on Sale of Asset", "To Miscellaneous Expenses", "To Surplus transferred to Capital Fund"], credit: ["By Subscriptions", "By Entrance Fees", "By Donations (Revenue)", "By Donations for General Purpose", "By Life Membership Fees (Revenue treatment if small)", "By Legacies", "By Interest Received", "By Dividend Received", "By Rent Received", "By Sale of Old Newspapers/Magazines", "By Sale of Sports Material", "By Profit on Sale of Asset", "By Receipts from Entertainment/Concert/Drama/Show", "By Sale of Tickets (Match/Function)", "By Locker Rent", "By Miscellaneous Income", "By Deficit transferred to Capital Fund"] },
            "Balance Sheet": { liabilities: ["Capital Fund / General Fund\nAdd: Surplus\nLess: Deficit", "Life Membership Fees (if treated as capital)", "Entrance Fees (if treated as capital)", "Legacies", "Building Fund", "Library Fund", "Sports Fund", "Prize Fund", "Endowment Fund", "Outstanding Expenses", "Creditors", "Subscription Received in Advance", "Loan", "Bank Overdraft"], assets: ["Cash in Hand", "Cash at Bank", "Investments", "Building", "Furniture", "Sports Material", "Library Books", "Fixed Deposits", "Debtors", "Subscriptions Outstanding", "Accrued Interest", "Outstanding Income", "Prepaid Expenses", "Stock of Stationery", "Stock of Sports Materials", "Stock of Medicines", "Musical Instruments", "Computers", "Vehicles"] }
        }
    };
    function saveUserNotes() { localStorage.setItem(USER_NOTES_KEY, JSON.stringify(userNotes)); }
    function renderNotesMenu() { const c = document.getElementById('notes-menu-container'); c.innerHTML = ''; Object.keys(defaultNotes).forEach(cat => { const i = document.createElement('div'); i.className = 'notes-menu-item'; i.textContent = cat; i.onclick = () => showView('view-notes-details', { category: cat }); c.appendChild(i); }); const ci = document.createElement('div'); ci.className = 'notes-menu-item'; ci.textContent = 'My Custom Notes'; ci.onclick = () => showView('view-notes-custom'); c.appendChild(ci); }
    function renderNoteDetails(cat) { const c = document.getElementById('notes-details-container'); c.innerHTML = ''; const d = defaultNotes[cat]; for (const sub in d) { const sc = document.createElement('div'); sc.className = 'notes-subcategory-card'; const sides = Object.keys(d[sub]); const isSide = ['balance sheet', 'trading account', 'profit & loss account', 'income & expenditure a/c'].some(t => sub.toLowerCase().includes(t)); let cols = sides.map(side => { const di = d[sub][side] || []; const ui = userNotes?.[cat]?.[sub]?.[side] || []; const li = di.map(i => `<li><span>${i.replace(/\n/g, '<br>&nbsp;&nbsp;')}</span></li>`).join(''); const uli = ui.map((i, idx) => `<li><span>${i.replace(/\n/g, '<br>&nbsp;&nbsp;')}</span><button class="delete-note-btn" data-category="${cat}" data-subcategory="${sub}" data-side="${side}" data-index="${idx}"><i class="ph-bold ph-trash"></i></button></li>`).join(''); let ht = side.charAt(0).toUpperCase() + side.slice(1); if (isSide) { ht += side === 'liabilities' || side === 'credit' ? ' (Cr.)' : ' (Dr.)'; } return `<div class="notes-column"><h4>${ht}</h4><ul class="notes-list">${li}${uli}</ul><form class="add-note-form" data-category="${cat}" data-subcategory="${sub}" data-side="${side}"><input type="text" placeholder="Add custom entry..." required><button type="submit" class="btn"><i class="ph-bold ph-plus"></i></button></form></div>`; }).join(''); sc.innerHTML = `<h3 class="notes-subcategory-title">${sub}</h3><div class="notes-columns-container ${isSide ? 'side-by-side' : ''}">${cols}</div>`; c.appendChild(sc); } }
    function renderCustomNotes() { const t = document.getElementById('custom-notes-textarea'); t.value = localStorage.getItem(CUSTOM_NOTES_KEY) || ''; t.oninput = () => localStorage.setItem(CUSTOM_NOTES_KEY, t.value); }
    document.getElementById('notes-details-container').addEventListener('submit', (e) => { if (e.target.classList.contains('add-note-form')) { e.preventDefault(); const i = e.target.querySelector('input'); const ni = i.value.trim(); if (!ni) return; const { category, subcategory, side } = e.target.dataset; if (!userNotes[category]) userNotes[category] = {}; if (!userNotes[category][subcategory]) userNotes[category][subcategory] = {}; if (!userNotes[category][subcategory][side]) userNotes[category][subcategory][side] = []; userNotes[category][subcategory][side].push(ni); saveUserNotes(); renderNoteDetails(category); i.value = ''; } });
    document.getElementById('notes-details-container').addEventListener('click', (e) => { const btn = e.target.closest('.delete-note-btn'); if (btn) { const { category, subcategory, side, index } = btn.dataset; userNotes[category][subcategory][side].splice(parseInt(index, 10), 1); saveUserNotes(); renderNoteDetails(category); } });
    
    // --- CALCULATOR LOGIC ---
    const [calcExpressionEl, calcPreviewEl, historyBtn, historyPanel] = [document.getElementById('calculator-expression'), document.getElementById('calculator-preview'), document.getElementById('history-btn'), document.getElementById('history-panel')];
    let currentExpression = '0';
    const CALC_HISTORY_KEY = 'acct_calc_history_v1';
    const safeEval = (expr) => { try { let s = expr.replace(/(\d*\.?\d+)%/g, '($1/100)'); return new Function('return ' + s)(); } catch { return ''; } };
    const formatForDisplay = (str) => str.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    const updateCalcDisplay = () => { calcExpressionEl.textContent = formatForDisplay(currentExpression.replace(/\*/g, '×')); let p = safeEval(currentExpression); calcPreviewEl.textContent = p !== '' ? `= ${formatForDisplay(parseFloat(p.toPrecision(15)).toString())}` : ''; };
    const renderHistory = () => { const h = (JSON.parse(localStorage.getItem(CALC_HISTORY_KEY)) || []).filter(i => Date.now() - i.time < 86400000); localStorage.setItem(CALC_HISTORY_KEY, JSON.stringify(h)); historyPanel.querySelector('ul').innerHTML = h.length ? h.map(item => `<li>${item.exp} = ${item.res}</li>`).join('') : '<li>No recent history</li>'; };
    document.getElementById('calculator-buttons').addEventListener('click', (e) => {
        const target = e.target.closest('.calc-btn');
        if (target) { 
            vibrate();
            const { value, action } = target.dataset;
            if (currentExpression === '0' && value && value !== '.') currentExpression = '';
            if (value) currentExpression += value;
            if (action === 'clear') currentExpression = '0';
            if (action === 'backspace') currentExpression = currentExpression.slice(0, -1) || '0';
            if (action === 'negate') { if (currentExpression !== '0') { currentExpression = currentExpression.startsWith('-') ? currentExpression.substring(1) : '-' + currentExpression; } }
            if (action === '=') {
                const r = safeEval(currentExpression);
                if (r !== '') {
                    const cr = parseFloat(r.toPrecision(15));
                    const h = JSON.parse(localStorage.getItem(CALC_HISTORY_KEY)) || [];
                    h.unshift({ exp: formatForDisplay(currentExpression.replace(/\*/g, '×')), res: formatForDisplay(cr.toString()), time: Date.now() });
                    localStorage.setItem(CALC_HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
                    currentExpression = cr.toString();
                }
            }
            updateCalcDisplay();
        }
    });
    historyBtn.addEventListener('click', (e) => { e.stopPropagation(); renderHistory(); historyPanel.style.display = historyPanel.style.display === 'block' ? 'none' : 'block'; });

    // --- OTHER TOOLS LOGIC ---
    const [percentMainEl, percentValEl, percentResultEl, addBtn, subBtn] = [document.getElementById('percent-main-number'), document.getElementById('percent-value'), document.getElementById('percent-result-box'), document.getElementById('percent-add'), document.getElementById('percent-subtract')];
    const calculatePercentage = (mode = '') => { const main = parseFloat(percentMainEl.value) || 0; let pNum = parseFloat(percentValEl.value || '0'); if (isNaN(pNum)) { return; } const pVal = main * (pNum / 100); if (mode === 'add') percentResultEl.innerHTML = `${main} + ${pNum}% = <strong>${parseFloat((main+pVal).toPrecision(15))}</strong>`; else if (mode === 'sub') percentResultEl.innerHTML = `${main} - ${pNum}% = <strong>${parseFloat((main-pVal).toPrecision(15))}</strong>`; else percentResultEl.innerHTML = `${pNum}% of ${main} is <strong>${parseFloat(pVal.toPrecision(15))}</strong>`; };
    [percentMainEl, percentValEl].forEach(el => el.addEventListener('input', () => calculatePercentage())); addBtn.addEventListener('click', () => calculatePercentage('add')); subBtn.addEventListener('click', () => calculatePercentage('sub'));
    const [oldRatioEl, newShareEl, newRatioResultEl] = [document.getElementById('admission-old-ratio'), document.getElementById('admission-new-share'), document.getElementById('admission-result-box')];
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const calculateNewRatio = () => { const op = oldRatioEl.value.split(':').map(p => parseInt(p.trim())).filter(p => p > 0 && !isNaN(p)); if (op.length === 0) { return; } let sv = newShareEl.value.trim() || '0'; let n = 0, d = 1; if (sv.endsWith('%')) { [n, d] = [parseFloat(sv), 100]; } else if (sv.includes('/')) { [n, d] = sv.split('/').map(p => parseFloat(p.trim())); } else { let v = parseFloat(sv); if (v >= 1) { [n, d] = [v, 100]; } else { [n, d] = [v, 1]; } } if (isNaN(n) || isNaN(d) || d === 0 || (n / d) <= 0 || (n / d) >= 1) { return; } const c = gcd(n, d); n /= c; d /= c; const rn = d - n; const os = op.reduce((a, b) => a + b, 0); let np = op.map(p => p * rn); np.push(os * n); const cf = np.reduce(gcd); const fr = np.map(p => p / cf); newRatioResultEl.innerHTML = `New Profit Ratio: <strong>${fr.join(' : ')}</strong>`; };
    [oldRatioEl, newShareEl].forEach(el => el.addEventListener('input', calculateNewRatio));
    const [splitterTotalEl, splitterRatioEl, splitterResultEl] = [document.getElementById('splitter-total'), document.getElementById('splitter-ratio'), document.getElementById('splitter-result-box')];
    const calculateRatioSplit = () => { const t = parseFloat(splitterTotalEl.value) || 0; const rp = splitterRatioEl.value.split(':').map(p => parseFloat(p.trim())).filter(p => p > 0 && !isNaN(p)); if (rp.length === 0) { return; } const sr = rp.reduce((a, b) => a + b, 0); if (sr === 0) { return; } splitterResultEl.innerHTML = "<ul>" + rp.map((p, i) => `<li>Partner ${i + 1}: <strong>${((t * p) / sr).toFixed(2)}</strong></li>`).join('') + "</ul>"; };
    [splitterTotalEl, splitterRatioEl].forEach(el => el.addEventListener('input', calculateRatioSplit));

    // --- JOURNAL GUIDE LOGIC ---
    const journalInput = document.getElementById('journal-input');
    const journalAnalyzeBtn = document.getElementById('journal-analyze-btn');
    const journalResultBox = document.getElementById('journal-result-box');
    const GOOGLE_API_KEY = "AIzaSyCxi_EXnglhol6fnVnzGP9LWcVhJTWyfQ0";
    async function getJournalEntryFromAI(transaction) { if (!GOOGLE_API_KEY) { return { error: "API Key not configured." }; } const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`; const prompt = `You are an expert accountant... Transaction: "${transaction}"`; try { const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }); if (!response.ok) { const errorData = await response.json(); throw new Error(`API Error: ${errorData.error.message}`); } const data = await response.json(); const textResponse = data.candidates[0].content.parts[0].text; const cleanJsonString = textResponse.replace(/```json|```/g, '').trim(); return JSON.parse(cleanJsonString); } catch (error) { return { error: `Failed to analyze. ${error.message}` }; } }
    function displayJournalResult(data) { if (data.error) { journalResultBox.innerHTML = `<p style="color: #ff4d4d;"><strong>Error:</strong> ${data.error}</p>`; return; } let tableHTML = `<p><strong>Analysis:</strong> ${data.analysis}</p><table id="journal-entry-table"><thead><tr><th>Particulars</th><th>Debit (₹)</th><th>Credit (₹)</th></tr></thead><tbody>`; let totalDebit = 0, totalCredit = 0; data.entries.forEach(entry => { const debitAmount = entry.debit ? parseFloat(entry.debit).toLocaleString('en-IN') : ''; const creditAmount = entry.credit ? parseFloat(entry.credit).toLocaleString('en-IN') : ''; tableHTML += `<tr><td>${entry.account}</td><td>${debitAmount}</td><td>${creditAmount}</td></tr>`; if(entry.debit) totalDebit += parseFloat(entry.debit); if(entry.credit) totalCredit += parseFloat(entry.credit); }); tableHTML += `</tbody><tfoot><tr><td style="font-weight: bold;">Total</td><td style="font-weight: bold;">${totalDebit.toLocaleString('en-IN')}</td><td style="font-weight: bold;">${totalCredit.toLocaleString('en-IN')}</td></tr></tfoot></table>`; journalResultBox.innerHTML = tableHTML; }
    journalAnalyzeBtn.addEventListener('click', async () => { const transaction = journalInput.value.trim(); if (!transaction) { alert("Please enter a transaction."); return; } journalResultBox.style.display = 'block'; journalResultBox.innerHTML = '<p>Analyzing with AI...</p>'; vibrate(); const result = await getJournalEntryFromAI(transaction); displayJournalResult(result); });

    // --- INITIAL APP STARTUP ---
    showView('app-homescreen');
    renderNotesMenu();
    updateCalcDisplay();
});
</script>
</body>
</html>