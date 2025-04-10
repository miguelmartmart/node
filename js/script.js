// js/script.js
const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
const feedback = document.getElementById('feedback');

function appendMessage(msg, className) {
  const div = document.createElement('div');
  div.className = `msg ${className}`;
  div.innerHTML = msg.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
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
          appendMessage(data.text || 'Texto no reconocido.', 'bot-msg');
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
      body: JSON.stringify({ message: text })
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
    appendMessage(data.text || 'No se pudo extraer texto.', 'bot-msg');
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
      appendMessage(data.text || 'No se pudo transcribir audio.', 'bot-msg');
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
          appendMessage(data.text || 'Texto no reconocido.', 'bot-msg');
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

  
