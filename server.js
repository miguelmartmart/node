// server.js
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createWorker } from 'tesseract.js'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(bodyParser.json())
app.use(express.static('.'))

const upload = multer({ dest: 'uploads/' })

// Recursos SQL Conta / Obras
const recursosPath = path.join(__dirname, 'recursos.json')
const recursos = JSON.parse(fs.readFileSync(recursosPath, 'utf8'))

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDrRd1QH4V4M8evpSIesbFifT-H6yWn84g')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' })

function generarPromptOptimizado(pregunta) {
  let contexto = `Eres un asistente experto en SQL Conta y SQL Obras (productos de Distrito K). Responde solo usando fuentes oficiales y fiables. Aporta pasos claros, enlaces oficiales, videotutoriales si existen, y consejos prácticos. No inventes si no conoces la respuesta.`
  for (const clave in recursos) {
    if (pregunta.toLowerCase().includes(clave.toLowerCase())) {
      const extra = recursos[clave]
      contexto += `\n\nTema detectado: ${clave}\nDocumentación: ${extra.documentacion}\nVideotutorial: ${extra.videotutorial}`
    }
  }
  return `${contexto}\n\nPregunta del usuario: ${pregunta}`
}

app.post('/api/gemini', async (req, res) => {
  try {
    const { message } = req.body
    const prompt = generarPromptOptimizado(message)
    const result = await model.generateContent(prompt)
    const reply = result.response.text() || ''
    res.json({ reply })
  } catch (error) {
    console.error('Gemini Error:', error)
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
      if (err) {
        console.error('Whisper error:', stderr)
        return res.status(500).json({ error: 'Whisper failed', details: stderr })
      }
      const result = fs.readFileSync(outputPath, 'utf8')
      res.json({ text: result })
      fs.unlinkSync(filePath)
      fs.unlinkSync(outputPath)
    })
  } catch (error) {
    res.status(500).json({ error: 'Transcripción fallida', details: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
