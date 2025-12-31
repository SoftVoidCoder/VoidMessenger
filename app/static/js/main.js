// Telegram Web JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
});

function initTelegramApp() {
    // Инициализация форм
    initForms();
    
    // Инициализация поиска
    initSearch();
    
    // Инициализация чатов
    initChats();
    
    // Показать приветственное сообщение
    showWelcomeMessage();
}

function initForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
                submitBtn.disabled = true;
            }
        });
    });
}

function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const chatItems = document.querySelectorAll('.chat-item');
            
            chatItems.forEach(item => {
                const name = item.querySelector('h4').textContent.toLowerCase();
                const username = item.querySelector('p').textContent.toLowerCase();
                
                if (searchTerm === '' || name.includes(searchTerm) || username.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
}

function initChats() {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            // Убираем активный класс
            chatItems.forEach(i => i.classList.remove('active'));
            
            // Добавляем активный класс
            this.classList.add('active');
            
            // Получаем информацию о пользователе
            const username = this.querySelector('p').textContent;
            const name = this.querySelector('h4').textContent;
            
            // Показываем уведомление
            showNotification(`Открыт чат с ${name} (@${username})`);
        });
    });
}

function showWelcomeMessage() {
    // Показываем приветственное сообщение только на главной
    if (window.location.pathname === '/') {
        console.log('Добро пожаловать в Telegram Web Clone!');
    }
}

function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'tg-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Стили для уведомления
    const style = document.createElement('style');
    style.textContent = `
        .tg-notification {
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 16px 24px;
            border-radius: 10px;
            box-shadow: var(--tg-shadow-lg);
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            max-width: 320px;
            border-left: 4px solid ${getNotificationBorderColor(type)};
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .notification-content i {
            font-size: 18px;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    
    // Добавляем стили если их еще нет
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    
    // Добавляем уведомление
    document.body.appendChild(notification);
    
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
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#0088cc'
    };
    return colors[type] || '#0088cc';
}

function getNotificationBorderColor(type) {
    const colors = {
        'success': '#1e7e34',
        'error': '#bd2130',
        'warning': '#d39e00',
        'info': '#0069d9'
    };
    return colors[type] || '#0069d9';
}

// Проверка авторизации
function checkAuth() {
    if (window.location.pathname !== '/' && 
        window.location.pathname !== '/login' && 
        window.location.pathname !== '/register') {
        // Можно добавить проверку JWT токена через API
        console.log('Защищенная страница');
    }
}

// Инициализируем проверку
checkAuth();