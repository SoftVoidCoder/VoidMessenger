document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');
    const successMessage = document.getElementById('successMessage');
    
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
    document.getElementById('togglePassword').addEventListener('click', function() {
        togglePasswordVisibility('password');
    });
    
    document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
        togglePasswordVisibility('confirmPassword');
    });
    
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
    
    // Проверка сложности пароля
    function checkPasswordStrength(password) {
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
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (confirmPassword === '') {
            passwordMatch.textContent = '';
            passwordMatch.style.color = '';
        } else if (password === confirmPassword) {
            passwordMatch.textContent = '✓ Пароли совпадают';
            passwordMatch.style.color = '#38b000';
            return true;
        } else {
            passwordMatch.textContent = '✗ Пароли не совпадают';
            passwordMatch.style.color = '#f72585';
            return false;
        }
        return false;
    }
    
    // Валидация формы
    function validateForm() {
        let isValid = true;
        
        // Очистка предыдущих ошибок
        usernameError.textContent = '';
        passwordError.textContent = '';
        termsError.textContent = '';
        
        // Проверка имени пользователя
        const username = usernameInput.value.trim();
        if (username.length < 3 || username.length > 50) {
            usernameError.textContent = 'Имя пользователя должно быть от 3 до 50 символов';
            isValid = false;
        }
        
        // Проверка пароля
        const password = passwordInput.value;
        if (password.length < 6) {
            passwordError.textContent = 'Пароль должен быть не менее 6 символов';
            isValid = false;
        } else if (password.length > 32) {
            passwordError.textContent = 'Пароль не должен превышать 32 символа';
            isValid = false;
        }
        
        // Проверка совпадения паролей
        if (!checkPasswordMatch()) {
            isValid = false;
        }
        
        // Проверка чекбокса
        if (!termsCheckbox.checked) {
            termsError.textContent = 'Необходимо принять условия использования';
            isValid = false;
        }
        
        return isValid;
    }
    
    // Обработка ввода пароля
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        // Обновление длины
        updatePasswordLength(password);
        
        // Обновление силы пароля
        checkPasswordStrength(password);
        
        // Проверка совпадения паролей
        checkPasswordMatch();
        
        // Очистка ошибки
        passwordError.textContent = '';
    });
    
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    
    // Обработка ввода имени пользователя
    usernameInput.addEventListener('input', function() {
        usernameError.textContent = '';
    });
    
    // Обработка чекбокса
    termsCheckbox.addEventListener('change', function() {
        termsError.textContent = '';
    });
    
    // Обработка отправки формы
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Валидация формы
        if (!validateForm()) {
            return;
        }
        
        // Сбор данных формы
        const formData = {
            username: usernameInput.value.trim(),
            email: document.getElementById('email').value.trim() || null,
            password: passwordInput.value
        };
        
        // Показываем индикатор загрузки
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
        submitBtn.disabled = true;
        
        try {
            // Отправка запроса на регистрацию
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Показываем сообщение об успехе
                registerForm.style.display = 'none';
                successMessage.style.display = 'block';
                
                // Перенаправляем на страницу входа через 3 секунды
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                // Показываем ошибку
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
    
    // Инициализация при загрузке
    updatePasswordLength('');
    checkPasswordStrength('');
});