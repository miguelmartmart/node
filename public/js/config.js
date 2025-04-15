// config.js
const config = {
    // Configuración de FFmpeg
    ffmpeg: {
      corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js', // Ruta al núcleo de FFmpeg
      maxLoadAttempts: 3, // Número máximo de intentos para cargar FFmpeg
      attemptInterval: 5000, // Intervalo entre intentos de carga (en milisegundos)
    },
  
    // Configuración de medios
    media: {
      videoMaxHeight: '300px', // Altura máxima para los videos
      audioType: 'audio/wav', // Tipo de audio predeterminado
    },
  
    // URLs útiles
    resources: {
      courses: 'https://www.distritok.com/cursos-formacion/',
      webinar: 'https://www.distritok.com/blog/webinar-una-vision-360-sobre-sql-conta/',
      sqlContaSlides: 'https://es.scribd.com/document/295436673/Descubra-SQL-Conta',
    },
  
    // Configuración de la API
    api: {
      ocrEndpoint: '/api/ocr', // Endpoint para procesar OCR
      transcribeVideoEndpoint: '/api/transcribe-video', // Endpoint para transcribir videos
      audioTranscriptEndpoint: '/api/audio-transcript', // Endpoint para transcribir audio
    },
  };
  
  export default config;