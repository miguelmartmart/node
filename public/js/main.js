import { loadFFmpeg } from './ffmpeg-utils.js';
import { startCamera, startRecording, stopRecording, startVideoRecording, stopVideoRecording } from './media-handlers.js';




function initializeApp() {
  // Código que debería ejecutarse cuando el DOM esté listo
  console.log('Inicializando aplicación...');

  // Obtener referencias a los botones usando IDs
  const startCameraButton = document.getElementById('start-camera');
  const startAudioRecordingButton = document.getElementById('start-audio-recording');
  const stopAudioRecordingButton = document.getElementById('stop-audio-recording');
  const startVideoRecordingButton = document.getElementById('start-video-recording');
  const stopVideoRecordingButton = document.getElementById('stop-video-recording');

  // Verificar que todos los botones existan
  if (
    !startCameraButton ||
    !startAudioRecordingButton ||
    !stopAudioRecordingButton ||
    !startVideoRecordingButton ||
    !stopVideoRecordingButton
  ) {
    console.error('Uno o más botones no encontrados.');
    return;
  }

  // Asociar eventos a los botones
  startCameraButton.addEventListener('click', startCamera);
  startAudioRecordingButton.addEventListener('click', startRecording);
  stopAudioRecordingButton.addEventListener('click', stopRecording);
  startVideoRecordingButton.addEventListener('click', startVideoRecording);
  stopVideoRecordingButton.addEventListener('click', stopVideoRecording);
}

// Verificar si el DOM ya está cargado
if (document.readyState === 'loading') {
  // Si el DOM aún no está listo, esperar al evento 'DOMContentLoaded'
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // Si el DOM ya está listo, ejecutar el código inmediatamente
  initializeApp();
}