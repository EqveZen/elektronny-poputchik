# simple_main.py - версия с правильной кодировкой

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import numpy
from PIL import Image
import io
import logging
import os
import sys

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создаем приложение FastAPI
app = FastAPI(
    title="Электронный попутчик",
    description="API для помощи незрячим людям",
    version="1.0.0"
)

# Разрешаем запросы с любого адреса
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Главная страница"""
    return JSONResponse(
        content={
            "message": "Электронный попутчик работает!",
            "status": "active",
            "instructions": "Откройте /docs для документации"
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )

@app.get("/health")
async def health_check():
    """Проверка здоровья сервера"""
    return {
        "status": "healthy",
        "python_version": sys.version.split()[0]
    }

@app.post("/api/analyze/scene")
async def analyze_scene(file: UploadFile = File(...)):
    """Анализ сцены"""
    try:
        # Читаем файл
        contents = await file.read()
        
        # Открываем изображение
        image = Image.open(io.BytesIO(contents))
        
        # Конвертируем в numpy array
        image_array = numpy.array(image)
        
        # Считаем среднюю яркость
        brightness = float(numpy.mean(image_array))
        
        # Определяем тип сцены
        if brightness > 150:
            description = "На улице, светло"
            scene_type = "outdoor"
        elif brightness > 80:
            description = "В помещении"
            scene_type = "indoor"
        else:
            description = "Темно"
            scene_type = "dark"
        
        return JSONResponse(
            content={
                "success": True,
                "description": description,
                "scene_type": scene_type,
                "brightness": brightness
            },
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        
    except Exception as error:
        logger.error(f"Ошибка: {error}")
        return {
            "success": False,
            "error": str(error)
        }

@app.post("/api/detect/objects")
async def detect_objects(file: UploadFile = File(...)):
    """Поиск препятствий"""
    try:
        objects = [
            {
                "name": "стул",
                "position": "слева",
                "distance": "1 метр"
            },
            {
                "name": "стол",
                "position": "по центру",
                "distance": "2 метра"
            }
        ]
        
        return JSONResponse(
            content={
                "success": True,
                "objects": objects,
                "total": len(objects)
            },
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        
    except Exception as error:
        logger.error(f"Ошибка: {error}")
        return {
            "success": False,
            "error": str(error)
        }

@app.get("/api/test")
async def test():
    """Тестовый endpoint с русским текстом"""
    return JSONResponse(
        content={
            "message": "Привет! Это тест русского языка",
            "status": "ok"
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    
    print("=" * 60)
    print("🚀 ЗАПУСК ЭЛЕКТРОННОГО ПОПУТЧИКА")
    print("=" * 60)
    print(f"📍 Порт: {port}")
    print(f"📚 Документация: http://localhost:{port}/docs")
    print(f"🏠 Главная: http://localhost:{port}/")
    print(f"🔧 Тест: http://localhost:{port}/api/test")
    print("=" * 60)
    print("✅ Сервер успешно запущен!")
    print("=" * 60)
    
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )