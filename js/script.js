// js/script.js
const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
const feedback = document.getElementById('feedback');

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
      2. **Incluye enlaces oficiales y útiles** de recursos reales cuando sea posible. Usa solo los siguientes:
      
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
  updateFeedback('Grabando audio...');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', audioBlob);

    updateFeedback('Transcribiendo audio...');
    try {
      const res = await fetch('/api/audio-transcript', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      // appendMessage(data.text || 'No se pudo transcribir audio.', 'bot-msg');
      input.value += (data.text || '') + '\n';
input.focus();
    } catch (err) {
      appendMessage('Error al enviar audio.', 'bot-msg');
    } finally {
      updateFeedback('');
    }
  };
  audioChunks = [];
  mediaRecorder.start();
}

function stopRecording() {
  if (mediaRecorder) mediaRecorder.stop();
  updateFeedback('Deteniendo audio...');
}

let videoStream;
function startVideoRecording() {
  updateFeedback('Grabando video...');
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    videoStream = stream;
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.maxHeight = '300px';
    chat.appendChild(video);
  });
}

function stopVideoRecording() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    updateFeedback('Video detenido.');
  }
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
          updateFeedback('');
        }).catch(() => updateFeedback('Error cámara.'));
      }, 'image/png');
      stream.getTracks().forEach(track => track.stop());
      video.remove();
      snapBtn.remove();
    };
    chat.appendChild(video);
    chat.appendChild(snapBtn);
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

