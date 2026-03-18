// frontend/src/SimpleApp.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect, useRef } from 'react';

// Функция для получения правильного URL бэкенда
function getApiUrl() {
    // Если мы в Codespaces
    if (window.location.hostname.includes('github.dev') || window.location.hostname.includes('preview.app.github.dev')) {
        // Заменяем порт 3000 на 8000 в URL
        return window.location.hostname.replace('3000', '8000');
    }
    // Если локально
    return 'http://localhost:8000';
}

const API_URL = getApiUrl();

function SimpleApp() {
    const [mode, setMode] = useState('scene');
    const [result, setResult] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [serverStatus, setServerStatus] = useState('checking');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Проверяем соединение с сервером при загрузке
    useEffect(() => {
        checkServerConnection();
    }, []);

    // Запускаем камеру
    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const checkServerConnection = async () => {
        try {
            const response = await fetch(`${API_URL}/health`);
            if (response.ok) {
                setServerStatus('connected');
                console.log('✅ Сервер подключен');
            } else {
                setServerStatus('error');
            }
        } catch (error) {
            console.error('❌ Сервер не отвечает:', error);
            setServerStatus('error');
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraReady(true);
        } catch (error) {
            console.error('Ошибка камеры:', error);
        }
    };

    const captureAndProcess = async () => {
        if (!videoRef.current || isProcessing) return;

        setIsProcessing(true);
        setResult('Анализирую...');
        
        try {
            // Делаем фото
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            
            // Конвертируем в blob
            const blob = await new Promise(resolve => 
                canvas.toBlob(resolve, 'image/jpeg', 0.8)
            );
            
            const formData = new FormData();
            formData.append('file', blob, 'photo.jpg');

            // Выбираем endpoint в зависимости от режима
            let endpoint = mode === 'scene' 
                ? `${API_URL}/api/analyze/scene`
                : `${API_URL}/api/detect/objects`;

            console.log('Отправка на:', endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Ответ:', data);
            
            if (data.success) {
                let message = '';
                if (mode === 'scene') {
                    message = data.description || 'Сцена проанализирована';
                } else {
                    const objects = data.objects || [];
                    if (objects.length > 0) {
                        message = `Обнаружено: ${objects.map(obj => 
                            `${obj.name} ${obj.position}`
                        ).join(', ')}`;
                    } else {
                        message = 'Объекты не найдены';
                    }
                }
                setResult(message);
                speak(message);
            } else {
                throw new Error(data.error || 'Неизвестная ошибка');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            setResult('Ошибка соединения с сервером');
            speak('Ошибка соединения. Проверьте подключение к серверу.');
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Показываем статус подключения
    if (serverStatus === 'checking') {
        return (
            <div style={styles.container}>
                <div style={styles.statusBox}>
                    Проверка подключения к серверу...
                </div>
            </div>
        );
    }

    if (serverStatus === 'error') {
        return (
            <div style={styles.errorScreen}>
                <h1>❌ Ошибка подключения</h1>
                <p>Не удалось подключиться к серверу</p>
                <p style={styles.small}>URL: {API_URL}</p>
                <button 
                    style={styles.retryButton}
                    onClick={() => {
                        setServerStatus('checking');
                        checkServerConnection();
                    }}
                >
                    Повторить попытку
                </button>
                <button 
                    style={styles.manualButton}
                    onClick={() => {
                        const url = prompt('Введите адрес сервера:', API_URL);
                        if (url) {
                            window.API_URL = url;
                            setServerStatus('checking');
                            checkServerConnection();
                        }
                    }}
                >
                    Ввести адрес вручную
                </button>
            </div>
        );
    }

    if (!cameraReady) {
        return (
            <div style={styles.permissionScreen}>
                <h1>📱 Электронный попутчик</h1>
                <p>Для работы нужен доступ к камере</p>
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
                {mode === 'scene' ? '🌳 Обзор сцены' : '⚠️ Поиск препятствий'}
                <span style={styles.statusDot}></span>
            </div>

            {result && (
                <div style={styles.resultBox}>
                    {result}
                </div>
            )}

            <div style={styles.bottomBar}>
                <button 
                    style={{
                        ...styles.captureButton,
                        opacity: isProcessing ? 0.5 : 1
                    }}
                    onClick={captureAndProcess}
                    disabled={isProcessing}
                >
                    {isProcessing ? '⏳' : '📸'}
                </button>
                
                <div style={styles.modeSelector}>
                    <button 
                        style={{
                            ...styles.modeBtn,
                            background: mode === 'scene' ? '#4CAF50' : '#666'
                        }}
                        onClick={() => setMode('scene')}
                    >
                        🌳
                    </button>
                    <button 
                        style={{
                            ...styles.modeBtn,
                            background: mode === 'objects' ? '#4CAF50' : '#666'
                        }}
                        onClick={() => setMode('objects')}
                    >
                        ⚠️
                    </button>
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
    statusBox: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center'
    },
    errorScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
    },
    small: {
        fontSize: '12px',
        color: '#888',
        margin: '10px 0'
    },
    retryButton: {
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '15px 30px',
        fontSize: '18px',
        borderRadius: '10px',
        margin: '10px',
        cursor: 'pointer'
    },
    manualButton: {
        background: '#666',
        color: 'white',
        border: 'none',
        padding: '15px 30px',
        fontSize: '18px',
        borderRadius: '10px',
        margin: '10px',
        cursor: 'pointer'
    },
    permissionScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
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
        right: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '30px',
        fontSize: '18px',
        backdropFilter: 'blur(5px)'
    },
    statusDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#4CAF50',
        display: 'inline-block'
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
        border: '2px solid #4CAF50',
        backdropFilter: 'blur(5px)'
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
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
    },
    modeSelector: {
        display: 'flex',
        gap: 10,
        background: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 50,
        backdropFilter: 'blur(5px)'
    },
    modeBtn: {
        width: '50px',
        height: '50px',
        borderRadius: '25px',
        border: 'none',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default SimpleApp;