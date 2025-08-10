document.addEventListener('DOMContentLoaded', () => {
    // Globális változók és DOM elemek
    let masterStrategyData = {};
    const generateBtn = document.getElementById('generate-btn');
    const chartContainer = document.getElementById('chart-container');
    const inputFields = document.querySelectorAll('.hand-input-field');

    // A gomb letiltása, amíg az adatok be nem töltődnek
    generateBtn.disabled = true;
    generateBtn.style.cursor = 'not-allowed';
    generateBtn.style.backgroundColor = '#5c6168'; // Szürke szín a letiltott állapothoz
    generateBtn.textContent = 'Adatbázis betöltése...';

    const positions = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BU'];
    const colors = { 'All-in': '#8b0000', 'Raise': '#f08080', 'Fold': '#add8e6' };
    const actionOrder = ['All-in', 'Raise', 'Fold'];

    // Adatbázis betöltése
    fetch('strategy_database.json')
        .then(response => {
            if (!response.ok) {
                // Ha a fájl nem található, a .catch ág kezeli
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            masterStrategyData = data;
            console.log('Strategy database loaded successfully.');
            // A gomb engedélyezése a sikeres betöltés után
            generateBtn.disabled = false;
            generateBtn.style.cursor = 'pointer';
            generateBtn.style.backgroundColor = '#43b581'; // Eredeti zöld szín
            generateBtn.textContent = 'Ábra generálása';
        })
        .catch(error => {
            console.error('Error loading strategy database:', error);
            chartContainer.innerHTML = `<p style="color: #f04747; text-align: center;">HIBA: Az adatbázis ('strategy_database.json') nem tölthető be. Ellenőrizd, hogy a fájl létezik-e és a helyes mappában van-e.</p>`;
            generateBtn.textContent = 'Hiba az adatbázisban';
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

                let totalFreq = freqs.reduce((a, b) => a + b, 0);
                
                freqs.forEach((freq, index) => {
                    if (freq > 0) {
                        const bar = document.createElement('div');
                        bar.className = 'strategy-bar';
                        const action = actionOrder[index];
                        bar.style.backgroundColor = colors[action];
                        // A magasságot az összes frekvenciához viszonyítjuk a normalizálás miatt
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
        const handsToChart = new Set(); // Set a duplikációk automatikus kiszűrésére
        inputFields.forEach(input => {
            const hand = input.value.trim();
            if (hand && masterStrategyData[hand]) {
                handsToChart.add(hand);
            } else if (hand) {
                // Figyelmeztetés a konzolra az érvénytelen kezekről
                console.warn(`A(z) '${hand}' kéz nem található az adatbázisban, kihagyva.`);
            }
        });

        if (handsToChart.size === 0) {
            alert("Kérlek, adj meg legalább egy érvényes kezet az adatbázisból!");
            return;
        }

        generateChart(Array.from(handsToChart));
    }
    
    // Eseménykezelő hozzáadása a gombhoz
    generateBtn.addEventListener('click', handleGenerateClick);
});
