let ffmpegLoaded = false;
let ffmpegInstance;
const MAX_LOAD_ATTEMPTS = 3;

/**
 * Función para cargar FFmpeg con reintento controlado.
 */
export async function loadFFmpeg() {
  if (ffmpegLoaded) return true;

  console.log(`[${loadAttempts + 1}] Intentando cargar FFmpeg...`);
  
  try {
    const { createFFmpeg, fetchFile } = FFmpeg;
    ffmpegInstance = createFFmpeg({
      corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
      log: true
    });

    await ffmpegInstance.load();
    ffmpegLoaded = true;
    console.log('FFmpeg cargado correctamente');
    
    // Monitor de estado
    setInterval(() => {
      console.log('Estado FFmpeg:', { loaded: ffmpegLoaded, instance: !!ffmpegInstance });
    }, 5000);
    
    return true;
  } catch (error) {
    console.error(`Error al cargar FFmpeg (intento ${loadAttempts + 1}):`, error);
    loadAttempts++;
    
    if (loadAttempts < MAX_LOAD_ATTEMPTS) {
      console.log('Reintentando carga de FFmpeg...');
      return await loadFFmpeg(); // Recursividad controlada
    } else {
      console.error('Máximo número de intentos alcanzado para cargar FFmpeg');
      return false;
    }
  }
}

/**
 * Convierte un video webm a mp4 usando FFmpeg.
 */
export async function convertToMp4(inputBlob) {
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