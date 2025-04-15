// server.js
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createWorker } from 'tesseract.js'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors()); // ya lo tienes
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
app.use(bodyParser.json());
app.use('/ffmpeg', express.static(path.join(__dirname, 'public/ffmpeg')));

app.use(express.static('.')); // asegúrate de que sea "public"


const upload = multer({ dest: 'uploads/' })
const uploadVideo = multer({ dest: 'uploads/' })

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' })

app.post('/api/gemini', async (req, res) => {
  try {
    const prompt = `...${req.body.message}` // Usa tu generador
    const result = await model.generateContent(prompt)
    const reply = result.response.text() || ''
    res.json({ reply })
  } catch (error) {
    res.status(500).json({ error: 'Gemini failed', details: error.message })
  }
})

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  const filePath = req.file.path
  const worker = await createWorker(['eng', 'spa'])
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath)
    res.json({ text })
  } catch (error) {
    res.status(500).json({ error: 'OCR failed', details: error.message })
  } finally {
    await worker.terminate()
    fs.unlinkSync(filePath)
  }
})

app.post('/api/audio-transcript', upload.single('audio'), async (req, res) => {
  const filePath = req.file.path
  const outputPath = filePath + '.txt'
  try {
    const command = `whisper ${filePath} --model base --language Spanish --output_format txt --output_dir uploads`
    exec(command, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: 'Whisper failed', details: stderr })
      const result = fs.readFileSync(outputPath, 'utf8')
      res.json({ text: result })
      fs.unlinkSync(filePath)
      fs.unlinkSync(outputPath)
    })
  } catch (error) {
    res.status(500).json({ error: 'Transcripción fallida', details: error.message })
  }
})

// Happy Scribe - Subida y transcripción
app.post('/api/transcribe-video', uploadVideo.single('video'), async (req, res) => {
  try {
    const file = req.file
    const fileName = file.originalname.replace(/\.[^/.]+$/, ".mp4"); // Forzar extensión .mp4
    const filePath = path.resolve(file.path);

    const signedUrlRes = await fetch(`https://www.happyscribe.com/api/v1/uploads/new?filename=${fileName}`, {
      headers: { Authorization: `Bearer ${process.env.HAPPYSCRIBE_BRIDGE_API_KEY}` }
    })
    const { signedUrl } = await signedUrlRes.json()
    const tmpUrl = signedUrl.split('?')[0]

    const fileStream = fs.createReadStream(filePath)
    await fetch(signedUrl, { method: 'PUT', body: fileStream })

    const transcriptionRes = await fetch('https://www.happyscribe.com/api/v1/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HAPPYSCRIBE_BRIDGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: fileName,
        tmp_url: tmpUrl,
        language: 'es-ES',
        organization_id: process.env.HAPPYSCRIBE_ORGID_BRIDGE_API_KEY
      })
    })
    const transcriptionData = await transcriptionRes.json()
    res.json({ message: '✅ Transcripción iniciada.', transcription_id: transcriptionData.id })
    fs.unlinkSync(filePath)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '❌ Error al subir o procesar el video.' })
  }
})

app.get('/api/transcription-status/:id', async (req, res) => {
  const id = req.params.id
  try {
    const result = await fetch(`https://www.happyscribe.com/api/v1/transcriptions/${id}`, {
      headers: { Authorization: `Bearer ${process.env.HAPPYSCRIBE_BRIDGE_API_KEY}` }
    })
    const data = await result.json()
    res.json({ status: data.state, text: data.transcription || null })
  } catch (error) {
    res.status(500).json({ error: '❌ No se pudo obtener la transcripción.' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
