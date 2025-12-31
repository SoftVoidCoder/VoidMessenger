document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordMatch = document.getElementById('passwordMatch');
    const successMessage = document.getElementById('successMessage');

    // Проверка сложности пароля
    passwordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        let strength = 0;
        let text = '';
        let color = '#f72585';

        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        switch(strength) {
            case 0:
                text = 'Очень слабый';
                color = '#f72585';
                break;
            case 1:
                text = 'Слабый';
                color = '#fb5607';
                break;
            case 2:
                text = 'Средний';
                color = '#ffbe0b';
                break;
            case 3:
                text = 'Хороший';
                color = '#4cc9f0';
                break;
            case 4:
                text = 'Отличный';
                color = '#38b000';
                break;
        }

        strengthBar.style.width = (strength * 25) + '%';
        strengthBar.style.background = color;
        strengthText.textContent = text;
        strengthText.style.color = color;
    });

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
        } else {
            passwordMatch.textContent = '✗ Пароли не совпадают';
            passwordMatch.style.color = '#f72585';
        }
    }

    passwordInput.addEventListener('input', checkPasswordMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    // Обработка формы регистрации
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Проверка совпадения паролей
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert('Пароли не совпадают!');
            return;
        }

        // Проверка сложности пароля
        if (passwordInput.value.length < 6) {
            alert('Пароль должен содержать минимум 6 символов!');
            return;
        }

        // Сбор данных формы
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value || null,
            password: passwordInput.value
        };

        try {
            // Отправка запроса на регистрацию
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Показываем сообщение об успехе
                registerForm.style.display = 'none';
                successMessage.style.display = 'block';

                // Перенаправляем на страницу входа через 3 секунды
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                const errorData = await response.json();
                alert(`Ошибка регистрации: ${errorData.detail || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при соединении с сервером');
        }
    });

    // Плавная валидация при фокусе
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});