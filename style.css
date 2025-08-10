document.addEventListener('DOMContentLoaded', () => {
    let masterStrategyData = {};

    const generateBtn = document.getElementById('generate-btn');
    const chartContainer = document.getElementById('chart-container');
    const inputFields = document.querySelectorAll('.hand-input-field');

    const positions = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BU'];
    const colors = { 'All-in': '#8b0000', 'Raise': '#f08080', 'Fold': '#add8e6' };
    const actionOrder = ['All-in', 'Raise', 'Fold'];

    // Adatbázis betöltése
    fetch('strategy_database.json')
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
        .then(data => {
            masterStrategyData = data;
            console.log('Strategy database loaded successfully.');
        })
        .catch(error => {
            console.error('Error loading strategy database:', error);
            chartContainer.innerHTML = `<p style="color: #f04747; text-align: center;">Hiba: Az adatbázis ('strategy_database.json') nem tölthető be.</p>`;
        });

    function generateChart(hands) {
        chartContainer.innerHTML = '';
        if (hands.length === 0) return;

        // Fejlécek
        chartContainer.appendChild(document.createElement('div')); // Üres sarok
        positions.forEach(pos => {
            const header = document.createElement('div');
            header.className = 'chart-header';
            header.textContent = pos;
            chartContainer.appendChild(header);
        });

        // Sorok (kezek)
        hands.forEach(hand => {
            const handLabel = document.createElement('div');
            handLabel.className = 'hand-label';
            handLabel.textContent = hand;
            chartContainer.appendChild(handLabel);
            
            positions.forEach(pos => {
                const cell = document.createElement('div');
                cell.className = 'chart-cell';
                const freqs = masterStrategyData[hand]?.[pos] || [0.0, 0.0, 1.0];

                freqs.forEach((freq, index) => {
                    if (freq > 0) {
                        const bar = document.createElement('div');
                        bar.className = 'strategy-bar';
                        const action = actionOrder[index];
                        bar.style.backgroundColor = colors[action];
                        bar.style.height = `${freq * 100}%`;
                        bar.title = `${action}: ${Math.round(freq * 100)}%`;
                        cell.appendChild(bar);
                    }
                });
                chartContainer.appendChild(cell);
            });
        });
    }

    function handleGenerateClick() {
        const handsToChart = new Set(); // Set használata a duplikációk automatikus kiszűrésére
        inputFields.forEach(input => {
            const hand = input.value.trim();
            if (hand && masterStrategyData[hand]) {
                handsToChart.add(hand);
            } else if (hand) {
                console.warn(`A(z) '${hand}' kéz nem található az adatbázisban, kihagyva.`);
            }
        });

        if (handsToChart.size === 0) {
            alert("Kérlek, adj meg legalább egy érvényes kezet!");
            return;
        }

        generateChart(Array.from(handsToChart));
    }
    
    // Eseménykezelő
    generateBtn.addEventListener('click', handleGenerateClick);
});
