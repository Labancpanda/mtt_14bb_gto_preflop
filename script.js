document.addEventListener('DOMContentLoaded', () => {
    let masterStrategyData = {};
    const generateBtn = document.getElementById('generate-btn');
    const chartContainer = document.getElementById('chart-container');
    const inputFields = document.querySelectorAll('.hand-input-field');

    generateBtn.disabled = true;
    generateBtn.style.cursor = 'not-allowed';
    generateBtn.style.backgroundColor = '#5c6168';
    generateBtn.textContent = 'Adatbázis betöltése...';

    const positions = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BU'];
    const colors = { 'All-in': '#8b0000', 'Raise': '#f08080', 'Fold': '#add8e6' };
    const actionOrder = ['All-in', 'Raise', 'Fold'];

    // --- ÚJ FUNKCIÓ: A bevitel normalizálása ---
    function normalizeHandInput(handStr) {
        if (!handStr || handStr.length < 2 || handStr.length > 3) {
            return handStr; // Visszaadja az eredetit, ha a formátum nem stimmel
        }
        if (handStr.length === 2) {
            return handStr.toUpperCase(); // Pl. '88'
        }
        // Pl. 'kqo' -> 'KQo' vagy 'aJs' -> 'AJs'
        const ranks = handStr.substring(0, 2).toUpperCase();
        const suit = handStr.substring(2).toLowerCase();
        return ranks + suit;
    }

    // Adatbázis betöltése
    fetch('strategy_database.json')
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
        .then(data => {
            masterStrategyData = data;
            console.log('Strategy database loaded successfully.');
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
            generateBtn.style.backgroundColor = '#43b581';
            generateBtn.textContent = 'Ábra generálása';
        })
        .catch(error => {
            console.error('Error loading strategy database:', error);
            chartContainer.innerHTML = `<p style="color: #f04747; text-align: center;">HIBA: Az adatbázis ('strategy_database.json') nem tölthető be.</p>`;
            generateBtn.textContent = 'Hiba az adatbázisban';
        });

    function generateChart(hands) {
        chartContainer.innerHTML = '';
        if (hands.length === 0) return;

        chartContainer.appendChild(document.createElement('div'));
        positions.forEach(pos => {
            const header = document.createElement('div');
            header.className = 'chart-header';
            header.textContent = pos;
            chartContainer.appendChild(header);
        });

        hands.forEach(hand => {
            const handLabel = document.createElement('div');
            handLabel.className = 'hand-label';
            handLabel.textContent = hand;
            chartContainer.appendChild(handLabel);
            
            positions.forEach(pos => {
                const cell = document.createElement('div');
                cell.className = 'chart-cell';
                const freqs = masterStrategyData[hand]?.[pos] || [0.0, 0.0, 1.0];

                let totalFreq = freqs.reduce((a, b) => a + b, 0) || 1;
                
                freqs.forEach((freq, index) => {
                    if (freq > 0) {
                        const bar = document.createElement('div');
                        bar.className = 'strategy-bar';
                        const action = actionOrder[index];
                        bar.style.backgroundColor = colors[action];
                        bar.style.height = `${(freq / totalFreq) * 100}%`;
                        bar.title = `${action}: ${Math.round(freq * 100)}%`;
                        cell.appendChild(bar);
                    }
                });
                chartContainer.appendChild(cell);
            });
        });
    }

    function handleGenerateClick() {
        const handsToChart = new Set();
        inputFields.forEach(input => {
            const rawHand = input.value.trim();
            if (rawHand) {
                // --- JAVÍTÁS: A normalizáló funkció használata ---
                const normalizedHand = normalizeHandInput(rawHand);
                if (masterStrategyData[normalizedHand]) {
                    handsToChart.add(normalizedHand);
                } else {
                    console.warn(`A(z) '${rawHand}' kéz nem található az adatbázisban, kihagyva.`);
                }
            }
        });

        if (handsToChart.size === 0) {
            alert("Kérlek, adj meg legalább egy érvényes kezet az adatbázisból!");
            return;
        }

        generateChart(Array.from(handsToChart));
    }
    
    generateBtn.addEventListener('click', handleGenerateClick);
});
