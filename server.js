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
  return `
Eres un asistente experto en SQL Conta y SQL Obras, los ERPs de Distrito K. Tu tarea es responder a usuarios que necesitan aprender a usar estas herramientas.

✅ Siempre ofrece información útil, clara, directa y estructurada.
✅ Incluye pasos si es un procedimiento.
✅ Incluye al menos 1 enlace real de los siguientes si es posible:
- Manuales: https://www.distritok.com/manuales/SQLConta.pdf, https://www.distritok.com/manuales/SQLObras.pdf
- Tutoriales: https://www.distritok.com/blog/category/tutoriales/
- Videotutoriales SQL Conta: https://www.youtube.com/watch?v=s2k-2OosTnc&list=PLZQOCXoFqVu2PyyHN6ZROMlZgKABsSrsB
- Videotutoriales SQL Obras: https://www.youtube.com/watch?v=MbqMyOJXOWE&list=PLZQOCXoFqVu0FUM2Z5gF1nZcMgTaXt7K1
- Canal: https://www.youtube.com/@Distritok

✅ Si no sabes la respuesta, di “No tengo información precisa sobre eso” y sugiere consultar el canal de Youtube o tutoriales.

✅ Formatea el texto con títulos (###), pasos numerados, listas con viñetas, y enlaces clicables.

Ejemplo de formato:

### Cómo crear una factura en SQL Conta
1. Ve a “Facturación > Nueva factura”.
2. Selecciona cliente, fecha y líneas.

**Recurso recomendado:**
https://www.distritok.com/manuales/SQLConta.pdf

Pregunta del usuario: ${pregunta}
  `.trim();
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
