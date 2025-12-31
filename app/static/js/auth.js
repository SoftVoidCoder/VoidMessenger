document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');
    const successMessage = document.getElementById('successMessage');
    const loginError = document.getElementById('loginError');
    
    // Элементы для отображения ошибок
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const termsError = document.getElementById('termsError');
    const passwordMatch = document.getElementById('passwordMatch');
    
    // Элементы для индикатора силы пароля
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordLength = document.getElementById('passwordLength');
    
    // Показать/скрыть пароль
    if (document.getElementById('togglePassword')) {
        document.getElementById('togglePassword').addEventListener('click', function() {
            togglePasswordVisibility('password');
        });
    }
    
    if (document.getElementById('toggleConfirmPassword')) {
        document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
            togglePasswordVisibility('confirmPassword');
        });
    }
    
    // Функция переключения видимости пароля
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
    
    // Обновление индикатора длины пароля
    function updatePasswordLength(password) {
        if (passwordLength) {
            passwordLength.textContent = `Длина: ${password.length}/32 символов`;
            
            // Изменение цвета в зависимости от длины
            if (password.length < 6) {
                passwordLength.style.color = '#f72585';
            } else if (password.length < 12) {
                passwordLength.style.color = '#ffbe0b';
            } else {
                passwordLength.style.color = '#38b000';
            }
        }
    }
    
    // Проверка сложности пароля
    function checkPasswordStrength(password) {
        if (!strengthBar || !strengthText) return;
        
        let strength = 0;
        let text = '';
        let color = '#f72585';
        let width = '0%';

        if (password.length >= 6) {
            strength++;
            width = '25%';
            color = '#fb5607';
            text = 'Слабый';
        }
        if (password.length >= 8) {
            strength++;
            width = '50%';
            color = '#ffbe0b';
            text = 'Средний';
        }
        if (/[A-Z]/.test(password)) {
            strength++;
            width = '75%';
            color = '#4cc9f0';
            text = 'Хороший';
        }
        if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
            strength++;
            width = '100%';
            color = '#38b000';
            text = 'Отличный';
        }
        
        // Если пароль пустой
        if (password.length === 0) {
            width = '0%';
            text = 'Надежность пароля';
            color = '#f72585';
        }

        strengthBar.style.width = width;
        strengthBar.style.background = color;
        strengthText.textContent = text;
        strengthText.style.color = color;
    }
    
    // Проверка совпадения паролей
    function checkPasswordMatch() {
        if (!confirmPasswordInput) return false;
        
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput.value;

        if (confirmPassword === '') {
            if (passwordMatch) {
                passwordMatch.textContent = '';
                passwordMatch.style.color = '';
            }
            return false;
        } else if (password === confirmPassword) {
            if (passwordMatch) {
                passwordMatch.textContent = '✓ Пароли совпадают';
                passwordMatch.style.color = '#38b000';
            }
            return true;
        } else {
            if (passwordMatch) {
                passwordMatch.textContent = '✗ Пароли не совпадают';
                passwordMatch.style.color = '#f72585';
            }
            return false;
        }
    }
    
    // Валидация формы регистрации
    function validateRegisterForm() {
        let isValid = true;
        
        // Очистка предыдущих ошибок
        if (usernameError) usernameError.textContent = '';
        if (passwordError) passwordError.textContent = '';
        if (termsError) termsError.textContent = '';
        
        // Проверка имени пользователя
        const username = usernameInput.value.trim();
        if (username.length < 3 || username.length > 50) {
            if (usernameError) {
                usernameError.textContent = 'Имя пользователя должно быть от 3 до 50 символов';
            }
            isValid = false;
        }
        
        // Проверка пароля
        const password = passwordInput.value;
        if (password.length < 6) {
            if (passwordError) {
                passwordError.textContent = 'Пароль должен быть не менее 6 символов';
            }
            isValid = false;
        } else if (password.length > 32) {
            if (passwordError) {
                passwordError.textContent = 'Пароль не должен превышать 32 символа';
            }
            isValid = false;
        }
        
        // Проверка совпадения паролей
        if (!checkPasswordMatch()) {
            isValid = false;
        }
        
        // Проверка чекбокса
        if (termsCheckbox && !termsCheckbox.checked) {
            if (termsError) {
                termsError.textContent = 'Необходимо принять условия использования';
            }
            isValid = false;
        }
        
        return isValid;
    }
    
    // Обработка ввода пароля
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Обновление длины
            updatePasswordLength(password);
            
            // Обновление силы пароля
            checkPasswordStrength(password);
            
            // Проверка совпадения паролей
            checkPasswordMatch();
            
            // Очистка ошибки
            if (passwordError) passwordError.textContent = '';
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Обработка ввода имени пользователя
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            if (usernameError) usernameError.textContent = '';
        });
    }
    
    // Обработка чекбокса
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', function() {
            if (termsError) termsError.textContent = '';
        });
    }
    
    // Обработка отправки формы регистрации
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Валидация формы
            if (!validateRegisterForm()) {
                return;
            }
            
            // Сбор данных формы
            const formData = {
                username: usernameInput.value.trim(),
                email: document.getElementById('email') ? document.getElementById('email').value.trim() || null : null,
                password: passwordInput.value
            };
            
            // Показываем индикатор загрузки
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
            submitBtn.disabled = true;
            
            try {
                // Регистрация - путь: /api/register
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // УСПЕШНАЯ РЕГИСТРАЦИЯ - АВТОМАТИЧЕСКИЙ ВХОД
                    registerForm.style.display = 'none';
                    if (successMessage) successMessage.style.display = 'block';
                    
                    // АВТОМАТИЧЕСКИЙ ЛОГИН ПОСЛЕ РЕГИСТРАЦИИ
                    const loginFormData = new URLSearchParams();
                    loginFormData.append('username', formData.username);
                    loginFormData.append('password', formData.password);
                    
                    try {
                        const loginResponse = await fetch('/api/token', {
                            method: 'POST',
                            body: loginFormData
                        });
                        
                        if (loginResponse.ok) {
                            const tokenData = await loginResponse.json();
                            // Сохраняем токен в localStorage
                            localStorage.setItem('token', tokenData.access_token);
                            // Сохраняем токен в куки для FastAPI
                            document.cookie = `token=${tokenData.access_token}; path=/; max-age=86400; SameSite=Lax`;
                            
                            // Обновляем сообщение об успехе
                            if (successMessage) {
                                successMessage.innerHTML = `
                                    <div class="success-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <h3>Регистрация успешна!</h3>
                                    <p>Авторизация... Переход в чат через 1 секунду</p>
                                `;
                            }
                            
                            // РЕДИРЕКТ В ЧАТ ЧЕРЕЗ 1 СЕКУНДУ
                            setTimeout(() => {
                                window.location.href = '/chat';
                            }, 1000);
                        } else {
                            // Если авторизация не удалась
                            if (successMessage) {
                                successMessage.innerHTML = `
                                    <div class="success-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <h3>Регистрация успешна!</h3>
                                    <p>Теперь вы можете <a href="/login" class="link">войти в систему</a></p>
                                `;
                            }
                        }
                    } catch (loginError) {
                        console.error('Ошибка автологина:', loginError);
                        if (successMessage) {
                            successMessage.innerHTML = `
                                <div class="success-icon">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <h3>Регистрация успешна!</h3>
                                <p>Теперь вы можете <a href="/login" class="link">войти в систему</a></p>
                            `;
                        }
                    }
                } else {
                    // Показываем ошибку регистрации
                    if (data.detail) {
                        if (Array.isArray(data.detail)) {
                            // Ошибки валидации Pydantic
                            const errors = data.detail.map(err => err.msg).join(', ');
                            alert(`Ошибка регистрации: ${errors}`);
                        } else {
                            alert(`Ошибка регистрации: ${data.detail}`);
                        }
                    } else {
                        alert('Неизвестная ошибка регистрации');
                    }
                    
                    // Возвращаем кнопку в исходное состояние
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при соединении с сервером');
                
                // Возвращаем кнопку в исходное состояние
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Обработка отправки формы входа
    // Обработка отправки формы входа
// Обработка отправки формы входа
// Обработка отправки формы входа
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/token', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const tokenData = await response.json();
                
                // Сохраняем токен в localStorage
                localStorage.setItem('token', tokenData.access_token);
                
                // Устанавливаем куки с токеном
                // Важно указать max-age и path
                document.cookie = `token=${tokenData.access_token}; path=/; max-age=${60*60*24*7}; SameSite=Lax`;
                
                // Добавляем токен в localStorage для использования в запросах
                localStorage.setItem('auth_token', tokenData.access_token);
                
                // Проверяем авторизацию перед переходом
                try {
                    // Делаем тестовый запрос с токеном
                    const testResponse = await fetch('/api/users/me', {
                        headers: {
                            'Authorization': `Bearer ${tokenData.access_token}`
                        }
                    });
                    
                    if (testResponse.ok) {
                        // Успешно - переходим в чат
                        window.location.href = '/chat';
                    } else {
                        throw new Error('Ошибка авторизации');
                    }
                } catch (testError) {
                    console.error('Ошибка проверки авторизации:', testError);
                    alert('Ошибка авторизации. Попробуйте еще раз.');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                
            } else {
                const errorData = await response.json();
                alert(`Ошибка входа: ${errorData.detail || 'Неизвестная ошибка'}`);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения с сервером');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}
    
    // Инициализация при загрузке
    if (passwordLength) {
        updatePasswordLength('');
    }
    if (strengthBar && strengthText) {
        checkPasswordStrength('');
    }
});