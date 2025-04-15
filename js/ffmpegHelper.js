// ffmpegHelper.js (versión navegador)
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: '/ffmpeg/ffmpeg-core.js', // Ruta donde pusiste el archivo
});
let isLoaded = false;

export async function loadFFmpeg() {
  if (!isLoaded) {
    console.log('⏳ Cargando FFmpeg...');
    await ffmpeg.load();
    isLoaded = true;
    console.log('✅ FFmpeg cargado');
  }
}

export async function convertToMp4(inputBlob) {
  await loadFFmpeg();

  const inputName = 'input.webm';
  const outputName = 'output.mp4';

  ffmpeg.FS('writeFile', inputName, await fetchFile(inputBlob));

  await ffmpeg.run(
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    outputName
  );

  const data = ffmpeg.FS('readFile', outputName);
  const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });

  ffmpeg.FS('unlink', inputName);
  ffmpeg.FS('unlink', outputName);

  return mp4Blob;
}
