
🧠 Asistente Inteligente SQL Conta & Obras – Distrito K
Este proyecto es un asistente conversacional basado en inteligencia artificial que permite a los usuarios interactuar por texto, voz, imagen o vídeo para obtener respuestas precisas sobre los ERP SQL Conta y SQL Obras de Distrito K.



📌 Descripción
El asistente permite:

Enviar preguntas por texto, audio, imagen o vídeo.

Extraer texto automáticamente desde imágenes y vídeos (OCR + STT).

Transcribir vídeos con inteligencia artificial (HappyScribe).

Obtener respuestas estructuradas y enriquecidas desde Google Gemini.

Usar FFmpeg en navegador para convertir y recortar vídeos.

⚙️ Tecnologías

Tecnología	Uso principal
JavaScript	Lógica del cliente y procesamiento de medios
Node.js + Express	Servidor backend para API y transcripciones
FFmpeg.wasm	Conversión y recorte de vídeo en navegador
Tesseract.js	OCR para imágenes o capturas de cámara
Whisper	Transcripción de audio local con Whisper CLI
HappyScribe API	Transcripción automática de vídeo
Gemini (Google)	Generación de respuestas basadas en IA
HTML/CSS	UI/UX accesible y amigable

🧱 Arquitectura


🧠 APIs
- /api/gemini               → IA Gemini para generar respuestas
- /api/ocr                  → OCR desde imagen o cámara
- /api/audio-transcript     → Transcripción local con Whisper
- /api/transcribe-video     → Transcripción de vídeo (HappyScribe)



