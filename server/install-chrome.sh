#!/bin/bash
# Скрипт для установки Chrome для Puppeteer

echo "Установка Chrome для Puppeteer..."

# Определяем ОС
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Обнаружена Linux система"
    
    # Проверяем, установлен ли Chrome
    if command -v google-chrome &> /dev/null; then
        echo "Chrome уже установлен: $(which google-chrome)"
        exit 0
    fi
    
    # Устанавливаем зависимости
    if command -v apt-get &> /dev/null; then
        echo "Установка через apt-get..."
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
        echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
        apt-get update
        apt-get install -y google-chrome-stable
    elif command -v yum &> /dev/null; then
        echo "Установка через yum..."
        yum install -y google-chrome-stable
    else
        echo "Не удалось определить пакетный менеджер. Установите Chrome вручную."
        exit 1
    fi
    
    # Проверяем установку
    if command -v google-chrome &> /dev/null; then
        echo "Chrome успешно установлен: $(which google-chrome)"
    else
        echo "Ошибка: Chrome не найден после установки"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Обнаружена macOS система"
    echo "Установите Chrome вручную с https://www.google.com/chrome/"
    exit 0
else
    echo "Неизвестная ОС: $OSTYPE"
    echo "Установите Chrome вручную с https://www.google.com/chrome/"
    exit 1
fi

echo "Готово!"
