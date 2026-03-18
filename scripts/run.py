#!/usr/bin/env python3
import subprocess
import time
import os

print("🚀 Запуск Электронного попутчика...")

# Проверяем что мы в правильной папке
if not os.path.exists('backend'):
    print("❌ Ошибка: Запустите скрипт из корневой папки проекта")
    exit(1)

# Устанавливаем зависимости бэкенда
print("📦 Установка Python пакетов...")
subprocess.run('cd backend && pip install -r requirements-simple.txt', shell=True)

# Запускаем бэкенд
print("🖥️ Запуск бэкенда...")
backend = subprocess.Popen(
    'cd backend && python simple_main.py',
    shell=True
)

# Ждем 3 секунды
time.sleep(3)

# Запускаем фронтенд
print("🎨 Запуск фронтенда...")
frontend = subprocess.Popen(
    'cd frontend && npm install && npm start',
    shell=True
)

print("\n✅ Все запущено!")
print("📱 Откройте в браузере: http://localhost:3000")
print("🔧 API документация: http://localhost:8000/docs")
print("\n⚠️ Нажмите Ctrl+C для остановки\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n🛑 Остановка...")
    backend.terminate()
    frontend.terminate()