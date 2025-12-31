// Telegram Web Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('%c📱 Telegram Web Clone', 'color: #3390ec; font-size: 18px; font-weight: bold;');
    console.log('%c🚀 Initializing application...', 'color: #32a955;');
    
    initTelegramApp();
});

// Main initialization function
function initTelegramApp() {
    // Add fade-in animation
    addFadeInAnimation();
    
    // Initialize all components
    initForms();
    initSearch();
    initChats();
    initNotifications();
    initButtons();
    initSidebar();
    
    // Check user authentication status
    checkAuthStatus();
    
    // Add Telegram-like animations
    addTelegramAnimations();
    
    console.log('%c✅ Application initialized successfully!', 'color: #32a955;');
}

// Add smooth fade-in animation
function addFadeInAnimation() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}

// Initialize all forms
function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Add focus effects to inputs
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
        
        // Handle form submission
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalHTML = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Подождите...';
                submitBtn.disabled = true;
                
                // Restore button after 5 seconds (in case of error)
                setTimeout(() => {
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                }, 5000);
            }
        });
    });
    
    // Add real-time validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateEmail(this);
        });
    });
    
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            showPasswordStrength(this);
        });
    });
}

// Initialize search functionality
function initSearch() {
    const searchInputs = document.querySelectorAll('.search-box input');
    
    searchInputs.forEach(searchInput => {
        // Add focus animation
        searchInput.addEventListener('focus', function() {
            const parent = this.parentElement;
            parent.style.transform = 'scale(1.02)';
            parent.style.transition = 'transform 0.2s ease';
        });
        
        searchInput.addEventListener('blur', function() {
            const parent = this.parentElement;
            parent.style.transform = 'scale(1)';
        });
        
        // Add live search for chat items
        if (searchInput.closest('.sidebar')) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                const chatItems = document.querySelectorAll('.chat-item');
                
                chatItems.forEach(item => {
                    const name = item.querySelector('h4').textContent.toLowerCase();
                    const username = item.querySelector('p').textContent.toLowerCase();
                    
                    if (searchTerm === '' || name.includes(searchTerm) || username.includes(searchTerm)) {
                        item.style.display = 'flex';
                        item.style.animation = 'fadeIn 0.3s ease';
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Show search results count
                const visibleItems = document.querySelectorAll('.chat-item[style*="display: flex"]');
                showTGNotification(`Найдено контактов: ${visibleItems.length}`, 'info');
            });
        }
    });
}

// Initialize chat functionality
function initChats() {
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        // Add click handler
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            chatItems.forEach(i => {
                i.classList.remove('active');
                i.style.transform = 'scale(1)';
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            this.style.transform = 'scale(0.98)';
            this.style.transition = 'transform 0.2s ease';
            
            // Get user info
            const username = this.querySelector('p').textContent;
            const name = this.querySelector('h4').textContent;
            
            // Update chat area
            updateChatArea(name, username);
            
            // Show notification
            showTGNotification(`Открыт чат с ${name}`, 'info');
            
            // Simulate typing indicator
            simulateTyping(username);
        });
        
        // Add hover effects
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateX(5px)';
                this.style.transition = 'transform 0.2s ease';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateX(0)';
            }
        });
    });
}

// Update chat area when chat is selected
function updateChatArea(name, username) {
    const emptyChat = document.querySelector('.empty-chat');
    if (emptyChat) {
        emptyChat.innerHTML = `
            <div class="chat-header" style="position: absolute; top: 0; left: 0; right: 0; height: 60px; border-bottom: 1px solid var(--tg-border); display: flex; align-items: center; padding: 0 20px; background: var(--tg-bg);">
                <div class="chat-header-info" style="display: flex; align-items: center; gap: 12px;">
                    <div class="chat-header-avatar" style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--tg-blue), #4dabf7); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px;">
                        ${name[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 style="font-size: 16px; font-weight: 600; margin: 0;">${name}</h3>
                        <p style="color: var(--tg-text-secondary); font-size: 13px; margin: 0;">${username}</p>
                    </div>
                </div>
                <div class="chat-header-actions" style="margin-left: auto; display: flex; gap: 12px;">
                    <button class="btn btn-secondary btn-sm" style="padding: 8px 16px;">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" style="padding: 8px 16px;">
                        <i class="fas fa-video"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" style="padding: 8px 16px;">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
            </div>
            <div class="chat-messages" style="margin-top: 60px; padding: 20px; flex: 1; overflow-y: auto;">
                <div class="message-date" style="text-align: center; margin: 20px 0;">
                    <span style="background: var(--tg-secondary-bg); padding: 4px 12px; border-radius: 12px; font-size: 12px; color: var(--tg-text-secondary);">
                        Сегодня
                    </span>
                </div>
                <div class="message incoming" style="display: flex; gap: 10px; margin-bottom: 16px; max-width: 70%;">
                    <div class="message-avatar" style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--tg-green), #32a955); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0;">
                        ${name[0].toUpperCase()}
                    </div>
                    <div>
                        <div class="message-content" style="background: var(--tg-secondary-bg); padding: 12px 16px; border-radius: 12px 12px 12px 4px;">
                            <p style="margin: 0; color: var(--tg-text-primary);">Привет! Как дела? Это тестовое сообщение.</p>
                        </div>
                        <div class="message-time" style="font-size: 11px; color: var(--tg-text-muted); margin-top: 4px; padding-left: 8px;">
                            12:30
                        </div>
                    </div>
                </div>
                <div class="message outgoing" style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 16px; max-width: 70%; margin-left: auto;">
                    <div>
                        <div class="message-content" style="background: var(--tg-blue); padding: 12px 16px; border-radius: 12px 12px 4px 12px;">
                            <p style="margin: 0; color: white;">Привет! Всё отлично, спасибо! Это ответное сообщение.</p>
                        </div>
                        <div class="message-time" style="font-size: 11px; color: var(--tg-text-muted); margin-top: 4px; text-align: right; padding-right: 8px;">
                            12:32 <i class="fas fa-check" style="margin-left: 4px;"></i>
                        </div>
                    </div>
                    <div class="message-avatar" style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--tg-blue), #3390ec); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0;">
                        Вы
                    </div>
                </div>
                <div class="typing-indicator" id="typingIndicator" style="display: none; margin-bottom: 16px;">
                    <div class="typing-dots" style="display: flex; gap: 4px; background: var(--tg-secondary-bg); padding: 12px 16px; border-radius: 12px 12px 12px 4px; width: fit-content;">
                        <div class="dot" style="width: 8px; height: 8px; background: var(--tg-text-secondary); border-radius: 50%; animation: typing 1.4s infinite;"></div>
                        <div class="dot" style="width: 8px; height: 8px; background: var(--tg-text-secondary); border-radius: 50%; animation: typing 1.4s infinite 0.2s;"></div>
                        <div class="dot" style="width: 8px; height: 8px; background: var(--tg-text-secondary); border-radius: 50%; animation: typing 1.4s infinite 0.4s;"></div>
                    </div>
                </div>
            </div>
            <div class="chat-input" style="border-top: 1px solid var(--tg-border); padding: 16px 20px; background: var(--tg-bg);">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <button class="btn btn-secondary btn-sm" style="padding: 10px; border-radius: 50%;">
                        <i class="fas fa-plus"></i>
                    </button>
                    <input type="text" placeholder="Сообщение..." style="flex: 1; height: 40px; padding: 0 16px; border: 1px solid var(--tg-border); border-radius: 20px; font-size: 14px; outline: none;">
                    <button class="btn btn-primary btn-sm" style="padding: 10px; border-radius: 50%;">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add typing animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-4px); }
            }
        `;
        document.head.appendChild(style);
        
        // Scroll to bottom
        setTimeout(() => {
            const messagesContainer = emptyChat.querySelector('.chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
    }
}

// Simulate typing indicator
function simulateTyping(username) {
    setTimeout(() => {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'block';
            
            setTimeout(() => {
                if (typingIndicator) {
                    typingIndicator.style.display = 'none';
                    
                    // Add new message after typing
                    setTimeout(() => {
                        addNewMessage(username, 'Только что написал вам сообщение!');
                    }, 500);
                }
            }, 2000);
        }
    }, 1000);
}

// Add new message to chat
function addNewMessage(username, text) {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message incoming';
        messageDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 16px; max-width: 70%; animation: fadeIn 0.3s ease;';
        
        messageDiv.innerHTML = `
            <div class="message-avatar" style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--tg-green), #32a955); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px; flex-shrink: 0;">
                ${username[0].toUpperCase()}
            </div>
            <div>
                <div class="message-content" style="background: var(--tg-secondary-bg); padding: 12px 16px; border-radius: 12px 12px 12px 4px;">
                    <p style="margin: 0; color: var(--tg-text-primary);">${text}</p>
                </div>
                <div class="message-time" style="font-size: 11px; color: var(--tg-text-muted); margin-top: 4px; padding-left: 8px;">
                    ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Show notification
        showTGNotification(`Новое сообщение от ${username}`, 'info');
    }
}

// Initialize notification system
function initNotifications() {
    // Create notification container
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
            max-width: 320px;
        `;
        document.body.appendChild(container);
    }
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
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
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .tg-notification-item {
            animation: slideInRight 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Initialize button interactions
function initButtons() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        // Add click animation
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        // Add ripple effect
        button.addEventListener('click', function(e) {
            createRippleEffect(e, this);
        });
    });
}

// Create ripple effect on button click
function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple 0.6s linear;
        width: ${size}px;
        height: ${size}px;
        top: ${y}px;
        left: ${x}px;
        pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Initialize sidebar functionality
function initSidebar() {
    // Add sidebar toggle for mobile
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth < 768) {
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.className = 'btn btn-secondary btn-sm';
        toggleBtn.style.cssText = 'position: fixed; top: 70px; left: 10px; z-index: 1000;';
        
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-hidden');
        });
        
        document.body.appendChild(toggleBtn);
        
        // Add mobile sidebar styles
        const mobileStyle = document.createElement('style');
        mobileStyle.textContent = `
            @media (max-width: 768px) {
                .sidebar.mobile-hidden {
                    transform: translateX(-100%);
                }
                .sidebar {
                    transition: transform 0.3s ease;
                    position: fixed;
                    z-index: 999;
                    height: 100%;
                }
            }
        `;
        document.head.appendChild(mobileStyle);
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = getCookie('access_token');
    const currentPath = window.location.pathname;
    
    if (!token && currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
        showTGNotification('Требуется авторизация', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    }
}

// Get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Add Telegram-like animations
function addTelegramAnimations() {
    // Add loading animation for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.animation = 'fadeIn 0.5s ease';
        });
    });
    
    // Add hover animation to cards
    const cards = document.querySelectorAll('.stat-card, .chat-item');
    cards.forEach(card => {
        card.style.transition = 'all 0.2s ease';
    });
    
    // Add scroll animations
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.tg-header');
        if (header) {
            if (window.scrollY > 10) {
                header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            } else {
                header.style.boxShadow = 'none';
            }
        }
    });
}

// Email validation
function validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        showInputError(input, 'Введите корректный email адрес');
        return false;
    } else {
        clearInputError(input);
        return true;
    }
}

// Password strength indicator
function showPasswordStrength(input) {
    const password = input.value;
    const strengthIndicator = input.parentElement.querySelector('.password-strength') || 
                              createPasswordStrengthIndicator(input);
    
    let strength = 0;
    let message = '';
    let color = '#ff3b30';
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch(strength) {
        case 0:
            message = 'Слишком короткий';
            color = '#ff3b30';
            break;
        case 1:
            message = 'Слабый';
            color = '#ff3b30';
            break;
        case 2:
            message = 'Средний';
            color = '#ffcc00';
            break;
        case 3:
            message = 'Хороший';
            color = '#32a955';
            break;
        case 4:
            message = 'Отличный';
            color = '#32a955';
            break;
    }
    
    strengthIndicator.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
            <div style="display: flex; gap: 2px;">
                <div style="width: 20px; height: 4px; background: ${strength >= 1 ? color : '#e5e5e5'}; border-radius: 2px;"></div>
                <div style="width: 20px; height: 4px; background: ${strength >= 2 ? color : '#e5e5e5'}; border-radius: 2px;"></div>
                <div style="width: 20px; height: 4px; background: ${strength >= 3 ? color : '#e5e5e5'}; border-radius: 2px;"></div>
                <div style="width: 20px; height: 4px; background: ${strength >= 4 ? color : '#e5e5e5'}; border-radius: 2px;"></div>
            </div>
            <span style="font-size: 12px; color: ${color};">${message}</span>
        </div>
    `;
}

function createPasswordStrengthIndicator(input) {
    const indicator = document.createElement('div');
    indicator.className = 'password-strength';
    input.parentElement.appendChild(indicator);
    return indicator;
}

// Show input error
function showInputError(input, message) {
    clearInputError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.style.cssText = `
        color: var(--tg-red);
        font-size: 12px;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
    `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    input.parentElement.appendChild(errorDiv);
    input.style.borderColor = 'var(--tg-red)';
}

// Clear input error
function clearInputError(input) {
    const existingError = input.parentElement.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
    input.style.borderColor = '';
}

// Main notification function
function showTGNotification(message, type = 'info') {
    const container = document.getElementById('tg-notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = 'tg-notification-item';
    
    const colors = {
        'success': '#32a955',
        'error': '#ff3b30',
        'warning': '#ffcc00',
        'info': '#3390ec'
    };
    
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const color = colors[type] || '#3390ec';
    const icon = icons[type] || 'info-circle';
    
    notification.style.cssText = `
        background: white;
        color: var(--tg-text-primary);
        padding: 14px 20px;
        border-radius: 12px;
        box-shadow: var(--tg-shadow-lg);
        border: 1px solid var(--tg-border);
        border-left: 4px solid ${color};
        animation: slideInRight 0.3s ease;
        max-width: 320px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        transition: transform 0.2s ease;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${icon}" style="color: ${color}; font-size: 16px; flex-shrink: 0;"></i>
        <span style="flex: 1;">${message}</span>
        <button class="close-notification" style="background: none; border: none; color: var(--tg-text-muted); cursor: pointer; padding: 4px; margin-left: 8px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Add hover effect
    notification.addEventListener('mouseenter', function() {
        this.style.transform = 'translateX(-5px)';
    });
    
    notification.addEventListener('mouseleave', function() {
        this.style.transform = 'translateX(0)';
    });
    
    // Close button
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        removeNotification(notification);
    });
    
    // Click to close
    notification.addEventListener('click', function() {
        removeNotification(notification);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

// Remove notification with animation
function removeNotification(notification) {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Add global error handler
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showTGNotification('Произошла ошибка. Пожалуйста, обновите страницу.', 'error');
});

// Add beforeunload handler
window.addEventListener('beforeunload', function() {
    // Show loading indicator
    const loading = document.createElement('div');
    loading.id = 'tg-loading';
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-size: 18px;
        color: var(--tg-blue);
    `;
    loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
    document.body.appendChild(loading);
});

// Export functions for debugging
window.TelegramApp = {
    showNotification: showTGNotification,
    init: initTelegramApp,
    validateEmail: validateEmail
};

console.log('%c🔧 Telegram App initialized with debug functions', 'color: #3390ec;');
console.log('%cℹ️  Use TelegramApp.showNotification("message", "type") to show notifications', 'color: #32a955;');