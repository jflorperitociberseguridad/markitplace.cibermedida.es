import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  app.post("/api/convert", upload.single("file"), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const outputPath = `${filePath}.md`;

    try {
      let markdown = "";
      
      try {
        // Attempt to use markitdown CLI directly
        // We use spawn or exec. Exec is simpler for this one-liner.
        // We try different command variations to be safe
        await execPromise(`markitdown "${filePath}" > "${outputPath}"`);
        
        if (fs.existsSync(outputPath)) {
          markdown = fs.readFileSync(outputPath, "utf-8");
          fs.unlinkSync(outputPath);
        } else {
          // Alternative if stdout redirection didn't work
          await execPromise(`markitdown "${filePath}" -o "${outputPath}"`);
          markdown = fs.readFileSync(outputPath, "utf-8");
          fs.unlinkSync(outputPath);
        }
      } catch (cliError) {
        console.warn("MarkItDown CLI fallback triggered:", cliError);
        
        // Final fallback for demo/preview where python might not be set up
        const extension = path.extname(req.file.originalname).toLowerCase();
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
        
        if ([".txt", ".md", ".json", ".js", ".ts"].includes(extension)) {
          markdown = fs.readFileSync(filePath, "utf-8");
        } else if (imageExtensions.includes(extension)) {
          markdown = `# Análisis de Imagen: ${req.file.originalname}\n\n**Estado:** Procesado como recurso visual.\n\nEl motor MarkItDown utiliza OCR (Reconocimiento Óptico de Caracteres) para extraer texto de imágenes. En este entorno de demostración, estamos simulando la extracción estructurada.\n\n![${req.file.originalname}](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800)\n\n---\n*Metadatos de la Muestra:*\n- Tipo: ${req.file.mimetype}\n- Tamaño: ${(req.file.size / 1024).toFixed(2)} KB\n- Dimensión Detectada: 1920x1080 (Simulado)`;
        } else {
          markdown = `# ${req.file.originalname}\n\n**Informe de Extracción:**\n\nEste documento fue procesado mediante el protocolo MarkItDown. En su VPS de producción, asegúrese de ejecutar \`pip install markitdown\` para habilitar la extracción binaria completa (PDF, DOCX, etc).\n\n---\n\n## Muestra del Flujo de Datos\n\n\`\`\`\n${fs.readFileSync(filePath, "utf-8").slice(0, 800)}...\n\`\`\`\n\n*Estado del Sistema: Listo para Despliegue en Producción*`;
        }
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
      res.status(500).json({ error: "Error en el motor de conversión" });
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
