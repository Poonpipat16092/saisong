const fs = require('fs');
const vm = require('vm');
const path = require('path');

// 1. โหลดโค้ดจาก index.html
const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (!scriptMatch) {
    console.error('❌ Could not find <script> tag in index.html');
    process.exit(1);
}

const script = scriptMatch[1] + 
  '\n; globalThis.state = state; globalThis.AUSPICIOUS_NUMBERS = AUSPICIOUS_NUMBERS; globalThis.calculate = calculate; globalThis.getAuspiciousIndex = getAuspiciousIndex; globalThis.renderBanknotes = renderBanknotes; globalThis.getClosenessText = getClosenessText;';

// 2. Mock DOM เพื่อให้รันใน Node.js ได้โดยไม่ต้องมี jsdom
const elements = {};
function getEl(id) {
    if (!elements[id]) {
        elements[id] = {
            textContent: '',
            className: '',
            innerHTML: '',
            value: 0,
            dataset: {},
            addEventListener: () => {},
            querySelectorAll: () => []
        };
    }
    return elements[id];
}

const context = {
    document: {
        getElementById: getEl,
        querySelectorAll: () => [],
        addEventListener: () => {}
    },
    console: console,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat
};

vm.createContext(context);
vm.runInContext(script, context);

// 3. Test Runner
const tests = [];
function test(name, fn) {
    try {
        fn();
        tests.push({ name, passed: true });
    } catch (err) {
        tests.push({ name, passed: false, error: err.message });
    }
}

// -------------------------------------------------------------
// Test Cases
// -------------------------------------------------------------

// 1. Auspicious numbers list has 25 items and has 3800, 4600
test('1. Auspicious numbers count is 25 (includes 3800, 4600)', () => {
    if (context.AUSPICIOUS_NUMBERS.length !== 25) throw new Error('Expected 25, got ' + context.AUSPICIOUS_NUMBERS.length);
    if (!context.AUSPICIOUS_NUMBERS.includes(3800)) throw new Error('Missing 3800');
    if (!context.AUSPICIOUS_NUMBERS.includes(4600)) throw new Error('Missing 4600');
});

// 2. Forbidden numbers (700, 1100, 1300, 1700, 1900) never in array
test('2. Forbidden numbers (700, 1100, 1300, 1700, 1900) never in auspicious list', () => {
    const forbidden = [700, 1100, 1300, 1700, 1900];
    for (const f of forbidden) {
        if (context.AUSPICIOUS_NUMBERS.includes(f)) throw new Error('Found forbidden number: ' + f);
    }
});

// 3. Test every integer from 100 to 12000 to verify getAuspiciousIndex always maps to allowed list
test('3. getAuspiciousIndex always returns an allowed auspicious number across wide range', () => {
    for (let val = 100; val <= 12000; val += 50) {
        const idx = context.getAuspiciousIndex(val);
        const mapped = context.AUSPICIOUS_NUMBERS[idx];
        if (!context.AUSPICIOUS_NUMBERS.includes(mapped)) {
            throw new Error('Mapped to unknown number: ' + mapped);
        }
    }
});

// 4. Default Case
test('4. Default configuration (Hotel 3-4, Single, Colleague, Income 45k) gives ฿1,200', () => {
    context.state.V = 1000;
    context.state.N = 1.0;
    context.state.R = 300;
    context.state.S = 1.0;
    context.state.I = 45000;
    context.state.P = 4.0;
    context.state.W = 1;
    context.state.H = 0;
    context.state.selectedTier = 'rec';
    context.calculate();
    
    const finalAmount = context.document.getElementById('finalAmount').textContent;
    const metricTarget = context.document.getElementById('metricTarget').textContent;
    const metricCap = context.document.getElementById('metricCap').textContent;
    const badge = context.document.getElementById('statusBadge').textContent.trim();
    
    if (finalAmount !== '฿1,200') throw new Error('Expected ฿1,200, got ' + finalAmount);
    if (metricTarget !== '฿1,300') throw new Error('Expected target ฿1,300, got ' + metricTarget);
    if (metricCap !== '฿1,800') throw new Error('Expected cap ฿1,800, got ' + metricCap);
    if (badge !== 'อยู่ในงบ') throw new Error('Expected อยู่ในงบ, got ' + badge);
});

// 5. Budget Cap Case (Low income, expensive 5-star venue)
test('5. Low income budget cap caps the final envelope correctly', () => {
    context.state.V = 1800;
    context.state.N = 1.8;
    context.state.R = 2500;
    context.state.S = 1.0;
    context.state.I = 20000; // 20k income
    context.state.P = 3.0;   // 3% budget = 600 THB max cap
    context.state.W = 1;
    context.state.H = 0;
    context.state.selectedTier = 'rec';
    context.calculate();
    
    const finalAmount = context.document.getElementById('finalAmount').textContent;
    const metricCap = context.document.getElementById('metricCap').textContent;
    if (metricCap !== '฿600') throw new Error('Expected cap ฿600, got ' + metricCap);
    if (finalAmount !== '฿600') throw new Error('Expected ฿600, got ' + finalAmount);
});

// 6. Historical gift reciprocity
test('6. Historical gift reciprocity (H=3000) forces floor to 3200 with correct badge', () => {
    context.state.H = 3000;
    context.state.V = 400; // cheap venue
    context.state.R = 0;   // acquaintance
    context.state.I = 15000; // even with low income, reciprocity takes precedence
    context.calculate();
    
    const finalAmount = context.document.getElementById('finalAmount').textContent;
    const badge = context.document.getElementById('statusBadge').textContent.trim();
    
    if (finalAmount !== '฿3,200') throw new Error('Expected ฿3,200, got ' + finalAmount);
    if (badge !== 'ยึดตามยอดใส่คืน') throw new Error('Expected ยึดตามยอดใส่คืน, got ' + badge);
});

// 7. Senior Boss Multiplier (S=1.3)
test('7. Senior boss multiplier (S=1.3) scales target up correctly', () => {
    context.state.H = 0;
    context.state.V = 1000;
    context.state.N = 1.0;
    context.state.R = 1000;
    context.state.S = 1.3;
    context.state.I = 100000;
    context.state.P = 5.0;
    context.calculate();
    // cTarget = (1000 + 1000) * 1.3 = 2600
    const finalAmount = context.document.getElementById('finalAmount').textContent;
    if (finalAmount !== '฿2,600') throw new Error('Expected ฿2,600, got ' + finalAmount);
});

// 8. Junior Multiplier (S=0.8)
test('8. Junior multiplier (S=0.8) scales target down correctly', () => {
    context.state.V = 1000;
    context.state.N = 1.0;
    context.state.R = 0;
    context.state.S = 0.8;
    context.state.H = 0;
    context.state.I = 50000;
    context.calculate();
    // cTarget = 1000 * 0.8 = 800
    const finalAmount = context.document.getElementById('finalAmount').textContent;
    if (finalAmount !== '฿800') throw new Error('Expected ฿800, got ' + finalAmount);
});

// 9. Tiers check (low, rec, high)
test('9. Tiers (ประหยัด, แนะนำ, ใจป้ำ) work properly', () => {
    context.state.V = 1000;
    context.state.N = 1.0;
    context.state.R = 300;
    context.state.S = 1.0;
    context.state.I = 45000;
    context.state.P = 4.0;
    context.calculate();
    
    const low = context.document.getElementById('tierLow').textContent;
    const rec = context.document.getElementById('tierRec').textContent;
    const high = context.document.getElementById('tierHigh').textContent;
    
    if (low !== '฿1,000') throw new Error('Expected low ฿1,000, got ' + low);
    if (rec !== '฿1,200') throw new Error('Expected rec ฿1,200, got ' + rec);
    if (high !== '฿1,500') throw new Error('Expected high ฿1,500, got ' + high);
});

// 10. Banknotes render check
test('10. Banknotes breakdown calculates correctly for ฿3,800', () => {
    context.renderBanknotes(3800);
    const html = context.document.getElementById('banknotes').innerHTML;
    if (!html.includes('฿1,000 × 3')) throw new Error('Expected 3x1000 notes');
    if (!html.includes('฿500 × 1')) throw new Error('Expected 1x500 note');
    if (!html.includes('฿100 × 3')) throw new Error('Expected 3x100 notes');
});

// 11. Closeness text mapping test
test('11. Closeness text mapping returns warm descriptive words', () => {
    if (context.getClosenessText(0) !== 'รู้จักทั่วไป') throw new Error('Failed at 0');
    if (context.getClosenessText(300) !== 'คุ้นเคย ทักทายบ่อย') throw new Error('Failed at 300');
    if (context.getClosenessText(1000) !== 'สนิท ปรึกษาได้') throw new Error('Failed at 1000');
    if (context.getClosenessText(2500) !== 'แก๊งเดียวกัน สนิทมาก') throw new Error('Failed at 2500');
    if (context.getClosenessText(3500) !== 'คนพิเศษ ซี้ปึ้กที่สุด') throw new Error('Failed at 3500');
});

// Output Summary
console.log('\n=========================================');
console.log('  SaiSong Calculation Test Suite');
console.log('=========================================');
tests.forEach(t => {
    console.log(`${t.passed ? '✅ PASS' : '❌ FAIL'}: ${t.name}`);
    if (!t.passed) {
        console.log('   Error:', t.error);
    }
});

const passedCount = tests.filter(t => t.passed).length;
console.log('=========================================');
console.log(`Results: ${passedCount}/${tests.length} tests passed.\n`);

if (passedCount !== tests.length) {
    process.exit(1);
}
