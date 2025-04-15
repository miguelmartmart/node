let videoStream, videoChunks = [], videoRecorder;

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