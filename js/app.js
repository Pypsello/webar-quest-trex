class TrexArQuest {
    constructor() {
        this.isMarkerFound = false;
        this.init();
    }

    init() {
        console.log('Инициализация T-Rex AR квеста...');
        this.setupEventListeners();
        this.setupARSession();
    }

    setupEventListeners() {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = parseInt(e.target.getAttribute('data-answer'));
                this.checkAnswer(answer);
            });
        });

        window.addEventListener('error', this.handleError.bind(this));
    }

    setupARSession() {
        const scene = document.getElementById('ar-scene');
        const marker = document.getElementById('ar-marker');

        if (!scene) {
            console.error('AR сцена не найдена');
            return;
        }

        scene.addEventListener('loaded', () => {
            console.log('AR сцена загружена');
            this.updateCameraStatus('Сцена загружена. Камера активируется...');
        });

        scene.addEventListener('renderstart', () => {
            console.log('Рендеринг AR начался');
            this.updateCameraStatus('AR активно! Наведите на маркер.');
            this.hideLoader(); // Скрываем загрузчик после начала рендеринга
        });

        if (marker) {
            marker.addEventListener('markerFound', () => {
                console.log('Маркер найден!');
                this.isMarkerFound = true;
                this.updateMarkerStatus('found');
                this.showQuestionWithDelay();
            });

            marker.addEventListener('markerLost', () => {
                console.log('Маркер потерян');
                this.isMarkerFound = false;
                this.updateMarkerStatus('searching');
                this.hideQuestion();
            });
        }

        scene.addEventListener('error', (e) => {
            console.error('Ошибка AR сцены:', e);
            this.updateCameraStatus('Ошибка AR. Попробуйте обновить страницу.');
        });

        scene.addEventListener('camera-error', (e) => {
            console.error('Ошибка камеры:', e);
            this.updateCameraStatus('Ошибка доступа к камере. Проверьте разрешения.');
        });
    }

    hideLoader() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showQuestionWithDelay() {
        setTimeout(() => {
            if (this.isMarkerFound) {
                this.showQuestion();
            }
        }, 2000);
    }

    showQuestion() {
        const questionPanel = document.getElementById('question-panel');
        if (questionPanel) {
            questionPanel.classList.remove('hidden');
            questionPanel.classList.add('visible');
        }
    }

    hideQuestion() {
        const questionPanel = document.getElementById('question-panel');
        if (questionPanel) {
            questionPanel.classList.add('hidden');
            questionPanel.classList.remove('visible');
            this.resetQuestionState();
        }
    }

    checkAnswer(selectedAnswer) {
        const correctAnswer = 2;
        const feedback = document.getElementById('feedback');
        const buttons = document.querySelectorAll('.option-btn');
        
        if (!feedback || !buttons.length) return;
        
        buttons.forEach(btn => btn.disabled = true);

        buttons.forEach(btn => {
            const answer = parseInt(btn.getAttribute('data-answer'));
            btn.classList.add(answer === correctAnswer ? 'correct' : 'wrong');
        });

        if (selectedAnswer === correctAnswer) {
            feedback.innerHTML = '<strong>Правильно!</strong><br>Тираннозавр Рекс жил в Меловом периоде (145-66 млн лет назад)';
            feedback.className = 'feedback correct';
            this.celebrateCorrectAnswer();
        } else {
            feedback.innerHTML = '<strong>Неверно!</strong><br>Тираннозавр жил в Меловом периоде';
            feedback.className = 'feedback wrong';
        }
    }

    celebrateCorrectAnswer() {
        const trex = document.getElementById('trex-model');
        if (trex) {
            trex.setAttribute('animation__jump', {
                property: 'position',
                to: '0 0.8 0',
                dur: 800,
                dir: 'alternate',
                loop: true
            });
        }
    }

    resetQuestionState() {
        const buttons = document.querySelectorAll('.option-btn');
        const feedback = document.getElementById('feedback');
        
        if (buttons.length && feedback) {
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('correct', 'wrong');
            });
            
            feedback.textContent = '';
            feedback.className = 'feedback';
        }
    }

    handleError(error) {
        console.error('Глобальная ошибка:', error);
        this.updateCameraStatus('Произошла ошибка. Обновите страницу.');
    }

    updateCameraStatus(message) {
        const statusElement = document.getElementById('camera-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateMarkerStatus(status) {
        const indicator = document.querySelector('.marker-indicator');
        if (indicator) {
            indicator.className = 'marker-indicator';
            indicator.classList.add(status);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.trexApp = new TrexArQuest();
});