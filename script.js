document.addEventListener('DOMContentLoaded', () => {
    // --- ÁLLAPOTVÁLTOZÓK ---
    let masterStrategyData = {};
    let currentHandsInChart = [];
    let currentQuestion = {};
    let score = { correct: 0, total: 0 };

    // --- DOM ELEMEK ---
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

    // --- KONSTANS ADATOK ---
    const positions = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BU'];
    const colors = { 'All-in': '#8b0000', 'Raise': '#f08080', 'Fold': '#add8e6' };
    const actionOrder = ['All-in', 'Raise', 'Fold'];

    // --- INICIALIZÁLÁS ---
    generateBtn.disabled = true;
    generateBtn.textContent = 'Adatbázis betöltése...';

    fetch('strategy_database.json')
        .then(response => response.ok ? response.json() : Promise.reject('Network response was not ok'))
        .then(data => {
            masterStrategyData = data;
            generateBtn.disabled = false;
            generateBtn.textContent = 'Ábra generálása';
        })
        .catch(error => {
            console.error('Error loading database:', error);
            chartContainer.innerHTML = `<p style="color: #f04747; text-align: center;">HIBA: Az adatbázis ('strategy_database.json') nem tölthető be.</p>`;
            generateBtn.textContent = 'Hiba az adatbázisban';
        });

    // --- FUNKCIÓK ---
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
        currentHandsInChart = hands; // Elmentjük a kezeket a gyakorláshoz
        practiceBtn.disabled = hands.length === 0; // Gyakorlás gomb aktiválása/deaktiválása
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
        if (currentHandsInChart.length === 0) {
            alert("Kérlek, először generálj egy ábrát a gyakorláshoz!");
            return;
        }
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
        const randomHand = currentHandsInChart[Math.floor(Math.random() * currentHandsInChart.length)];
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
            if (freq > 0) {
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

    // --- ESEMÉNYKEZELŐK ---
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
        if (handsToChart.size === 0) {
            alert("Kérlek, adj meg legalább egy érvényes kezet!");
            return;
        }
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
