import { updateFeedback } from './ui-utils.js';
import { loadFFmpeg, ffmpegInstance, ffmpegLoaded } from './ffmpeg-utils.js';
import config from './config.js';

let videoStream, videoChunks = [], videoRecorder;
const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
/**
 * Inicia la grabación de video.
 */
export async function startVideoRecording() {
  updateFeedback('🎥 Iniciando grabación de video...');
  
  const ffmpegReady = await loadFFmpeg();
  if (!ffmpegReady) {
    updateFeedback('❌ Error: FFmpeg no disponible.');
    return;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoStream = stream;
    videoChunks = [];
    
    const videoElement = createVideoElement(stream);
    chat.appendChild(videoElement);
    
    videoRecorder = new MediaRecorder(stream);
    videoRecorder.ondataavailable = e => e.data.size > 0 && videoChunks.push(e.data);
    videoRecorder.start();
    updateFeedback('🔴 Grabando vídeo...');
    
    videoRecorder.onstop = async () => {
      try {
        videoStream.getTracks().forEach(track => track.stop());
        document.getElementById('video-preview')?.remove();
        
        const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
        updateFeedback('🧠 Procesando vídeo con FFmpeg...');
        
        const processedBlob = await processVideo(videoBlob);
        if (processedBlob) createVideoPreview(processedBlob);
      } catch (error) {
        console.error('Error procesamiento video:', error);
        updateFeedback('❌ Error procesando video.');
      }
    };
  } catch (err) {
    console.error('Error al grabar vídeo:', err);
    updateFeedback('❌ Error al acceder a la cámara.');
  }
}

/**
 * Detiene la grabación de video.
 */
export function stopVideoRecording() {
  if (!videoRecorder || videoRecorder.state === 'inactive') {
    updateFeedback('⚠️ No hay grabación activa.');
    return;
  }
  
  updateFeedback('🛑 Deteniendo grabación...');
  videoRecorder.stop();
}

/**
 * Procesa un video webm recortando los primeros 10 segundos.
 */
async function processVideo(videoBlob) {
  if (!ffmpegLoaded) {
    const success = await loadFFmpeg();
    if (!success) return null;
  }

  try {
    const [inputName, outputName] = ['input.webm', 'output.mp4'];
    await ffmpegInstance.FS('writeFile', inputName, await ffmpegInstance.fetchFile(videoBlob));
    
    await ffmpegInstance.run(
      '-i', inputName,
      '-ss', '0',
      '-t', '10',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-c:a', 'aac',
      '-movflags', 'faststart',
      outputName
    );
    
    const data = ffmpegInstance.FS('readFile', outputName);
    ffmpegInstance.FS('unlink', inputName);
    ffmpegInstance.FS('unlink', outputName);
    
    return new Blob([data.buffer], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error procesando video:', error);
    updateFeedback('❌ Error procesando video.');
    return null;
  }
}


/**
 * Activa la cámara y muestra una vista previa.
 */
export function startCamera() {
  updateFeedback('Activando cámara...');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.width = '100%';
      video.style.maxHeight = config.media.videoMaxHeight;
      video.setAttribute('id', 'camera-preview');

      // Agregar botón para capturar imagen
      const captureButton = document.createElement('button');
      captureButton.textContent = '📸 Capturar';
      captureButton.onclick = () => captureImage(video, stream);

      chat.appendChild(video);
      chat.appendChild(captureButton);

      updateFeedback('✅ Cámara activada.');
    })
    .catch((error) => {
      console.error('Error al acceder a la cámara:', error);
      updateFeedback('❌ No se pudo acceder a la cámara.');
      alert('⚠️ Verifica que diste permiso a la cámara.');
    });
}

/**
 * Captura una imagen desde la cámara.
 */
function captureImage(video, stream) {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    (blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'captura.png');

      updateFeedback('⏳ Procesando imagen capturada...');
      fetch('/api/ocr', { method: 'POST', body: formData })
        .then((res) => res.json())
        .then((data) => {
          input.value += (data.text || '') + '';
          input.focus();
          updateFeedback('✅ Imagen capturada y procesada.');
        })
        .catch(() => {
          updateFeedback('❌ Error al procesar la imagen.');
        });
    },
    'image/png'
  );

  // Detener la cámara después de capturar
  stream.getTracks().forEach((track) => track.stop());
  video.remove();
}

let mediaRecorder, audioChunks = [];

/**
 * Inicia la grabación de audio.
 */
export function startRecording() {
  updateFeedback('🎤 Solicitando acceso al micrófono...');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('🎤 Tu navegador no permite acceso al micrófono.');
    updateFeedback('❌ Micrófono no soportado en este navegador.');
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: config.media.audioType });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        updateFeedback('⌛ Transcribiendo audio...');
        try {
          const res = await fetch('/api/audio-transcript', { method: 'POST', body: formData });
          const data = await res.json();

          input.value += (data.text || '') + '';
          input.focus();
          updateFeedback('✅ Transcripción completada.');
        } catch (error) {
          console.error('Error al transcribir audio:', error);
          updateFeedback('❌ Error al transcribir el audio.');
        }
      };

      mediaRecorder.start();
      updateFeedback('🎙️ Grabando audio...');
    })
    .catch((error) => {
      console.error('Error al acceder al micrófono:', error);
      alert('⚠️ No se pudo acceder al micrófono. Verifica los permisos.');
      updateFeedback('❌ Permiso denegado o error de acceso al micrófono.');
    });
}

/**
 * Detiene la grabación de audio.
 */
export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    updateFeedback('⏹️ Deteniendo audio...');
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  } else {
    updateFeedback('⚠️ No hay grabación activa.');
  }
}


