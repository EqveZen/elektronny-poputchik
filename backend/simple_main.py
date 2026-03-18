from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image
import io
import logging
import cv2
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Электронный попутчик")

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
    return {"message": "Электронный попутчик работает!", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/analyze/scene")
async def analyze_scene(file: UploadFile = File(...)):
    """Простой анализ сцены"""
    try:
        # Читаем картинку
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image_np = np.array(image)
        
        # Простой анализ - средняя яркость
        brightness = np.mean(image_np)
        
        if brightness > 150:
            description = "На улице, светло"
        elif brightness > 80:
            description = "В помещении"
        else:
            description = "Темно"
        
        return {
            "success": True,
            "result": {
                "description": description,
                "brightness": float(brightness)
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/detect/objects")
async def detect_objects(file: UploadFile = File(...)):
    """Поиск препятствий"""
    try:
        # Имитация поиска препятствий
        return {
            "success": True,
            "objects": [
                {"class": "стул", "direction": "слева", "distance": "1 метр"},
                {"class": "стол", "direction": "прямо", "distance": "2 метра"}
            ],
            "count": 2
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )