document.addEventListener('DOMContentLoaded', () => {
    // Globális változók és DOM elemek
    let masterStrategyData = {};
    let selectedHands = [];
    const MAX_HANDS = 12;

    const handInput = document.getElementById('hand-input');
    const addHandBtn = document.getElementById('add-hand-btn');
    const resetBtn = document.getElementById('reset-btn');
    const selectedHandsContainer = document.getElementById('selected-hands-container');
    const chartContainer = document.getElementById('chart-container');

    const positions = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BU'];
    const colors = {
        'All-in': '#8b0000',
        'Raise': '#f08080',
        'Fold': '#add8e6'
    };
    const actionOrder = ['All-in', 'Raise', 'Fold'];

    // Adatbázis betöltése
    fetch('strategy_database.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            masterStrategyData = data;
            console.log('Strategy database loaded successfully.');
        })
        .catch(error => {
            console.error('Error loading strategy database:', error);
            chartContainer.innerHTML = `<p style="color: #f04747;">Hiba: A 'strategy_database.json' nem tölthető be. Ellenőrizd, hogy a fájl létezik-e és a helyes mappában van-e.</p>`;
        });

    // Funkciók
    function addHand() {
        const hand = handInput.value.trim();
        if (!hand) return;

        if (selectedHands.length >= MAX_HANDS) {
            alert(`Maximum ${MAX_HANDS} kezet adhatsz meg.`);
            return;
        }

        if (!masterStrategyData[hand]) {
            alert(`A(z) '${hand}' kéz nem található az adatbázisban, vagy hibás a formátum.`);
            return;
        }

        if (selectedHands.includes(hand)) {
            alert(`A(z) '${hand}' kéz már szerepel a listán.`);
            return;
        }

        selectedHands.push(hand);
        handInput.value = '';
        updateSelectedHandsDisplay();
        generateChart();
    }
    
    function removeHand(handToRemove) {
        selectedHands = selectedHands.filter(h => h !== handToRemove);
        updateSelectedHandsDisplay();
        generateChart();
    }
    
    function updateSelectedHandsDisplay() {
        selectedHandsContainer.innerHTML = '';
        selectedHands.forEach(hand => {
            const tag = document.createElement('div');
            tag.className = 'hand-tag';
            tag.innerHTML = `
                <span>${hand}</span>
                <span class="remove-hand-btn" data-hand="${hand}">×</span>
            `;
            selectedHandsContainer.appendChild(tag);
        });
    }

    function generateChart() {
        chartContainer.innerHTML = '';
        if (selectedHands.length === 0) return;

        // Fejlécek
        chartContainer.appendChild(document.createElement('div')); // Üres sarok
        positions.forEach(pos => {
            const header = document.createElement('div');
            header.className = 'chart-header';
            header.textContent = pos;
            chartContainer.appendChild(header);
        });

        // Sorok (kezek)
        selectedHands.forEach(hand => {
            // Kéz címke
            const handLabel = document.createElement('div');
            handLabel.className = 'hand-label';
            handLabel.textContent = hand;
            chartContainer.appendChild(handLabel);
            
            // Stratégia cellák
            positions.forEach(pos => {
                const cell = document.createElement('div');
                cell.className = 'chart-cell';
                
                const freqs = masterStrategyData[hand]?.[pos] || [0.0, 0.0, 1.0]; // Alapértelmezett: 100% dobás

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

    function resetAll() {
        selectedHands = [];
        handInput.value = '';
        updateSelectedHandsDisplay();
        generateChart();
    }
    
    // Eseménykezelők
    addHandBtn.addEventListener('click', addHand);
    handInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            addHand();
        }
    });
    resetBtn.addEventListener('click', resetAll);
    selectedHandsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-hand-btn')) {
            removeHand(event.target.dataset.hand);
        }
    });
});
