// Главный класс приложения
class TrexArQuest {
    constructor() {
        this.isCameraActive = false;
        this.isMarkerFound = false;
        this.cameraStream = null;
        this.init();
    }

    init() {
        console.log('Инициализация T-Rex AR квеста...');
        
        this.setupEventListeners();
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

        // Ошибки загрузки
        window.addEventListener('error', this.handleError.bind(this));
    }

    async activateCamera() {
        const statusElement = document.getElementById('camera-status');
        const cameraBtn = document.getElementById('start-camera');
        
        try {
            statusElement.textContent = 'Запрос доступа к камере...';
            cameraBtn.disabled = true;

            // Останавливаем предыдущий стрим если есть
            if (this.cameraStream) {
                this.cameraStream.getTracks().forEach(track => track.stop());
            }

            // Запрашиваем камеру с правильными настройками для AR
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Задняя камера
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            this.isCameraActive = true;
            statusElement.textContent = 'Камера активирована! Загружаем AR...';
            cameraBtn.textContent = 'Камера готова';
            
            // НЕ останавливаем стрим! Пусть A-Frame сам управляет
            this.hideLoaderAndStartAR();

        } catch (error) {
            console.error('Ошибка камеры:', error);
            this.handleCameraError(error);
        }
    }

    hideLoaderAndStartAR() {
        // Прячем загрузчик и даем время A-Frame инициализироваться
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
            
            // Принудительно перезапускаем рендеринг сцены
            const scene = document.getElementById('ar-scene');
            if (scene && scene.renderer) {
                scene.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }, 1000);
    }

    handleCameraError(error) {
        const statusElement = document.getElementById('camera-status');
        const cameraBtn = document.getElementById('start-camera');
        
        cameraBtn.disabled = false;
        
        let errorMessage = 'Ошибка доступа к камере';
        
        switch (error.name) {
            case 'NotAllowedError':
                errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера.';
                cameraBtn.textContent = 'Повторить разрешение';
                break;
            case 'NotFoundError':
                errorMessage = 'Камера не найдена на устройстве';
                break;
            case 'NotSupportedError':
                errorMessage = 'AR не поддерживается вашим браузером';
                break;
            case 'OverconstrainedError':
            case 'ConstraintNotSatisfiedError':
                errorMessage = 'Не удалось запустить камеру с нужными параметрами';
                cameraBtn.textContent = 'Попробовать снова';
                break;
            default:
                errorMessage = 'Неизвестная ошибка: ' + error.message;
        }
        
        statusElement.textContent = errorMessage;
        console.error('Camera error details:', error);
    }

    setupARSession() {
        const scene = document.getElementById('ar-scene');
        const marker = document.getElementById('ar-marker');

        if (!scene) {
            console.error('AR сцена не найдена');
            return;
        }

        // Событие загрузки сцены
        scene.addEventListener('loaded', () => {
            console.log('AR сцена загружена');
            this.updateCameraStatus('AR сцена готова. Наведите на маркер.');
            
            // Автоматически запрашиваем камеру после загрузки сцены
            setTimeout(() => {
                this.activateCamera();
            }, 1000);
        });

        // Событие рендеринга сцены
        scene.addEventListener('renderstart', () => {
            console.log('Рендеринг AR начался');
            this.updateCameraStatus('AR активно!');
        });

        // Маркер найден
        if (marker) {
            marker.addEventListener('markerFound', () => {
                console.log('Маркер найден!');
                this.isMarkerFound = true;
                this.showQuestionWithDelay();
            });

            marker.addEventListener('markerLost', () => {
                console.log('Маркер потерян');
                this.isMarkerFound = false;
                this.hideQuestion();
            });
        }

        // Ошибки сцены
        scene.addEventListener('error', (e) => {
            console.error('Ошибка AR сцены:', e);
            this.updateCameraStatus('Ошибка AR. Попробуйте обновить страницу.');
        });

        // Проблемы с видео
        scene.addEventListener('videosourceerror', (e) => {
            console.error('Ошибка видео источника:', e);
            this.updateCameraStatus('Ошибка видео. Проверьте камеру.');
        });
    }

    showQuestionWithDelay() {
        // Показываем вопрос через 2 секунды после обнаружения маркера
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
        const correctAnswer = 2; // Меловой период
        const feedback = document.getElementById('feedback');
        const buttons = document.querySelectorAll('.option-btn');
        
        if (!feedback || !buttons.length) return;
        
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

    // Очистка при разгрузке страницы
    destroy() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }
    }
}

// Запуск приложения когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    window.trexApp = new TrexArQuest();
});

// Очистка при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (window.trexApp) {
        window.trexApp.destroy();
    }
});

// Fallback для старых браузеров
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    document.getElementById('camera-status').textContent = 
        'Ваш браузер не поддерживает камеру. Обновите браузер.';
    document.getElementById('start-camera').disabled = true;
}