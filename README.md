# PromptMaster Pro & MarkItDown Hub 🚀

**PromptMaster Pro & MarkItDown Hub** is a powerful, full-stack web application designed for AI enthusiasts, prompt engineers, and developers. It serves as a centralized dashboard for professional document extraction, prompt management, and AI-driven automation.

![Licencia](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React%2019-61dafb.svg)
![Express](https://img.shields.io/badge/backend-Express.js-000000.svg)
![Tailwind](https://img.shields.io/badge/styling-Tailwind%20CSS-38b2ac.svg)

---

## ✨ Características Principales

### 📄 Extracción MarkItDown Universal
Convierte documentos empresariales complejos en formatos listos para IA:
- **Soporte de Formatos:** PDF, DOCX, TXT, MD, JSON, CSV.
- **Procesamiento Inteligente:** Extracción limpia de texto estructurado.
- **Previsualización Real-time:** Edición y visualización de Markdown instantánea.

### 🤖 Motor de Transformación de Lenguajes
Convierte tu lógica de Markdown en scripts de automatización funcionales utilizando Gemini AI:
- **Lenguajes Soportados:** Python, Mojo, Julia, Node.js, TypeScript, Java, C++, Rust, Go y SQL.
- **Automatización Inteligente:** La IA interpreta el proceso descrito y genera el código necesario.
- **Exportación Directa:** Descarga los scripts generados con un solo clic.

### 🏛️ Bóveda de Automatización
Almacena y organiza tus scripts validados y lógica de orquestación.
- **Consultor de IA Integrado:** Chatbot especializado para ayudarte a optimizar tus scripts.
- **Repositorio Visual:** Interfaz moderna para gestionar nodos y lógica de automatización.

### 🎭 Laboratorio de Prompt Engineering
Espacio dedicado para diseñar, probar y perfeccionar prompts de alta complejidad con previsualización dinámica.

---

## 🛠️ Instalación y Configuración

### Prerrequisitos
- **Node.js** (v18 o superior)
- **NPM** o **Yarn**
- **API Key de Google Gemini** (Obtenla en [Google AI Studio](https://aistudio.google.com/))

### Pasos de Instalación

1. **Clonar el Repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd promptmaster-hub
   ```

2. **Instalar Dependencias**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno**
   Crea un archivo `.env` en la raíz del proyecto (o usa `.env.example` como base):
   ```env
   GEMINI_API_KEY=tu_api_key_aqui
   NODE_ENV=development
   ```

4. **Ejecutar en Modo Desarrollo**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

---

## 🏗️ Estructura del Proyecto

```text
├── server.ts           # Servidor Express (Motor de Extracción y API Gemini)
├── src/
│   ├── App.tsx         # Componente Principal y Router
│   ├── components/     # Componentes de UI (MarkdownDownloader, AutomationHub, etc.)
│   ├── types.ts        # Definiciones de TypeScript
│   └── index.css       # Estilos globales (Tailwind CSS)
├── uploads/            # Carpeta temporal para procesamiento de archivos
└── data/               # Almacenamiento local (JSON) para la base de datos
```

---

## 🚀 Despliegue a Producción

Para generar el build optimizado:

```bash
npm run build
```

El servidor puede iniciarse en producción usando:

```bash
NODE_ENV=production npm start
```

---

## 🛡️ Seguridad y Buenas Prácticas
- **Aislamiento de API Keys:** Las claves de API se manejan exclusivamente en el servidor (`server.ts`).
- **Limpieza de Datos:** Los archivos subidos se eliminan automáticamente tras el procesamiento.
- **Validación de Tipos:** Implementación estricta de TypeScript para prevenir errores en tiempo de ejecución.

---

## 📄 Licencia
Este proyecto está bajo la licencia MIT.

---
*Desarrollado con ❤️ para la comunidad de Inteligencia Artificial.*
