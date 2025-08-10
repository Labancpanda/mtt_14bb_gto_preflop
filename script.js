document.addEventListener('DOMContentLoaded', () => {
    let masterStrategyData = {};
    let currentHandsInChart = [];
    let currentQuestion = {};
    let score = { correct: 0, total: 0 };

    const generateBtn = document.getElementById('generate-btn');
    const practiceBtn = document.getElementById('practice-btn');
    const chartContainer = document.getElementById('chart-container');
    const inputFields = document.querySelectorAll('.hand-input-field');
    const mainContent = document.getElementById('main-content');
    const practiceModeDiv = document.getElementById('practice-mode');
    const questionText = document.getElementById('question-text');
    const answerButtonsContainer = document.getElementById('answer-buttons');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const feedbackText = document.getElementById('feedback-text');
    const scoreDisplay = document.getElementById('score-display');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const exitPracticeBtn = document.getElementById('exit-practice-btn');

    const positions = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BU'];
    const colors = { 'All-in': '#8b0000', 'Raise': '#f08080', 'Fold': '#add8e6' };
    const actionOrder = ['All-in', 'Raise', 'Fold'];

    // Gombok letiltása, amíg az adatbázis be nem töltődik
    generateBtn.disabled = true;
    generateBtn.textContent = 'Adatbázis betöltése...';
    practiceBtn.disabled = true;

    fetch('strategy_database.json')
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
        .then(data => {
            masterStrategyData = data;
            // JAVÍTÁS: Mindkét gomb engedélyezése a sikeres betöltés után
            generateBtn.disabled = false;
            generateBtn.textContent = 'Ábra generálása';
            practiceBtn.disabled = false;
        })
        .catch(error => {
            console.error('Error loading database:', error);
            chartContainer.innerHTML = `<p style="color: #f04747; text-align: center;">HIBA: Az adatbázis ('strategy_database.json') nem tölthető be.</p>`;
            generateBtn.textContent = 'Hiba az adatbázisban';
            practiceBtn.textContent = 'Hiba';
        });

    function normalizeHandInput(handStr) {
        if (!handStr || handStr.length < 2 || handStr.length > 3) return handStr;
        const rankOrder = '23456789TJQKA';
        let rank1 = handStr[0].toUpperCase();
        let rank2 = handStr[1].toUpperCase();
        if (rankOrder.indexOf(rank1) < rankOrder.indexOf(rank2)) [rank1, rank2] = [rank2, rank1];
        if (rank1 === rank2) return rank1 + rank2;
        if (handStr.length === 3) {
            const suitInfo = handStr[2].toLowerCase();
            if (suitInfo === 's' || suitInfo === 'o') return rank1 + rank2 + suitInfo;
        }
        return handStr;
    }

    function generateChart(hands) {
        currentHandsInChart = hands;
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

    function startPractice() {
        mainContent.classList.add('hidden');
        practiceModeDiv.classList.remove('hidden');
        score = { correct: 0, total: 0 };
        updateScoreDisplay();
        generateNewQuestion();
    }

    function exitPractice() {
        mainContent.classList.remove('hidden');
        practiceModeDiv.classList.add('hidden');
    }

    function generateNewQuestion() {
        // JAVÍTÁS: A kérdések forrásának meghatározása
        const handsToPracticeFrom = currentHandsInChart.length > 0 ? currentHandsInChart : Object.keys(masterStrategyData);
        
        const randomHand = handsToPracticeFrom[Math.floor(Math.random() * handsToPracticeFrom.length)];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        currentQuestion = { hand: randomHand, position: randomPosition };

        questionText.innerHTML = `Mi a helyes lépés a(z) <strong>${randomHand}</strong> kézzel <strong>${randomPosition}</strong> pozícióból?`;
        
        feedbackText.textContent = '';
        feedbackText.className = '';
        nextQuestionBtn.classList.add('hidden');
        answerButtons.forEach(btn => btn.disabled = false);
    }

    function checkAnswer(userAnswer) {
        const { hand, position } = currentQuestion;
        const freqs = masterStrategyData[hand]?.[position] || [0.0, 0.0, 1.0];
        
        const correctActions = [];
        let feedbackString = 'A helyes lépés(ek): ';
        freqs.forEach((freq, index) => {
            if (freq > 0.001) { // Kis kerekítési hibák kiszűrése
                const action = actionOrder[index];
                correctActions.push(action);
                feedbackString += `${action} (${Math.round(freq*100)}%), `;
            }
        });

        score.total++;
        if (correctActions.includes(userAnswer)) {
            score.correct++;
            feedbackText.textContent = 'Helyes!';
            feedbackText.className = 'feedback-correct';
        } else {
            feedbackText.textContent = 'Helytelen. ' + feedbackString.slice(0, -2);
            feedbackText.className = 'feedback-incorrect';
        }
        
        updateScoreDisplay();
        nextQuestionBtn.classList.remove('hidden');
        answerButtons.forEach(btn => btn.disabled = true);
    }

    function updateScoreDisplay() {
        scoreDisplay.textContent = `Helyes: ${score.correct} / ${score.total}`;
    }

    generateBtn.addEventListener('click', () => {
        const handsToChart = new Set();
        inputFields.forEach(input => {
            const rawHand = input.value.trim();
            if (rawHand) {
                const normalizedHand = normalizeHandInput(rawHand);
                if (masterStrategyData[normalizedHand]) {
                    handsToChart.add(normalizedHand);
                } else {
                    console.warn(`'${rawHand}' -> '${normalizedHand}' nem található.`);
                }
            }
        });
        // Az üres generálás is törli a táblát, de a gyakorlás gomb aktív marad
        generateChart(Array.from(handsToChart));
    });

    practiceBtn.addEventListener('click', startPractice);
    exitPracticeBtn.addEventListener('click', exitPractice);
    nextQuestionBtn.addEventListener('click', generateNewQuestion);
    answerButtonsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('answer-btn')) {
            checkAnswer(event.target.dataset.action);
        }
    });
});
