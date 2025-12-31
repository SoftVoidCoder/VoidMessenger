// Telegram Web JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
});

function initTelegramApp() {
    // Плавная анимация при загрузке
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Инициализация всех компонентов
    initForms();
    initSearch();
    initChats();
    initNotifications();
}

function initForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Добавляем анимацию при фокусе
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
        
        // Обработка отправки формы
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                submitBtn.disabled = true;
                
                // Восстанавливаем через 5 секунд на всякий случай
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 5000);
            }
        });
    });
}

function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        // Анимация фокуса
        searchInput.addEventListener('focus', function() {
            this.parentElement.style.boxShadow = '0 0 0 3px rgba(51, 144, 236, 0.1)';
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.style.boxShadow = '';
        });
        
        // Реальный поиск уже встроен в chats.html
    }
}

function initChats() {
    // Этот код уже встроен в chats.html
    // Оставляем только общие функции
}

function initNotifications() {
    // Создаем контейнер для уведомлений если его нет
    if (!document.getElementById('tg-notifications')) {
        const container = document.createElement('div');
        container.id = 'tg-notifications';
        container.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
}

// Функция для показа уведомлений
function showTGNotification(message, type = 'info') {
    const container = document.getElementById('tg-notifications') || document.body;
    
    const notification = document.createElement('div');
    notification.className = 'tg-notification-item';
    notification.style.cssText = `
        background: var(--tg-bg);
        color: var(--tg-text-primary);
        padding: 14px 20px;
        border-radius: 10px;
        box-shadow: var(--tg-shadow-lg);
        border: 1px solid var(--tg-border);
        border-left: 4px solid ${getNotificationColor(type)};
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}" style="color: ${getNotificationColor(type)}; font-size: 16px;"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        'success': '#32a955',
        'error': '#ff3b30',
        'warning': '#ffcc00',
        'info': '#3390ec'
    };
    return colors[type] || '#3390ec';
}

// Показать приветственное сообщение
if (window.location.pathname === '/') {
    setTimeout(() => {
        console.log('%cTelegram Web Clone', 'color: #3390ec; font-size: 16px; font-weight: bold;');
        console.log('%cДобро пожаловать!', 'color: #32a955;');
    }, 500);
}