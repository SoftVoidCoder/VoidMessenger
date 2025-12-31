// app/static/js/auth.js - обновленная версия
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const successMessage = document.getElementById('successMessage');
    
    // Показать/скрыть пароль
    document.getElementById('togglePassword')?.addEventListener('click', function() {
        togglePasswordVisibility('password');
    });
    
    document.getElementById('toggleConfirmPassword')?.addEventListener('click', function() {
        togglePasswordVisibility('confirmPassword');
    });
    
    // Отправка формы регистрации
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                username: usernameInput.value.trim(),
                email: document.getElementById('email')?.value.trim() || null,
                password: passwordInput.value
            };
            
            // Индикатор загрузки
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
            submitBtn.disabled = true;
            
            try {
                // Регистрация
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    // Успешная регистрация
                    registerForm.style.display = 'none';
                    successMessage.style.display = 'block';
                    
                    // Автоматический логин
                    const loginFormData = new URLSearchParams();
                    loginFormData.append('username', formData.username);
                    loginFormData.append('password', formData.password);
                    
                    const loginResponse = await fetch('/api/token', {
                        method: 'POST',
                        body: loginFormData
                    });
                    
                    if (loginResponse.ok) {
                        const tokenData = await loginResponse.json();
                        // Сохраняем токен
                        localStorage.setItem('token', tokenData.access_token);
                        
                        // Редирект в чат через 1 секунду
                        successMessage.innerHTML = `
                            <div class="success-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3>Регистрация успешна!</h3>
                            <p>Авторизация... Переход в чат через 1 секунду</p>
                        `;
                        
                        setTimeout(() => {
                            window.location.href = '/chat';
                        }, 1000);
                    } else {
                        // Если авторизация не удалась
                        successMessage.innerHTML = `
                            <div class="success-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3>Регистрация успешна!</h3>
                            <p>Теперь вы можете <a href="/login" class="link">войти в систему</a></p>
                        `;
                    }
                } else {
                    const errorData = await response.json();
                    alert(`Ошибка регистрации: ${errorData.detail || 'Неизвестная ошибка'}`);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при соединении с сервером');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Функции
    function togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(`${inputId}-icon`);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
});