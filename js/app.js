// Главный класс приложения
class TrexArQuest {
    constructor() {
        this.isCameraActive = false;
        this.isMarkerFound = false;
        this.init();
    }

    init() {
        console.log('Инициализация T-Rex AR квеста...');
        
        this.setupEventListeners();
        this.setupCamera();
        this.setupARSession();
    }

    setupEventListeners() {
        // Кнопка запуска камеры
        document.getElementById('start-camera').addEventListener('click', () => {
            this.activateCamera();
        });

        // Кнопки ответов
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const answer = parseInt(e.target.getAttribute('data-answer'));
                this.checkAnswer(answer);
            });
        });

        // Ресайз окна
        window.addEventListener('resize', this.handleResize.bind(this));

        // Ошибки загрузки
        window.addEventListener('error', this.handleError.bind(this));
    }

    setupCamera() {
        // Проверяем поддержку камеры
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.updateCameraStatus('Ваш браузер не поддерживает камеру');
            return;
        }

        // Пробуем автоматически запросить камеру
        this.activateCamera();
    }

    async activateCamera() {
        const statusElement = document.getElementById('camera-status');
        const cameraBtn = document.getElementById('start-camera');
        
        try {
            statusElement.textContent = 'Запрос доступа к камере...';
            cameraBtn.disabled = true;

            // Запрашиваем камеру
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });

            this.isCameraActive = true;
            statusElement.textContent = 'Камера активирована!';
            cameraBtn.textContent = 'Камера готова';
            
            // Останавливаем стрим (A-Frame сам управляет камерой)
            stream.getTracks().forEach(track => track.stop());
            
            // Прячем загрузчик через 2 секунды
            setTimeout(() => {
                document.getElementById('loading').classList.add('hidden');
            }, 2000);

        } catch (error) {
            console.error('Ошибка камеры:', error);
            this.handleCameraError(error);
        }
    }

    handleCameraError(error) {
        const statusElement = document.getElementById('camera-status');
        const cameraBtn = document.getElementById('start-camera');
        
        cameraBtn.disabled = false;
        
        switch (error.name) {
            case 'NotAllowedError':
                statusElement.textContent = 'Доступ к камере запрещен. Нажмите кнопку выше.';
                cameraBtn.textContent = 'Разрешить камеру';
                break;
            case 'NotFoundError':
                statusElement.textContent = 'Камера не найдена на устройстве';
                break;
            case 'NotSupportedError':
                statusElement.textContent = 'Ваш браузер не поддерживает AR';
                break;
            default:
                statusElement.textContent = 'Ошибка доступа к камере: ' + error.message;
        }
    }

    setupARSession() {
        const scene = document.getElementById('ar-scene');
        const marker = document.getElementById('ar-marker');

        // Событие загрузки сцены
        scene.addEventListener('loaded', () => {
            console.log('AR сцена загружена');
            this.updateCameraStatus('AR сцена готова');
        });

        // Маркер найден
        marker.addEventListener('markerFound', () => {
            console.log('Маркер найден!');
            this.isMarkerFound = true;
            this.showQuestionWithDelay();
        });

        // Маркер потерян
        marker.addEventListener('markerLost', () => {
            console.log('Маркер потерян');
            this.isMarkerFound = false;
            this.hideQuestion();
        });

        // Ошибки сцены
        scene.addEventListener('error', (e) => {
            console.error('Ошибка AR сцены:', e);
            this.updateCameraStatus('Ошибка AR. Обновите страницу.');
        });
    }

    showQuestionWithDelay() {
        // Показываем вопрос через 3 секунды после обнаружения маркера
        setTimeout(() => {
            if (this.isMarkerFound) {
                this.showQuestion();
            }
        }, 3000);
    }

    showQuestion() {
        const questionPanel = document.getElementById('question-panel');
        questionPanel.classList.remove('hidden');
        questionPanel.classList.add('visible');
    }

    hideQuestion() {
        const questionPanel = document.getElementById('question-panel');
        questionPanel.classList.add('hidden');
        questionPanel.classList.remove('visible');
        
        // Сбрасываем состояние кнопок
        this.resetQuestionState();
    }

    checkAnswer(selectedAnswer) {
        const correctAnswer = 2; // Меловой период
        const feedback = document.getElementById('feedback');
        const buttons = document.querySelectorAll('.option-btn');
        
        // Блокируем кнопки
        buttons.forEach(btn => btn.disabled = true);
        
        // Подсвечиваем правильный/неправильный ответ
        buttons.forEach(btn => {
            const answer = parseInt(btn.getAttribute('data-answer'));
            btn.classList.add(answer === correctAnswer ? 'correct' : 'wrong');
        });
        
        if (selectedAnswer === correctAnswer) {
            feedback.innerHTML = '<strong>Правильно!</strong><br>Тираннозавр Рекс жил в Меловом периоде (145-66 млн лет назад)';
            feedback.className = 'feedback correct';
            
            // Анимация T-Rex при правильном ответе
            this.celebrateCorrectAnswer();
            
        } else {
            feedback.innerHTML = '<strong>Неверно!</strong><br>Тираннозавр жил в Меловом периоде';
            feedback.className = 'feedback wrong';
        }
    }

    celebrateCorrectAnswer() {
        const trex = document.getElementById('trex-model');
        if (trex) {
            // Добавляем прыгающую анимацию
            trex.setAttribute('animation', {
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
        
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'wrong');
        });
        
        feedback.textContent = '';
        feedback.className = 'feedback';
    }

    handleResize() {
        console.log('Размер окна изменен');
        // Можно добавить логику адаптации под разные размеры
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
}

// Запуск приложения когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    new TrexArQuest();
});

// Сервис-воркер для кэширования (опционально)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}