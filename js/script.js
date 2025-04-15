
// js/script.js

const config = {
  ffmpeg: {
    corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
    maxLoadAttempts: 3,
    attemptInterval: 5000
  },
  media: {
    videoMaxHeight: '300px',
    audioType: 'audio/wav'
  }
};

// Variables globales para FFmpeg
let ffmpegLoaded = false;
let ffmpegInstance;
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 3;

const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
const feedback = document.getElementById('feedback');

// 2. Sistema de Carga de FFmpeg
async function loadFFmpeg() {
  if (ffmpegLoaded) return true;

  console.log(`[${loadAttempts + 1}] Intentando cargar FFmpeg...`);
  
  try {
    const { createFFmpeg, fetchFile } = FFmpeg;
    ffmpegInstance = createFFmpeg({
      corePath: config.ffmpeg.corePath,
      log: true
    });

    await ffmpegInstance.load();
    ffmpegLoaded = true;
    console.log('FFmpeg cargado correctamente');
    
    // Monitor de estado
    setInterval(() => {
      console.log('Estado FFmpeg:', { loaded: ffmpegLoaded, instance: !!ffmpegInstance });
    }, config.ffmpeg.attemptInterval);
    
    return true;
  } catch (error) {
    console.error(`Error al cargar FFmpeg (intento ${loadAttempts + 1}):`, error);
    loadAttempts++;
    
    if (loadAttempts < config.ffmpeg.maxLoadAttempts) {
      console.log('Reintentando carga de FFmpeg...');
      return await loadFFmpeg(); // Recursividad controlada
    } else {
      console.error('Máximo número de intentos alcanzado para cargar FFmpeg');
      return false;
    }
  }
}


// 7. Manejo de Eventos
document.addEventListener('DOMContentLoaded', async () => {
  await loadFFmpeg(); // Carga inicial de FFmpeg
  
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  input.addEventListener('paste', async function (e) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        const formData = new FormData();
        formData.append('image', file);
        updateFeedback('Procesando imagen pegada...');
        
        try {
          const res = await fetch('/api/ocr', { method: 'POST', body: formData });
          const data = await res.json();
          input.value += (data.text || '') + '\n';
          input.focus();
          updateFeedback('');
        } catch {
          updateFeedback('❌ Error al procesar imagen.');
        }
      }
    }
  });
});



// 3. Funciones de Procesamiento de Media
async function convertToMp4(inputBlob) {
  if (!ffmpegLoaded) {
    const success = await loadFFmpeg();
    if (!success) {
      updateFeedback('❌ Error: FFmpeg no disponible.');
      return null;
    }
  }

  try {
    const [inputName, outputName] = ['input.webm', 'output.mp4'];
    await ffmpegInstance.FS('writeFile', inputName, await ffmpegInstance.fetchFile(inputBlob));
    
    await ffmpegInstance.run(
      '-i', inputName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      outputName
    );
    
    const data = ffmpegInstance.FS('readFile', outputName);
    ffmpegInstance.FS('unlink', inputName);
    ffmpegInstance.FS('unlink', outputName);
    
    return new Blob([data.buffer], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error en conversión FFmpeg:', error);
    updateFeedback('❌ Error procesando video.');
    return null;
  }
}

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








  

  
  function appendMessage(msg, className) {
    const div = document.createElement('div');
    div.className = `msg ${className}`;
    const links = msg.match(/https?:\/\/[^\s]+/g);
  
    // Detectar títulos (líneas que empiezan con ### o **)
    msg = msg.replace(/"(.*?) target="_blank">/g, '" target="_blank">');
  
    let formatted = msg
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^\* \*\*(.*?)\*\*:(.*)$/gm, '<li><strong>$1:</strong>$2</li>') // viñetas con negrita
    .replace(/^\*\*(.*?)\*\*:/gm, '<strong>$1:</strong>') // otras negritas
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n(?=\d+\.)/g, '</li><li>')                // numeradas
    .replace(/\n/g, '<br>')
  
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
  
      .replace(/\n/g, '<br>');
  
      
      
     
  // Suponiendo que links es un array y formatted es una variable definida previamente
  let cleanLink = null;
  
  if (links && links.length > 0) {
    cleanLink = links[0].replace(/[)$]+$/, '');
  }
  
  
    if (links && className === 'bot-msg') {
      formatted += `<div class="resource-button">
          <a href="${cleanLink}" target="_blank" class="btn-doc">📖 Ver documentación</a>
        </div>`;
    }
    if (className === 'bot-msg' && links?.length) {
      formatted += `<div class="resource-preview">
        <p><strong>📎 Recurso:</strong> <a href="${cleanLink}" target="_blank">${cleanLink}</a></p>
      </div>`;
    }
    div.innerHTML = formatted;
  
        // Botón ⭐ favoritos
        if (className === "bot-msg") {
          const favBtn = document.createElement("button");
          favBtn.textContent = "⭐ Guardar como favorito";
          favBtn.title = "Guardar esta respuesta en tus favoritos para consultarla después";
          favBtn.className = "save-button";
          favBtn.classList.add("favorite-action-btn");
          favBtn.onclick = () => {
            const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
            favorites.push({
              text: msg,
              date: new Date().toISOString()
            });
            localStorage.setItem("favorites", JSON.stringify(favorites));
            favBtn.textContent = "✅";
            setTimeout(() => (favBtn.textContent = "⭐"), 2000);
          };
          div.appendChild(favBtn);
          // Botón 📎 copiar al portapapeles
  // Botón 📎 copiar al portapapeles
  const copyBtn = document.createElement("button");
  copyBtn.textContent = "📎 Copiar respuesta";
  copyBtn.title = "Copiar el contenido de esta respuesta al portapapeles";
  copyBtn.className = "copy-button";
  copyBtn.classList.add("favorite-action-btn");
  copyBtn.onclick = () => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = msg; // usa el contenido original antes del formateo
    const plainText = tempElement.textContent || tempElement.innerText || "";
    navigator.clipboard.writeText(plainText).then(() => {
      copyBtn.textContent = "✅ Copiado";
      setTimeout(() => (copyBtn.textContent = "📎"), 2000);
    }).catch(() => {
      copyBtn.textContent = "❌ Error";
    });
  };
  div.appendChild(copyBtn);
  
  
      }
  
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
  
  function updateFeedback(msg) {
    feedback.textContent = msg;
  }
  
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  input.addEventListener('paste', function (e) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        const formData = new FormData();
        formData.append('image', file);
        updateFeedback('Procesando imagen pegada...');
        fetch('/api/ocr', {
          method: 'POST',
          body: formData
        })
          .then(res => res.json())
          .then(data => {
              input.value += (data.text || '') + '\n';
              input.focus();
            updateFeedback('');
          })
          .catch(() => updateFeedback('Error al procesar imagen.'));
      }
    }
  });
  
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
  
    appendMessage(text, 'user-msg');
    updateFeedback('Procesando pregunta...');
    input.value = '';
  
    try {
      const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `
        Eres un asistente experto en SQL Conta y SQL Obras de Distrito K. 
        Siempre que respondas, sigue estas pautas:
        
        1. Da respuestas **claras, paso a paso** y **prácticas**, incluso si son tareas complejas.
        2. **Incluye enlaces oficiales y útiles** de recursos reales cuando sea posible. Usa sobretodo los siguientes:
        
        - 📘 Manual SQL Conta: https://www.distritok.com/manuales/SQLConta.pdf
        - 📘 Manual SQL Obras: https://www.distritok.com/manuales/SQLObras.pdf
        - 🎬 Videotutoriales SQL Conta: https://www.youtube.com/watch?v=s2k-2OosTnc&list=PLZQOCXoFqVu2PyyHN6ZROMlZgKABsSrsB
        - 🎬 Videotutoriales SQL Obras: https://www.youtube.com/watch?v=MbqMyOJXOWE&list=PLZQOCXoFqVu0FUM2Z5gF1nZcMgTaXt7K1
        - 🧠 Canal oficial: https://www.youtube.com/@Distritok
        - 📚 Blog oficial con tutoriales: https://www.distritok.com/blog/category/tutoriales/
        - 🧪 Videotutoriales SQL Conta: https://www.distritok.com/videotutoriales/sql-conta/
        - 📊 Transparencias SQL Conta: https://es.scribd.com/document/295436673/Descubra-SQL-Conta
        - 🎓 Cursos oficiales: https://www.distritok.com/cursos-formacion/
        - 🎥 Webinar SQL Conta: https://www.distritok.com/blog/webinar-una-vision-360-sobre-sql-conta/
        
        3. Menciona si existe un **video o página concreta** para resolver lo que te piden. Si no existe, da una solución alternativa o recomienda buscar en el manual.
        
        4. Evita repetir frases innecesarias como "es importante mencionar" o "como puedes ver".
        
        5. Siempre responde en **formato estructurado**:
          - Título
          - Breve explicación
          - Paso a paso
          - Enlace(s) directos si existen
          - Consejo final o nota útil
        
        ---
        
        Consulta del usuario: ${text}
            `
          })
        });
        
      const data = await res.json();
      appendMessage(data.reply || 'Sin respuesta.', 'bot-msg');
    } catch (err) {
      appendMessage('Error del servidor.', 'bot-msg');
    } finally {
      updateFeedback('');
    }
  }
  
  document.getElementById('imageInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
  
    updateFeedback('Procesando imagen subida...');
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: formData });
      const data = await res.json();
      //appendMessage(data.text || 'No se pudo extraer texto.', 'bot-msg');
      input.value += (data.text || '') + '\n';
      updateFeedback('✅ Imagen procesada correctamente.');
  input.focus();
    } catch (err) {
      appendMessage('Error al procesar imagen.', 'bot-msg');
    } finally {
      updateFeedback('');
    }
  });
  
  let mediaRecorder;
  let audioChunks = [];
  async function startRecording() {
    updateFeedback('🎤 Solicitando acceso al micrófono...');
  
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("🎤 Tu navegador no permite acceso al micrófono.");
      updateFeedback('❌ Micrófono no soportado en este navegador.');
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
  
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
  
        updateFeedback('⌛ Transcribiendo audio...');
  
        try {
          const res = await fetch('/api/audio-transcript', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          input.value += (data.text || '') + '\n';
          input.focus();
          updateFeedback('✅ Transcripción completada.');
        } catch (err) {
          updateFeedback('❌ Error al transcribir el audio.');
        }
      };
  
      mediaRecorder.start();
      updateFeedback('🎙️ Grabando audio...');
    } catch (err) {
      console.error('Error micrófono:', err);
      alert("⚠️ No se pudo acceder al micrófono. Verifica los permisos.");
      updateFeedback('❌ Permiso denegado o error de acceso al micrófono.');
    }
  }
  
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      updateFeedback('⏹️ Deteniendo audio...');
  
      // Asegura que se liberen todos los recursos
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    } else {
      updateFeedback('⚠️ No hay grabación activa.');
    }
  }
  
 
  // 4. Funciones de Grabación
let videoStream, videoChunks = [], videoRecorder;
async function startVideoRecording() {
  updateFeedback('🎥 Iniciando grabación de video...');
  
  // Verificación previa de FFmpeg
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

function stopVideoRecording() {
  if (!videoRecorder || videoRecorder.state === 'inactive') {
    updateFeedback('⚠️ No hay grabación activa.');
    return;
  }
  
  updateFeedback('🛑 Deteniendo grabación...');
  videoRecorder.stop();
}

// 5. Funciones de UI
function createVideoElement(stream) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.style.width = '100%';
  video.style.maxHeight = config.media.videoMaxHeight;
  video.setAttribute("id", "video-preview");
  return video;
}

function createVideoPreview(videoBlob) {
  if (!videoBlob) return;
  
  let previewUrl;
  try {
    previewUrl = URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error('Error creando URL del video:', error);
    updateFeedback('❌ Error al procesar video');
    return;
  }
  
  const previewContainer = document.createElement('div');
  previewContainer.className = 'video-preview';
  previewContainer.innerHTML = `
    <video controls src="${previewUrl}" style="width: 100%; max-height: 300px; margin-bottom: 8px;"></video>
    <button class="confirm-upload">✅ Usar este vídeo</button>
    <button class="cancel-upload">❌ Cancelar</button>
  `;
  
  chat.appendChild(previewContainer);
  chat.scrollTop = chat.scrollHeight;
  
  previewContainer.querySelector('.confirm-upload').onclick = () => {
    previewContainer.remove();
    uploadAndTranscribeVideo(videoBlob);
  };
  
  previewContainer.querySelector('.cancel-upload').onclick = () => {
    URL.revokeObjectURL(previewUrl); // Libera la URL
    previewContainer.remove();
    updateFeedback('🚫 Vídeo descartado.');
  };
  
  updateFeedback('🎬 Vídeo listo. ¿Quieres usarlo?');
}







  async function uploadAndTranscribeVideo(videoBlob) {
    const formData = new FormData();
    
    // Convertir el blob a un archivo con extensión .mp4
    //const videoFile = new File([videoBlob], "grabacion.mp4", { type: "video/mp4" });
    //formData.append('video', videoFile);
  
    try {
      const mp4Blob = await convertToMp4(videoBlob);
  
      const formData = new FormData();
      formData.append('video', mp4Blob, 'grabacion.mp4');
  
      const res = await fetch('/api/transcribe-video', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.transcription_id) {
        updateFeedback('⌛ Transcripción en curso...');
        pollTranscriptionStatus(data.transcription_id);
      } else {
        updateFeedback('❌ Error al subir el vídeo.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      updateFeedback('❌ Fallo al subir el vídeo.');
    }
  }
  
  async function pollTranscriptionStatus(id) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/transcription-status/${id}`);
        const data = await res.json();
  
        if (data.status === 'done') {
          clearInterval(interval);
          const messageInput = document.getElementById('messageInput');
          messageInput.value += (data.text || '') + '\n';
          messageInput.focus();
          updateFeedback('✅ Transcripción completada y añadida al campo de entrada.');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          updateFeedback('❌ Falló la transcripción del vídeo.');
        } else {
          updateFeedback('⏳ Transcribiendo... por favor espera...');
        }
      } catch (err) {
        clearInterval(interval);
        updateFeedback('❌ Error al consultar el estado de transcripción.');
      }
    }, 5000);
  }
  
  
  
  
  function startCamera() {
    updateFeedback('Activando cámara...');
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.width = '100%';
      video.style.maxHeight = '300px';
      const snapBtn = document.createElement('button');
      snapBtn.textContent = '📸 Capturar';
      snapBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
          const formData = new FormData();
          formData.append('image', blob);
          updateFeedback('Procesando captura...');
          fetch('/api/ocr', {
            method: 'POST',
            body: formData
          }).then(res => res.json()).then(data => {
            //appendMessage(data.text || 'Texto no reconocido.', 'bot-msg');
            input.value += (data.text || '') + '\n';
  input.focus();
  updateFeedback('✅ Imagen capturada y procesada.');
          }).catch(() => updateFeedback('Error cámara.'));
        }, 'image/png');
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        snapBtn.remove();
      };
      chat.appendChild(video);
      chat.appendChild(snapBtn);
    }).catch(() => {
      updateFeedback('❌ No se pudo acceder a la cámara.');
      alert("⚠️ Verifica que diste permiso a la cámara.");
    });
  }
  
  const toggleBtn = document.getElementById('nav-toggle');
  toggleBtn?.addEventListener('click', () => {
    const links = document.getElementById('nav-links');
    links.classList.toggle('show');
    toggleBtn.innerHTML = links.classList.contains('show')
      ? '<i class="fas fa-times"></i>'   // ❌
      : '<i class="fas fa-bars"></i>';   // ☰
  });
  
  







