// Проверка авторизации на каждой странице
document.addEventListener('DOMContentLoaded', function() {
    // Функция для получения токена
    function getToken() {
        return localStorage.getItem('token');
    }
    
    // Функция для проверки токена на сервере
    async function verifyToken(token) {
        try {
            const response = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Ошибка проверки токена:', error);
            return false;
        }
    }
    
    // Функция выхода
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('redirect_url');
        window.location.href = '/login';
    }
    
    // Проверяем токен при загрузке
    const token = getToken();
    const currentPath = window.location.pathname;
    
    // Страницы требующие авторизации
    const protectedPages = ['/chat'];
    
    // Проверяем нужна ли авторизация для этой страницы
    const needsAuth = protectedPages.some(page => currentPath.startsWith(page));
    
    // Если нужна авторизация, но токена нет
    if (needsAuth && !token) {
        console.log('Требуется авторизация, токен не найден');
        // Сохраняем куда хотели попасть
        localStorage.setItem('redirect_url', currentPath);
        // Редирект на логин
        window.location.href = '/login';
        return;
    }
    
    // Если есть токен и мы на защищенной странице - проверяем его
    if (needsAuth && token) {
        verifyToken(token).then(isValid => {
            if (!isValid) {
                console.log('Токен недействителен, выход из системы');
                logout();
            }
        }).catch(() => {
            logout();
        });
    }
    
    // Если на странице логина/регистрации и есть валидный токен - редирект в чат
    if ((currentPath === '/login' || currentPath === '/register') && token) {
        verifyToken(token).then(isValid => {
            if (isValid) {
                const redirectUrl = localStorage.getItem('redirect_url') || '/chat';
                localStorage.removeItem('redirect_url');
                console.log('Авторизован, редирект в:', redirectUrl);
                window.location.href = redirectUrl;
            }
        });
    }
    
    // Добавляем обработчик выхода
    const logoutLink = document.querySelector('a[href="/logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Добавляем токен во все fetch запросы к API
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // Добавляем токен в заголовки если это запрос к API и есть токен
        if (typeof url === 'string' && url.includes('/api/') && token) {
            if (!options.headers) {
                options.headers = {};
            }
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        return originalFetch.call(this, url, options);
    };
});