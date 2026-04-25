import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── AI Provider Factory ───────────────────────────────────────────────
let genAI: any = null;
function getGenAI(customApiKey?: string) {
  if (customApiKey) return new GoogleGenerativeAI(customApiKey);
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getOpenAI(apiKey: string) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not defined");
  return new OpenAI({ apiKey });
}

// Unified generate
async function generateAIContent(options: {
  provider: string;
  model?: string;
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { provider, model, prompt, systemPrompt, apiKey, temperature = 0.7, maxTokens = 2048 } = options;

  if (provider === "openai") {
    if (!apiKey) throw new Error("Se requiere una API Key de OpenAI");
    const openai = getOpenAI(apiKey);
    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
    msgs.push({ role: "user", content: prompt });

    const response = await openai.chat.completions.create({
      model: model || "gpt-4o",
      messages: msgs,
      temperature,
      max_tokens: maxTokens,
    });
    return response.choices[0]?.message?.content || "";
  }

  // Gemini
  const ai = getGenAI(apiKey);
  const geminiModel = ai.getGenerativeModel({
    model: model || "gemini-1.5-pro",
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

// Unified chat
async function chatAI(options: {
  provider: string;
  model?: string;
  messages: Array<{ role: string; text: string }>;
  newMessage: string;
  systemPrompt: string;
  apiKey?: string;
  temperature?: number;
}): Promise<string> {
  const { provider, model, messages, newMessage, systemPrompt, apiKey, temperature = 0.7 } = options;

  if (provider === "openai") {
    if (!apiKey) throw new Error("Se requiere una API Key de OpenAI");
    const openai = getOpenAI(apiKey);
    const chatMsgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];
    for (const m of messages) {
      chatMsgs.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
    }
    chatMsgs.push({ role: "user", content: newMessage });

    const response = await openai.chat.completions.create({
      model: model || "gpt-4o",
      messages: chatMsgs,
      temperature,
    });
    return response.choices[0]?.message?.content || "";
  }

  // Gemini
  const ai = getGenAI(apiKey);
  const geminiModel = ai.getGenerativeModel({
    model: model || "gemini-1.5-pro",
    systemInstruction: systemPrompt,
  });
  const history = messages.map((m: any) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  const chat = geminiModel.startChat({ history });
  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}

// ─── Data ──────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

[DATA_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({
      prompts: [
        {
          id: "1",
          title: "Triaje de Emails Inteligente",
          content: "import { gmail, ai, slack } from '@cybermedida/core';\n\nconst emails = await gmail.getUnread();\nfor (const mail of emails) {\n  const analysis = await ai.analyze(mail.body);\n  if (analysis.urgency === 'crítica') {\n    await slack.notify('#incidentes', `Alerta: ${mail.subject}`);\n  }\n}",
          isFavorite: true,
          tags: ["comunicación", "ia"],
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Sincronización Webhook CRM",
          content: "app.post('/webhooks/stripe', async (req) => {\n  const event = req.body;\n  if (event.type === 'customer.subscription.created') {\n    await hubspot.contacts.create({\n      email: event.data.object.customer_email,\n      status: 'active'\n    });\n  }\n});",
          isFavorite: false,
          tags: ["ventas", "crm"],
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Monitor de Logs CyberMedida",
          content: "const logs = await system.getLogs('auth.log');\nconst anomalies = await ai.detectAnomalies(logs);\nif (anomalies.length > 0) {\n  await telegram.send('Aviso de Seguridad: Se detectaron patrones inusuales.');\n}",
          isFavorite: true,
          tags: ["seguridad", "devops"],
          createdAt: new Date().toISOString(),
        },
      ],
      automations: [],
      stats: { totalTokens: 0, totalSavings: 0, filesProcessed: 0 },
    }, null, 2)
  );
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// ─── Server ────────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // DB
  app.get("/api/db", (_req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    res.json(data);
  });

  app.post("/api/db", (req, res) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2));
    res.json({ status: "ok" });
  });

  // ─── Generate Prompt ───────────────────────────────────────────────
  app.post("/api/generate-prompt", async (req, res) => {
    const { topic, audience, format, style, detail, apiKey, provider, model } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    try {
      const prompt = `Act as an expert prompt engineer.
Generate a highly effective system prompt based on:
- MISSION: ${topic}
- AUDIENCE: ${audience || "General"}
- FORMAT: ${format}
- STYLE: ${style}
- DETAIL: ${detail}

Return ONLY the optimized prompt content, no conversational filler.`;

      const responseText = await generateAIContent({
        provider: provider || "gemini",
        model,
        prompt,
        apiKey,
      });
      res.json({ prompt: responseText });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Error en la generación de IA", details: String(error) });
    }
  });

  // ─── Automation Chat ───────────────────────────────────────────────
  app.post("/api/automation-chat", async (req, res) => {
    const { messages, text, apiKey, provider, model } = req.body;
    if (!messages || !text) return res.status(400).json({ error: "Messages and text are required" });

    const systemPrompt = `Eres un Arquitecto de Automatización experto de CyberMedida. Tu objetivo es ayudar al usuario a automatizar sus procesos y conexiones de datos.

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
5. Al final, cuando tengas suficiente información, propón una "Receta de Automatización" detallada con pasos técnicos.`;

    try {
      const responseText = await chatAI({
        provider: provider || "gemini",
        model,
        messages,
        newMessage: text,
        systemPrompt,
        apiKey,
      });
      res.json({ text: responseText });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Error de IA", details: String(error) });
    }
  });

  // ─── Transform ─────────────────────────────────────────────────────
  app.post("/api/transform", async (req, res) => {
    const { markdown, language, apiKey, provider, model } = req.body;
    if (!markdown || !language) return res.status(400).json({ error: "Markdown and language are required" });

    try {
      const prompt = `Actúa como un Ingeniero de Software experto especializado en ${language}.
Transforma el siguiente contenido Markdown en un script de ${language} optimizado, profesional y autodocumentado.
Si el contenido describe un proceso, automatízalo. Si son datos, crea estructuras de datos eficientes.
Incluye manejo de errores y comentarios detallados en español.

IMPORTANTE: Devuelve EXCLUSIVAMENTE el código fuente, sin explicaciones ni bloques markdown.

CONTENIDO A TRANSFORMAR:
${markdown}`;

      const responseText = await generateAIContent({
        provider: provider || "gemini",
        model: model || (provider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash"),
        prompt,
        apiKey,
      });

      const code = responseText.replace(/```[a-z]*\n?|```/g, "").trim();
      res.json({ code });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Error en la generación de IA", details: String(error) });
    }
  });

  // ─── File Conversion ───────────────────────────────────────────────
  app.post("/api/convert", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

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
        markdown = `# Archivo: ${req.file.originalname}\n\n**Nota:** Tipo ${extension}.\n\n\`\`\`\n${fs.readFileSync(filePath, "utf-8").slice(0, 500)}...\n\`\`\``;
      }

      const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      db.stats.filesProcessed += 1;
      db.stats.totalSavings += 0.75;
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

      res.json({ markdown, filename: req.file.originalname.replace(/\.[^/.]+$/, "") + ".md" });
    } catch (error) {
      console.error("Conversion error:", error);
      res.status(500).json({
        error: "Error en el motor de conversión MarkItDown",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  });

  // ─── Validate API Key ──────────────────────────────────────────────
  app.post("/api/validate-key", async (req, res) => {
    const { provider, apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ valid: false, error: "No API key" });

    try {
      if (provider === "openai") {
        const openai = getOpenAI(apiKey);
        await openai.models.list();
      } else {
        const ai = getGenAI(apiKey);
        const m = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        await m.generateContent("Say hi");
      }
      res.json({ valid: true });
    } catch (error) {
      res.json({ valid: false, error: String(error) });
    }
  });

  // ─── Vite / Static ─────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
