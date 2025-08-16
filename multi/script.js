class MultiplicationGame {
    constructor() {
        this.selectedTable = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.startTime = null;
        this.endTime = null;
        this.gameData = this.loadGameData();
        this.chart = null;
        this.currentLanguage = this.loadLanguage();
        this.translations = this.getTranslations();
        
        this.initializeEventListeners();
        this.updateProgressStats();
        this.updateBestStats();
        this.updateLanguageDisplay();
        this.translatePage();
    }

    initializeEventListeners() {
        // Add event listeners for table selection
        document.querySelectorAll('.table-option').forEach(option => {
            option.addEventListener('click', () => this.selectTable(parseInt(option.dataset.table)));
        });
        
        document.getElementById('start-custom').addEventListener('click', () => this.startCustomGame());
        document.getElementById('start-master').addEventListener('click', () => this.startMasterGame());
        document.getElementById('submit-answer').addEventListener('click', () => this.submitAnswer());
        document.getElementById('skip-question').addEventListener('click', () => this.skipQuestion());
        document.getElementById('quit-game').addEventListener('click', () => this.quitGame());
        document.getElementById('play-again').addEventListener('click', () => this.playAgain());
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showScreen('menu-screen');
            this.updateBestStats();
        });
        document.getElementById('view-progress').addEventListener('click', () => this.showProgressScreen());
        document.getElementById('back-from-progress').addEventListener('click', () => this.showScreen('menu-screen'));
        document.getElementById('chart-type').addEventListener('change', () => this.updateChart());
        document.getElementById('language-toggle').addEventListener('click', () => this.toggleLanguage());
        
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.getCurrentScreen() === 'game-screen') {
                this.quitGame();
            }
        });
    }

    selectTable(tableNumber) {
        // Remove selection from all tables
        document.querySelectorAll('.table-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked table
        const selectedOption = document.querySelector(`[data-table="${tableNumber}"]`);
        selectedOption.classList.add('selected');
        
        this.selectedTable = tableNumber;
    }

    startCustomGame() {
        if (this.selectedTable === null) {
            alert(this.translate('select-table-alert'));
            return;
        }
        this.startGame(false);
    }

    startMasterGame() {
        this.selectedTable = 'master';
        this.startGame(true);
    }

    startGame(isMasterMode) {
        this.currentQuestions = this.generateQuestions();
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        
        // Show countdown screen first
        this.showCountdownScreen(isMasterMode);
    }

    showCountdownScreen(isMasterMode) {
        const tableDisplay = isMasterMode ? this.translate('master-quiz') : `${this.selectedTable}x ${this.translate('table')}`;
        document.getElementById('countdown-table-name').textContent = tableDisplay;
        
        this.showScreen('countdown-screen');
        this.startCountdown(isMasterMode);
    }

    startCountdown(isMasterMode) {
        let countdown = 3;
        const countdownNumber = document.getElementById('countdown-number');
        const countdownContainer = document.querySelector('.countdown-container');
        
        countdownNumber.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            
            if (countdown > 0) {
                countdownNumber.textContent = countdown;
            } else if (countdown === 0) {
                countdownNumber.textContent = this.translate('go');
                countdownNumber.style.color = '#b8bb26';
            } else {
                // Countdown finished, start the actual game
                clearInterval(countdownInterval);
                countdownContainer.classList.add('exiting');
                
                setTimeout(() => {
                    this.startTime = Date.now();
                    this.showScreen('game-screen');
                    this.displayQuestion();
                    this.startTimer();
                    
                    const tableDisplayGame = isMasterMode ? this.translate('master-quiz') : `${this.selectedTable}x`;
                    document.getElementById('current-table').textContent = `${this.translate('current-table')} ${tableDisplayGame}`;
                    
                    // Reset countdown display for next time
                    countdownContainer.classList.remove('exiting');
                    countdownNumber.style.color = '#fabd2f';
                }, 300);
            }
        }, 1000);
    }

    generateQuestions() {
        const questions = [];
        const questionsPerTable = 10;
        
        if (this.selectedTable === 'master') {
            // Master mode: questions from all tables
            for (let table = 1; table <= 10; table++) {
                for (let i = 1; i <= questionsPerTable; i++) {
                    questions.push({
                        table: table,
                        multiplier: i,
                        answer: table * i
                    });
                }
            }
        } else {
            // Single table mode
            for (let i = 1; i <= questionsPerTable; i++) {
                questions.push({
                    table: this.selectedTable,
                    multiplier: i,
                    answer: this.selectedTable * i
                });
            }
        }
        
        return this.shuffleArray(questions);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    displayQuestion() {
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            this.endGame();
            return;
        }

        const question = this.currentQuestions[this.currentQuestionIndex];
        document.getElementById('question-text').textContent = `${question.table} × ${question.multiplier} = ?`;
        document.getElementById('question-counter').textContent = 
            `${this.translate('question-counter')} ${this.currentQuestionIndex + 1} ${this.currentLanguage === 'no' ? 'av' : 'of'} ${this.currentQuestions.length}`;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('score').textContent = 
            `${this.translate('score')} ${this.correctAnswers}/${this.correctAnswers + this.wrongAnswers}`;
        
        // Clear any lingering feedback with a short delay
        setTimeout(() => {
            document.getElementById('feedback').textContent = '';
            document.getElementById('feedback').className = 'feedback';
        }, 800);
    }

    submitAnswer() {
        const userAnswer = parseInt(document.getElementById('answer-input').value);
        const correctAnswer = this.currentQuestions[this.currentQuestionIndex].answer;
        const feedback = document.getElementById('feedback');

        if (isNaN(userAnswer)) {
            feedback.textContent = this.translate('enter-number');
            feedback.className = 'feedback error';
            return;
        }

        if (userAnswer === correctAnswer) {
            this.correctAnswers++;
            feedback.textContent = this.translate('correct-feedback');
            feedback.className = 'feedback success';
        } else {
            this.wrongAnswers++;
            feedback.textContent = `${this.translate('wrong-feedback')} ${correctAnswer}`;
            feedback.className = 'feedback error';
        }

        this.currentQuestionIndex++;
        this.displayQuestion();
    }

    skipQuestion() {
        const correctAnswer = this.currentQuestions[this.currentQuestionIndex].answer;
        this.wrongAnswers++;
        const feedback = document.getElementById('feedback');
        feedback.textContent = `${this.translate('skipped-feedback')} ${correctAnswer}`;
        feedback.className = 'feedback warning';

        this.currentQuestionIndex++;
        this.displayQuestion();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timer').textContent = 
                `${this.translate('timer')} ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    endGame() {
        this.endTime = Date.now();
        clearInterval(this.timerInterval);
        
        const duration = Math.floor((this.endTime - this.startTime) / 1000);
        const accuracy = this.correctAnswers / (this.correctAnswers + this.wrongAnswers) * 100;
        
        const gameResult = {
            date: new Date().toISOString(),
            tables: this.selectedTable === 'master' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [this.selectedTable],
            duration: duration,
            correct: this.correctAnswers,
            wrong: this.wrongAnswers,
            accuracy: accuracy,
            totalQuestions: this.currentQuestions.length
        };
        
        this.saveGameResult(gameResult);
        this.showResults(gameResult);
    }

    showResults(result) {
        const minutes = Math.floor(result.duration / 60);
        const seconds = result.duration % 60;
        
        document.getElementById('final-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('final-correct').textContent = result.correct;
        document.getElementById('final-wrong').textContent = result.wrong;
        document.getElementById('final-accuracy').textContent = `${Math.round(result.accuracy)}%`;
        
        this.showScreen('results-screen');
    }

    quitGame() {
        clearInterval(this.timerInterval);
        this.showScreen('menu-screen');
    }

    playAgain() {
        if (this.selectedTable !== null) {
            this.startGame(this.selectedTable === 'master');
        } else {
            this.showScreen('menu-screen');
        }
    }

    showProgressScreen() {
        this.showScreen('progress-screen');
        this.updateProgressStats();
        this.updateChart();
    }

    updateProgressStats() {
        const totalQuizzes = this.gameData.length;
        const avgAccuracy = totalQuizzes > 0 ? 
            this.gameData.reduce((sum, game) => sum + game.accuracy, 0) / totalQuizzes : 0;
        const bestTime = totalQuizzes > 0 ? 
            Math.min(...this.gameData.map(game => game.duration)) : 0;
        
        document.getElementById('total-quizzes').textContent = totalQuizzes;
        document.getElementById('avg-accuracy').textContent = `${Math.round(avgAccuracy)}%`;
        
        if (bestTime > 0) {
            const minutes = Math.floor(bestTime / 60);
            const seconds = bestTime % 60;
            document.getElementById('best-time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            document.getElementById('best-time').textContent = '--:--';
        }
    }

    updateChart() {
        const chartType = document.getElementById('chart-type').value;
        const ctx = document.getElementById('progress-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        let chartData, chartOptions;

        switch (chartType) {
            case 'accuracy':
                chartData = this.getAccuracyChartData();
                chartOptions = this.getAccuracyChartOptions();
                break;
            case 'time':
                chartData = this.getTimeChartData();
                chartOptions = this.getTimeChartOptions();
                break;
            case 'table-performance':
                chartData = this.getTablePerformanceChartData();
                chartOptions = this.getTablePerformanceChartOptions();
                break;
        }

        this.chart = new Chart(ctx, {
            type: chartType === 'table-performance' ? 'bar' : 'line',
            data: chartData,
            options: chartOptions
        });
    }

    getAccuracyChartData() {
        const recentGames = this.gameData.slice(-10);
        return {
            labels: recentGames.map((_, index) => `Quiz ${index + 1}`),
            datasets: [{
                label: 'Accuracy (%)',
                data: recentGames.map(game => Math.round(game.accuracy)),
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
            }]
        };
    }

    getAccuracyChartOptions() {
        return {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Accuracy Over Last 10 Quizzes'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Accuracy (%)'
                    }
                }
            }
        };
    }

    getTimeChartData() {
        const recentGames = this.gameData.slice(-10);
        return {
            labels: recentGames.map((_, index) => `Quiz ${index + 1}`),
            datasets: [{
                label: 'Time (seconds)',
                data: recentGames.map(game => game.duration),
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4
            }]
        };
    }

    getTimeChartOptions() {
        return {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Quiz Duration Over Last 10 Quizzes'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    }
                }
            }
        };
    }

    getTablePerformanceChartData() {
        const tablePerformance = {};
        
        for (let i = 1; i <= 10; i++) {
            tablePerformance[i] = [];
        }

        this.gameData.forEach(game => {
            game.tables.forEach(table => {
                tablePerformance[table].push(game.accuracy);
            });
        });

        const avgPerformance = [];
        for (let i = 1; i <= 10; i++) {
            if (tablePerformance[i].length > 0) {
                const avg = tablePerformance[i].reduce((sum, acc) => sum + acc, 0) / tablePerformance[i].length;
                avgPerformance.push(Math.round(avg));
            } else {
                avgPerformance.push(0);
            }
        }

        return {
            labels: Array.from({length: 10}, (_, i) => `${i + 1}x Table`),
            datasets: [{
                label: 'Average Accuracy (%)',
                data: avgPerformance,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                    '#4BC0C0', '#FF6384'
                ]
            }]
        };
    }

    getTablePerformanceChartOptions() {
        return {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Average Performance by Times Table'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Average Accuracy (%)'
                    }
                }
            }
        };
    }

    saveGameResult(result) {
        this.gameData.push(result);
        localStorage.setItem('multiplicationGameData', JSON.stringify(this.gameData));
        this.updateBestStats();
    }

    updateBestStats() {
        const tableResultsContainer = document.getElementById('table-results');
        
        if (this.gameData.length === 0) {
            tableResultsContainer.innerHTML = `<div class="no-data">${this.translate('no-quiz-data')}</div>`;
            return;
        }

        // Group games by times tables
        const tableStats = {};
        
        // Initialize all tables 1-10
        for (let i = 1; i <= 10; i++) {
            tableStats[i] = [];
        }

        // Collect data for each table
        this.gameData.forEach(game => {
            game.tables.forEach(table => {
                if (table >= 1 && table <= 10) {
                    tableStats[table].push({
                        accuracy: game.accuracy,
                        duration: game.duration,
                        correct: game.correct,
                        wrong: game.wrong,
                        date: game.date
                    });
                }
            });
        });

        // Generate HTML for each table
        let html = '';
        for (let table = 1; table <= 10; table++) {
            const games = tableStats[table];
            
            if (games.length === 0) {
                html += `
                    <div class="table-result">
                        <div class="table-title">${this.translate(`table-${table}`)}</div>
                        <div class="no-data">${this.translate('no-data')}</div>
                    </div>
                `;
            } else {
                // Calculate best stats for this table
                const bestAccuracy = Math.max(...games.map(g => g.accuracy));
                const bestTime = Math.min(...games.map(g => g.duration));
                const perfectScores = games.filter(g => g.accuracy === 100).length;
                const totalGames = games.length;
                const avgAccuracy = games.reduce((sum, g) => sum + g.accuracy, 0) / games.length;

                const bestMinutes = Math.floor(bestTime / 60);
                const bestSeconds = bestTime % 60;
                const timeDisplay = `${bestMinutes.toString().padStart(2, '0')}:${bestSeconds.toString().padStart(2, '0')}`;

                html += `
                    <div class="table-result">
                        <div class="table-title">${this.translate(`table-${table}`)}</div>
                        <div class="table-stats">
                            <div class="table-stat">
                                <span class="stat-label">${this.translate('best-time-stat')}</span>
                                <span class="stat-value">${timeDisplay}</span>
                            </div>
                            <div class="table-stat">
                                <span class="stat-label">${this.translate('best-accuracy-stat')}</span>
                                <span class="stat-value">${Math.round(bestAccuracy)}%</span>
                            </div>
                            <div class="table-stat">
                                <span class="stat-label">${this.translate('avg-accuracy-stat')}</span>
                                <span class="stat-value">${Math.round(avgAccuracy)}%</span>
                            </div>
                            <div class="table-stat">
                                <span class="stat-label">${this.translate('perfect-scores-stat')}</span>
                                <span class="stat-value">${perfectScores}</span>
                            </div>
                            <div class="table-stat">
                                <span class="stat-label">${this.translate('total-quizzes-stat')}</span>
                                <span class="stat-value">${totalGames}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        tableResultsContainer.innerHTML = html;
    }

    loadGameData() {
        const data = localStorage.getItem('multiplicationGameData');
        return data ? JSON.parse(data) : [];
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    getCurrentScreen() {
        const activeScreen = document.querySelector('.screen.active');
        return activeScreen ? activeScreen.id : null;
    }

    getTranslations() {
        return {
            'en': {
                'app-title': '🔢 Multiplication Practice',
                'select-tables': 'Select Times Tables to Practice',
                'table-1': '1x Table',
                'table-2': '2x Table',
                'table-3': '3x Table',
                'table-4': '4x Table',
                'table-5': '5x Table',
                'table-6': '6x Table',
                'table-7': '7x Table',
                'table-8': '8x Table',
                'table-9': '9x Table',
                'table-10': '10x Table',
                'select-all': 'Select All',
                'clear-all': 'Clear All',
                'best-results': '🏆 Best Results by Times Table',
                'start-practice': 'Start Practice',
                'master-quiz': 'Master Quiz (All Tables)',
                'current-table': 'Table:',
                'question-counter': 'Question',
                'timer': 'Time:',
                'score': 'Score:',
                'submit': 'Submit',
                'skip': 'Skip',
                'quit-game': 'Quit Game',
                'quiz-complete': 'Quiz Complete!',
                'time-taken': 'Time Taken',
                'correct-answers': 'Correct Answers',
                'wrong-answers': 'Wrong Answers',
                'accuracy': 'Accuracy',
                'view-progress': 'View Progress',
                'play-again': 'Play Again',
                'back-to-menu': 'Back to Menu',
                'your-progress': 'Your Progress',
                'accuracy-over-time': 'Accuracy Over Time',
                'time-per-quiz': 'Time Per Quiz',
                'performance-by-table': 'Performance by Table',
                'total-quizzes': 'Total Quizzes',
                'average-accuracy': 'Average Accuracy',
                'best-time': 'Best Time',
                'best-time-stat': 'Best Time:',
                'best-accuracy-stat': 'Best Accuracy:',
                'avg-accuracy-stat': 'Avg Accuracy:',
                'perfect-scores-stat': 'Perfect Scores:',
                'total-quizzes-stat': 'Total Quizzes:',
                'no-data': 'No data',
                'correct-feedback': 'Correct! ✓',
                'wrong-feedback': 'Wrong! The correct answer is',
                'skipped-feedback': 'Skipped! The answer was',
                'enter-number': 'Please enter a number!',
                'select-table-alert': 'Please select a times table!',
                'no-quiz-data': 'No quiz data yet. Complete some quizzes to see your best results!',
                'get-ready': 'Get Ready!',
                'starting-in': 'Starting in...',
                'go': 'GO!',
                'table': 'Table'
            },
            'no': {
                'app-title': '🔢 Gangetabell-øving',
                'select-tables': 'Velg gangetabeller å øve på',
                'table-1': '1-gangen',
                'table-2': '2-gangen',
                'table-3': '3-gangen',
                'table-4': '4-gangen',
                'table-5': '5-gangen',
                'table-6': '6-gangen',
                'table-7': '7-gangen',
                'table-8': '8-gangen',
                'table-9': '9-gangen',
                'table-10': '10-gangen',
                'select-all': 'Velg alle',
                'clear-all': 'Fjern alle',
                'best-results': '🏆 Beste resultater per gangetabell',
                'start-practice': 'Start øving',
                'master-quiz': 'Mesterquiz (alle tabeller)',
                'current-table': 'Tabell:',
                'question-counter': 'Spørsmål',
                'timer': 'Tid:',
                'score': 'Poeng:',
                'submit': 'Send inn',
                'skip': 'Hopp over',
                'quit-game': 'Avslutt spill',
                'quiz-complete': 'Quiz fullført!',
                'time-taken': 'Tid brukt',
                'correct-answers': 'Riktige svar',
                'wrong-answers': 'Feil svar',
                'accuracy': 'Nøyaktighet',
                'view-progress': 'Se fremgang',
                'play-again': 'Spill igjen',
                'back-to-menu': 'Tilbake til meny',
                'your-progress': 'Din fremgang',
                'accuracy-over-time': 'Nøyaktighet over tid',
                'time-per-quiz': 'Tid per quiz',
                'performance-by-table': 'Prestasjon per tabell',
                'total-quizzes': 'Totale quizer',
                'average-accuracy': 'Gjennomsnittlig nøyaktighet',
                'best-time': 'Beste tid',
                'best-time-stat': 'Beste tid:',
                'best-accuracy-stat': 'Beste nøyaktighet:',
                'avg-accuracy-stat': 'Gj.snitt nøyaktighet:',
                'perfect-scores-stat': 'Perfekte resultater:',
                'total-quizzes-stat': 'Totale quizer:',
                'no-data': 'Ingen data',
                'correct-feedback': 'Riktig! ✓',
                'wrong-feedback': 'Feil! Det riktige svaret er',
                'skipped-feedback': 'Hoppet over! Svaret var',
                'enter-number': 'Vennligst skriv inn et tall!',
                'select-table-alert': 'Vennligst velg en gangetabell!',
                'no-quiz-data': 'Ingen quiz-data ennå. Fullfør noen quizer for å se dine beste resultater!',
                'get-ready': 'Gjør deg klar!',
                'starting-in': 'Starter om...',
                'go': 'KJØR!',
                'table': 'gangen'
            }
        };
    }

    loadLanguage() {
        return localStorage.getItem('multiplicationGameLanguage') || 'en';
    }

    saveLanguage() {
        localStorage.setItem('multiplicationGameLanguage', this.currentLanguage);
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'no' : 'en';
        this.saveLanguage();
        this.updateLanguageDisplay();
        this.translatePage();
        this.updateBestStats();
        this.updateChart();
    }

    updateLanguageDisplay() {
        const flag = document.getElementById('current-flag');
        const lang = document.getElementById('current-lang');
        
        if (this.currentLanguage === 'no') {
            flag.textContent = '🇳🇴';
            lang.textContent = 'NO';
        } else {
            flag.textContent = '🇬🇧';
            lang.textContent = 'EN';
        }
    }

    translatePage() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translations[this.currentLanguage][key];
            if (translation) {
                element.textContent = translation;
            }
        });
    }

    translate(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MultiplicationGame();
});