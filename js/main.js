document.addEventListener('DOMContentLoaded', async () => {
  await loadFFmpeg();

  document.getElementById('start-video').addEventListener('click', startVideoRecording);
  document.getElementById('stop-video').addEventListener('click', stopVideoRecording);
});