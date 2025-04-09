// ✅ server.js corregido y compatible con recursos.json en CommonJS
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createWorker } = require('tesseract.js');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

const upload = multer({ dest: 'uploads/' });

// 📄 Cargar manualmente el JSON con los recursos
const recursos = require('./recursos.json');

// 🔐 Clave API Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDrRd1QH4V4M8evpSIesbFifT-H6yWn84g');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

app.post('/api/gemini', async (req, res) => {
  try {
    const { message } = req.body;
    const consulta = message.toLowerCase();

    // Buscar coincidencia en recursos.json (clave exacta o parcial)
    const coincidencia = Object.keys(recursos).find(key => consulta.includes(key.toLowerCase()));

    if (coincidencia) {
      const recurso = recursos[coincidencia];
      return res.json({
        reply: `📘 <strong>Documentación:</strong> <a href="${recurso.documentacion}" target="_blank">${recurso.documentacion}</a><br>
               🎥 <strong>Videotutorial:</strong> <a href="${recurso.videotutorial}" target="_blank">${recurso.videotutorial}</a>`
      });
    }

    // Si no hay coincidencia en recursos, usar Gemini
    const input = `Eres un experto en SQL Conta y SQL Obras de Distrito K. Responde SOLO con pasos detallados, fiables y prácticos para estos productos. Incluye trucos o consejos si es útil. Pregunta: ${message}`;
    const result = await model.generateContent(input);
    const reply = result.response.text() || 'No encontré información precisa.';
    res.json({ reply });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: 'Gemini falló', details: error.message });
  }
});

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;
  const worker = await createWorker(['eng', 'spa']);
  try {
    const { data: { text } } = await worker.recognize(filePath);
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: 'OCR falló', details: error.message });
  } finally {
    await worker.terminate();
    fs.unlinkSync(filePath);
  }
});

app.post('/api/audio-transcript', upload.single('audio'), async (req, res) => {
  try {
    res.json({ text: '🎧 Transcripción simulada. Aquí deberías integrar Whisper u otro servicio.' });
  } catch (error) {
    res.status(500).json({ error: 'Transcripción fallida', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
