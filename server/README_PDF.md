# Настройка экспорта в PDF

Для работы экспорта презентаций в PDF необходимо установить Chrome/Chromium.

## Варианты установки

### Вариант 1: Установка системного Chrome (рекомендуется для продакшена)

#### Linux (Ubuntu/Debian):
```bash
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable
```

#### Linux (CentOS/RHEL):
```bash
sudo yum install -y google-chrome-stable
```

#### Использование скрипта:
```bash
chmod +x server/install-chrome.sh
sudo ./server/install-chrome.sh
```

### Вариант 2: Установка через Puppeteer (для разработки)

```bash
cd server
npx puppeteer browsers install chrome
```

### Вариант 3: Указание пути к Chrome вручную

Если Chrome установлен в нестандартном месте, укажите путь через переменную окружения:

```bash
export PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

Или в `.env` файле:
```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

## Проверка установки

После установки проверьте, что Chrome доступен:

```bash
which google-chrome
# или
google-chrome --version
```

## Решение проблем

### Ошибка: "Could not find Chrome"

1. Убедитесь, что Chrome установлен: `which google-chrome`
2. Если Chrome установлен, но не найден, укажите путь через `PUPPETEER_EXECUTABLE_PATH`
3. Для продакшена рекомендуется использовать системный Chrome

### Ошибка: "Failed to launch browser"

Добавьте права на выполнение:
```bash
chmod +x /usr/bin/google-chrome
```

### Проблемы с правами в Docker

Если используете Docker, добавьте в Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y \
    google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*
```

И запускайте с флагами:
```javascript
args: ['--no-sandbox', '--disable-setuid-sandbox']
```
