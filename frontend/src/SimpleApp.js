import React, { useState, useEffect, useRef } from 'react';

// Определяем адрес сервера
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SimpleApp() {
    const [mode, setMode] = useState('scene'); // 'scene' или 'objects'
    const [result, setResult] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Запускаем камеру при загрузке
    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } // задняя камера
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraReady(true);
        } catch (error) {
            console.error('Ошибка камеры:', error);
            alert('Нужен доступ к камере!');
        }
    };

    const captureAndProcess = async () => {
        if (!videoRef.current || isProcessing) return;

        setIsProcessing(true);
        
        try {
            // Делаем фото
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            
            // Конвертируем в файл
            const blob = await new Promise(resolve => 
                canvas.toBlob(resolve, 'image/jpeg')
            );
            
            const formData = new FormData();
            formData.append('file', blob, 'photo.jpg');

            // Отправляем на сервер
            let endpoint = mode === 'scene' 
                ? `${API_URL}/api/analyze/scene`
                : `${API_URL}/api/detect/objects`;

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                let message = '';
                if (mode === 'scene') {
                    message = data.result.description;
                } else {
                    message = `Найдено объектов: ${data.count}`;
                }
                setResult(message);
                speak(message);
            }
        } catch (error) {
            setResult('Ошибка соединения');
            speak('Ошибка');
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            window.speechSynthesis.speak(utterance);
        }
    };

    if (!cameraReady) {
        return (
            <div style={styles.permissionScreen}>
                <h1>Электронный попутчик</h1>
                <button onClick={startCamera} style={styles.button}>
                    Включить камеру
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={styles.video}
            />
            
            <div style={styles.topBar}>
                {mode === 'scene' ? '🌳 Обзор' : '⚠️ Препятствия'}
            </div>

            {result && (
                <div style={styles.resultBox}>
                    {result}
                </div>
            )}

            <div style={styles.bottomBar}>
                <button 
                    style={styles.captureButton}
                    onClick={captureAndProcess}
                    disabled={isProcessing}
                >
                    {isProcessing ? '⏳' : '📸'}
                </button>
                
                <div style={styles.modeSelector}>
                    <button 
                        style={{...styles.modeBtn, background: mode === 'scene' ? '#4CAF50' : '#666'}}
                        onClick={() => setMode('scene')}
                    >🌳</button>
                    <button 
                        style={{...styles.modeBtn, background: mode === 'objects' ? '#4CAF50' : '#666'}}
                        onClick={() => setMode('objects')}
                    >⚠️</button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'black'
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    permissionScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: 'white',
        padding: '20px'
    },
    button: {
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '20px 40px',
        fontSize: '20px',
        borderRadius: '50px',
        marginTop: '20px',
        cursor: 'pointer'
    },
    topBar: {
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '30px',
        fontSize: '18px'
    },
    resultBox: {
        position: 'absolute',
        bottom: 200,
        left: 20,
        right: 20,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '20px',
        textAlign: 'center',
        fontSize: '18px',
        border: '2px solid #4CAF50'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20
    },
    captureButton: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#4CAF50',
        border: 'none',
        color: 'white',
        fontSize: '40px',
        cursor: 'pointer'
    },
    modeSelector: {
        display: 'flex',
        gap: 10,
        background: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 50
    },
    modeBtn: {
        width: '50px',
        height: '50px',
        borderRadius: '25px',
        border: 'none',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer'
    }
};

export default SimpleApp;