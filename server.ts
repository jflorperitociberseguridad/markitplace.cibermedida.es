import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import { GoogleGenerativeAI } from "@google/generative-ai";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini (Lazy)
let genAI: any = null;
function getGenAI(customApiKey?: string) {
  if (customApiKey) {
    return new GoogleGenerativeAI(customApiKey);
  }
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure directories exist
[DATA_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({
      prompts: [
        {
          id: "1",
          title: "Triaje de Emails Inteligente",
          content: "import { gmail, ai, slack } from '@cybermedida/core';\n\n// Procesa correos entrantes y clasifica por urgencia\nconst emails = await gmail.getUnread();\nfor (const mail of emails) {\n  const analysis = await ai.analyze(mail.body);\n  if (analysis.urgency === 'crítica') {\n    await slack.notify('#incidentes', `Alerta: ${mail.subject}`);\n  }\n}",
          isFavorite: true,
          tags: ["comunicación", "ia"],
          createdAt: new Date().toISOString()
        },
        {
          id: "2",
          title: "Sincronización Webhook CRM",
          content: "// Conecta Stripe con HubSpot automáticamente\napp.post('/webhooks/stripe', async (req) => {\n  const event = req.body;\n  if (event.type === 'customer.subscription.created') {\n    await hubspot.contacts.create({\n      email: event.data.object.customer_email,\n      status: 'active'\n    });\n  }\n});",
          isFavorite: false,
          tags: ["ventas", "crm"],
          createdAt: new Date().toISOString()
        },
        {
          id: "3",
          title: "Monitor de Logs CyberMedida",
          content: "// Auditoría de seguridad continua\nconst logs = await system.getLogs('auth.log');\nconst anomalies = await ai.detectAnomalies(logs);\nif (anomalies.length > 0) {\n  await telegram.send('Aviso de Seguridad: Se detectaron patrones de acceso inusuales.');\n}",
          isFavorite: true,
          tags: ["seguridad", "devops"],
          createdAt: new Date().toISOString()
        }
      ],
      automations: [],
      stats: {
        totalTokens: 0,
        totalSavings: 0,
        filesProcessed: 0,
      },
    }, null, 2)
  );
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/db", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    res.json(data);
  });

  app.post("/api/db", (req, res) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2));
    res.json({ status: "ok" });
  });
  
  // Generate Prompt Route
  app.post("/api/generate-prompt", async (req, res) => {
    const { topic, audience, format, style, detail, apiKey } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    try {
      const ai = getGenAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const promptText = `Act as an expert prompt engineer. 
      Generate a highly effective system prompt based on:
      - MISSION: ${topic}
      - AUDIENCE: ${audience || "General"}
      - FORMAT: ${format}
      - STYLE: ${style}
      - DETAIL: ${detail}
      
      Return ONLY the optimized prompt content, no conversational filler.`;

      const result = await model.generateContent(promptText);
      const responseText = result.response.text();
      
      res.json({ prompt: responseText });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Error en la generación de IA", details: String(error) });
    }
  });

  // Automation Chat Route
  app.post("/api/automation-chat", async (req, res) => {
    const { messages, text, apiKey } = req.body;
    
    if (!messages || !text) {
      return res.status(400).json({ error: "Messages and text are required" });
    }

    try {
      const ai = getGenAI(apiKey);
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        systemInstruction: `Eres un Arquitecto de Automatización experto de CyberMedida. Tu objetivo es ayudar al usuario a automatizar sus procesos y conexiones de datos.
          
          ESTRATEGIA:
          1. Haz preguntas inteligentes y breves, de una en una, para entender el flujo de trabajo.
          2. Pregunta específicamente por:
             - Herramientas involucradas (Google Sheets, Notion, Stripe, etc).
             - Evento disparador (Trigger).
             - Acción principal deseada.
             - Reglas o condiciones críticas.
             - Formato de salida y necesidades de extracción.
          3. SÉ PROACTIVO: Sugiere opciones que el usuario quizás no ha considerado.
          4. FORMATO: Usa Markdown para que la respuesta sea legible.
          5. Al final, cuando tengas suficiente información, propón una "Receta de Automatización" detallada con pasos técnicos.`
      });
      
      const history = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(text);
      
      res.json({ text: result.response.text() });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Error de IA", details: String(error) });
    }
  });

  // Logic Transformation Route
  app.post("/api/transform", async (req, res) => {
    const { markdown, language, apiKey } = req.body;
    if (!markdown || !language) {
      return res.status(400).json({ error: "Markdown and language are required" });
    }

    try {
      const ai = getGenAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Actúa como un Ingeniero de Software experto especializado en ${language}. 
      Transforma el siguiente contenido Markdown en un script de ${language} optimizado, profesional y autodocumentado. 
      Si el contenido describe un proceso, automatízalo. Si son datos, crea estructuras de datos eficientes.
      Incluye manejo de errores y comentarios detallados en español.
      IMPORTANTE: Devuelve EXCLUSIVAMENTE el código fuente, sin explicaciones ni bloques markdown.
      
      CONTENIDO A TRANSFORMAR:
      ${markdown}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Cleanup markdown artifacts
      const code = responseText.replace(/```[a-z]*\n?|```/g, "").trim();
      
      res.json({ code });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Error en la generación de IA", details: String(error) });
    }
  });

  app.post("/api/convert", upload.single("file"), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const extension = path.extname(req.file.originalname).toLowerCase();
    
    try {
      let markdown = "";
      
      if (extension === ".pdf") {
        const pdfModule: any = await import("pdf-parse");
        const parsePdf = pdfModule.default || pdfModule;
        
        const dataBuffer = fs.readFileSync(filePath);
        const data = await parsePdf(dataBuffer);
        markdown = `# Documento PDF: ${req.file.originalname}\n\n${data.text}`;
      } else if (extension === ".docx") {
        const mammoth: any = await import("mammoth");
        const extract = mammoth.default?.extractRawText || mammoth.extractRawText;
        const result = await extract({ path: filePath });
        markdown = `# Documento Word: ${req.file.originalname}\n\n${result.value}`;
      } else if ([".txt", ".md", ".json", ".csv"].includes(extension)) {
        markdown = fs.readFileSync(filePath, "utf-8");
      } else {
        // Fallback or Image parsing (simulation/AI)
        markdown = `# Archivo: ${req.file.originalname}\n\n**Nota de Extracción:** El sistema detectó un archivo de tipo ${extension}. \n\nContenido crudo (primeros 500 caracteres):\n\n\`\`\`\n${fs.readFileSync(filePath, "utf-8").slice(0, 500)}...\n\`\`\``;
      }
      
      // Update stats
      const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      db.stats.filesProcessed += 1;
      db.stats.totalSavings += 0.75; 
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

      res.json({
        markdown,
        filename: req.file.originalname.replace(/\.[^/.]+$/, "") + ".md",
      });
    } catch (error) {
      console.error("Critical conversion error:", error);
      // More descriptive error
      res.status(500).json({ 
        error: "Error en el motor de conversión MarkItDown",
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
