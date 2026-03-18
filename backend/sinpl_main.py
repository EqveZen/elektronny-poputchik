from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image
import io
import logging
import os

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создаем приложение FastAPI
app = FastAPI(title="Электронный попутчик")

# Разрешаем запросы с любого адреса (для разработки)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Главная страница API"""
    return {
        "message": "Электронный попутчик работает!",
        "status": "ok",
        "version": "0.1.0"
    }

@app.get("/health")
async def health():
    """Проверка здоровья сервера"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01"
    }

@app.post("/api/analyze/scene")
async def analyze_scene(file: UploadFile = File(...)):
    """
    Анализ сцены на фотографии
    """
    try:
        # Читаем загруженный файл
        logger.info(f"Получен файл: {file.filename}")
        contents = await file.read()
        
        # Конвертируем в изображение
        image = Image.open(io.BytesIO(contents))
        image_np = np.array(image)
        
        # Простой анализ - средняя яркость
        brightness = np.mean(image_np)
        
        # Определяем тип сцены по яркости
        if brightness > 150:
            description = "На улице, светло. Хорошая видимость."
            scene_type = "outdoor_day"
        elif brightness > 80:
            description = "В помещении. Среднее освещение."
            scene_type = "indoor"
        else:
            description = "Темно. Будьте осторожны."
            scene_type = "dark"
        
        # Размер изображения
        height, width = image_np.shape[:2]
        
        return {
            "success": True,
            "result": {
                "description": description,
                "scene_type": scene_type,
                "brightness": float(brightness),
                "width": width,
                "height": height
            }
        }
        
    except Exception as e:
        logger.error(f"Ошибка: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/detect/objects")
async def detect_objects(file: UploadFile = File(...)):
    """
    Поиск препятствий и объектов
    """
    try:
        logger.info(f"Поиск объектов в файле: {file.filename}")
        
        # Имитация поиска препятствий
        # В реальном проекте здесь будет YOLO
        
        objects = [
            {
                "class": "стул",
                "direction": "слева",
                "distance": "1 метр",
                "confidence": 0.85
            },
            {
                "class": "стол",
                "direction": "прямо перед вами",
                "distance": "2 метра",
                "confidence": 0.92
            }
        ]
        
        return {
            "success": True,
            "objects": objects,
            "count": len(objects),
            "warning": "Обнаружены предметы вблизи"
        }
        
    except Exception as e:
        logger.error(f"Ошибка: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/ocr/read")
async def read_text(file: UploadFile = File(...)):
    """
    Распознавание текста
    """
    try:
        logger.info(f"Распознавание текста в файле: {file.filename}")
        
        # Имитация распознавания текста
        return {
            "success": True,
            "result": {
                "text": "Аптека\nРежим работы: круглосуточно",
                "confidence": 0.88,
                "language": "ru"
            }
        }
        
    except Exception as e:
        logger.error(f"Ошибка: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    # Получаем порт из переменной окружения или используем 8000
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 Запуск сервера на порту {port}...")
    print(f"📝 Документация: http://localhost:{port}/docs")
    print(f"🏠 Главная: http://localhost:{port}/")
    
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )