const chat = document.getElementById('chat');
const feedback = document.getElementById('feedback');

/**
 * Actualiza el mensaje de feedback.
 */
export function updateFeedback(message) {
  const feedback = document.getElementById('feedback');
  if (!feedback) {
    console.warn('Elemento "feedback" no encontrado.');
    return;
  }
  feedback.textContent = message;
}

/**
 * Agrega un mensaje al chat.
 */
export function appendMessage(msg, className) {
  const div = document.createElement('div');
  div.className = `msg ${className}`;
  
  // Formateo avanzado del mensaje
  let formatted = msg
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^\* \*\*(.*?)\*\*:(.*)$/gm, '<li><strong>$1:</strong>$2</li>')
    .replace(/^\*\*(.*?)\*\*:/gm, '<strong>$1:</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?=\d+\.)/g, '</li><li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
    .replace(/\n/g, '<br>');
  
  div.innerHTML = formatted;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

/**
 * Crea un elemento de video.
 */
export function createVideoElement(stream) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.style.width = '100%';
  video.style.maxHeight = '300px';
  video.setAttribute("id", "video-preview");
  return video;
}