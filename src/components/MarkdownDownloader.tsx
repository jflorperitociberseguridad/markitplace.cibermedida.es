import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Eye, 
  Code,
  CheckCircle2,
  FileCode,
  Sparkles,
  RefreshCw,
  X,
  FileCheck,
  Terminal,
  Cpu,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import axios from "axios";
import { DB } from "../types";

export function MarkdownDownloader({ db, updateDb }: { db: DB, updateDb: (db: DB) => void }) {
  const [markdown, setMarkdown] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "code">("preview");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const LANGUAGES = [
    { id: "python", name: "Python", icon: <Terminal className="w-4 h-4" />, ext: "py", mime: "text/x-python" },
    { id: "mojo", name: "Mojo", icon: <Zap className="w-4 h-4" />, ext: "mojo", mime: "text/x-python" },
    { id: "julia", name: "Julia", icon: <Cpu className="w-4 h-4" />, ext: "jl", mime: "text/x-julia" },
    { id: "javascript", name: "Node.js", icon: <Code className="w-4 h-4" />, ext: "js", mime: "application/javascript" },
    { id: "typescript", name: "TypeScript", icon: <FileCode className="w-4 h-4" />, ext: "ts", mime: "text/typescript" },
    { id: "java", name: "Java", icon: <Cpu className="w-4 h-4" />, ext: "java", mime: "text/x-java-source" },
    { id: "cpp", name: "C++", icon: <Terminal className="w-4 h-4" />, ext: "cpp", mime: "text/x-c++src" },
    { id: "rust", name: "Rust", icon: <Zap className="w-4 h-4" />, ext: "rs", mime: "text/x-rustsource" },
    { id: "go", name: "Go", icon: <Cpu className="w-4 h-4" />, ext: "go", mime: "text/x-go" },
    { id: "sql", name: "SQL", icon: <FileText className="w-4 h-4" />, ext: "sql", mime: "text/x-sql" },
  ];

  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("/api/convert", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMarkdown((prev) => prev + (prev ? "\n\n" : "") + response.data.markdown);
      toast.success("Archivo procesado", {
        description: `${selectedFile.name} convertido a Markdown con éxito.`
      });
      setViewMode("preview");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error de conversión", {
        description: "El motor MarkItDown no pudo procesar este archivo."
      });
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  };

  const transformToCode = async (silent = false) => {
    if (!markdown) return null;
    
    setIsTransforming(true);
    try {
      const currentLang = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0];
      
      const response = await axios.post("/api/transform", {
        markdown,
        language: currentLang.name
      });

      const code = response.data.code || "";
      
      setGeneratedCode(code);
      if (!silent) {
        setViewMode("code");
        toast.success(`Transformación a ${currentLang.name} Completa`, {
          description: "El código ha sido generado y está listo para descargar."
        });
      }
      return code;
    } catch (error: any) {
      console.error("Transformation error:", error);
      const errorMsg = error.response?.data?.details || error.message;
      if (!silent) {
        toast.error("Error de IA", { description: errorMsg || "No se pudo realizar la transformación de código." });
      }
      return null;
    } finally {
      setIsTransforming(false);
    }
  };

  const handleExportCode = async () => {
    if (!markdown) {
      toast.error("Operación no permitida", { description: "Primero debes tener contenido extraído en Markdown." });
      return;
    }

    if (generatedCode) {
      downloadCode();
    } else {
      toast.loading("Generando lógica...", { id: "export-transform" });
      const code = await transformToCode(true);
      if (code) {
        toast.dismiss("export-transform");
        // We delay slightly to ensure state or just use the returned code
        const currentLang = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0];
        const fileName = file ? file.name.split('.')[0] : "cybermedida_logic";
        downloadBlob(code, `${fileName}_${new Date().getTime()}.${currentLang.ext}`, currentLang.mime);
      } else {
        toast.error("Falló la generación automática", { id: "export-transform" });
      }
    }
  };

  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    if (!content || content.trim() === "") {
      toast.error("No hay contenido para descargar", {
        description: "Primero debes extraer o transformar algún contenido."
      });
      return;
    }
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      
      // Mandatory for iFrame/mobile downloads
      document.body.appendChild(link);
      link.click();
      
      // Small delay for browser interaction
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Descarga Iniciada`, {
        description: `Archivo ${filename} generado con éxito.`
      });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Error de Descarga", {
        description: "El sistema no pudo procesar la solicitud de descarga local."
      });
    }
  };

  const downloadMarkdown = () => {
    const fileName = file ? file.name.split('.')[0] : "cybermedida_export";
    downloadBlob(markdown, `${fileName}_${new Date().getTime()}.md`, "text/markdown");
  };

  const downloadCode = () => {
    const currentLang = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0];
    const fileName = file ? file.name.split('.')[0] : "cybermedida_logic";
    downloadBlob(generatedCode, `${fileName}_${new Date().getTime()}.${currentLang.ext}`, currentLang.mime);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const copyToClipboard = () => {
    const textToCopy = viewMode === "code" ? generatedCode : markdown;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Copiado al portapapeles");
  };

  const clearWorkspace = () => {
    setMarkdown("");
    setGeneratedCode("");
    setFile(null);
    toast.info("Espacio de trabajo despejado");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Herramientas / <span className="text-indigo-600">Conversor Universal</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Extracción MarkItDown</h2>
          <p className="text-sm text-slate-500">Convierte documentos complejos (PDF, DOCX, XLSX, IMG) en Markdown y Lógica de IA.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            onClick={clearWorkspace} 
            disabled={!markdown && !file}
            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 font-bold uppercase tracking-widest text-[10px] h-10 px-4 flex-1 sm:flex-none shadow-sm"
          >
            <Trash2 className="w-3 h-3 mr-2" /> Limpiar
          </Button>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              onClick={downloadMarkdown}
              disabled={!markdown}
              className="flex-1 sm:flex-none rounded-xl bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-md shadow-slate-200 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 mr-2" /> Exportar .MD
            </Button>
            
            <Button 
              onClick={handleExportCode}
              disabled={!markdown || isTransforming}
              className="flex-1 sm:flex-none rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              {isTransforming ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-2" />}
              Exportar .{LANGUAGES.find(l => l.id === selectedLanguage)?.ext || 'code'}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dropzone & Status Area */}
        <div className="lg:col-span-4 space-y-6">
          <label 
            htmlFor="file-upload"
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-3xl transition-all cursor-pointer overflow-hidden p-8 text-center",
              dragActive ? "border-indigo-500 bg-indigo-50/50 shadow-inner" : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
            )}
          >
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin" />
                  <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">Extrayendo Datos</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Motor MarkItDown en Ejecución...</p>
                </div>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <FileCheck className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-slate-800 truncate max-w-[200px] px-4">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={(e) => { e.preventDefault(); setFile(null); }}
                   className="text-slate-400 hover:text-rose-600 text-[10px] font-bold uppercase tracking-widest"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-indigo-600 transition-transform group-hover:scale-110">
                  <Upload className="w-10 h-10" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Cargar Documento</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                  Arrastra aquí o haz clic para explorar<br/>
                  <span className="text-indigo-400">Pipeline de Extracción IA Activado</span>
                </p>
                <div className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-xl shadow-indigo-100 transition-all">
                  Seleccionar Archivo
                </div>
              </>
            )}

            {dragActive && (
              <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] flex items-center justify-center border-4 border-indigo-500 rounded-3xl m-1">
                <div className="bg-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                  <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">Proceder con la Ingesta</span>
                </div>
              </div>
            )}
          </label>

          <Card className="rounded-2xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden p-6 relative">
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Status: AI Transformer Active</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Lenguaje de Destino</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setSelectedLanguage(lang.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                          selectedLanguage === lang.id 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {lang.icon}
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                   onClick={() => transformToCode()}
                   disabled={!markdown || isTransforming}
                   className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[9px] h-10 shadow-lg shadow-indigo-900/40"
                >
                   {isTransforming ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Cpu className="w-3 h-3 mr-2" />}
                   TRANSFORMAR A {selectedLanguage.toUpperCase()}
                </Button>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 blur-sm scale-150">
                <Terminal className="w-24 h-24" />
             </div>
          </Card>
        </div>

        {/* Output Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-[600px]">
          <Card className="rounded-3xl border-slate-200 shadow-2xl bg-white overflow-hidden flex-1 flex flex-col border-none">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between px-8 py-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div 
                  onClick={() => setViewMode("edit")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest cursor-pointer transition-all uppercase whitespace-nowrap",
                    viewMode === "edit" ? "bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Code className="w-3 h-3" /> RAW MD
                </div>
                <div 
                  onClick={() => setViewMode("preview")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest cursor-pointer transition-all uppercase whitespace-nowrap",
                    viewMode === "preview" ? "bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Eye className="w-3 h-3" /> PREVIEW
                </div>
                <div 
                  onClick={() => setViewMode("code")}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-widest cursor-pointer transition-all uppercase whitespace-nowrap",
                    viewMode === "code" ? "bg-white shadow-sm text-amber-600 ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Terminal className="w-3 h-3" /> {selectedLanguage.toUpperCase()} ENGINE
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyToClipboard}
                  disabled={viewMode === "code" ? !generatedCode : !markdown}
                  className="h-8 px-3 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white font-bold text-[9px] uppercase tracking-widest"
                >
                  <Copy className="w-3.5 h-3.5 mr-2" /> COPIAR
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-slate-50/30">
              {viewMode === "edit" ? (
                <Textarea 
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="El contenido extraído aparecerá aquí..."
                  className="w-full h-full border-none focus:ring-0 rounded-none p-10 font-mono text-xs leading-relaxed resize-none bg-transparent min-h-[500px]"
                />
              ) : viewMode === "code" ? (
                <div className="p-0 flex flex-col h-full bg-slate-900">
                   <Textarea 
                      value={generatedCode}
                      onChange={(e) => setGeneratedCode(e.target.value)}
                      placeholder={`Ejecuta 'TRANSFORMAR A ${selectedLanguage.toUpperCase()}' para generar el script de automatización...`}
                      className="w-full h-full border-none focus:ring-0 rounded-none p-10 font-mono text-[11px] leading-relaxed resize-none bg-transparent min-h-[500px] text-emerald-400"
                   />
                </div>
              ) : (
                <div className="p-10 markdown-body prose prose-slate max-w-none prose-headings:font-extrabold prose-p:text-slate-600 prose-sm h-full overflow-y-auto bg-white min-h-[500px] border-none">
                  {markdown ? (
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-300 gap-6 grayscale">
                      <div className="p-8 bg-slate-50 rounded-full border-2 border-dashed border-slate-100">
                        <FileText className="w-16 h-16 opacity-20" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Data Stream Idle</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Esperando comando de conversión</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-between px-4 py-2">
             <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Size: {viewMode === "code" ? generatedCode.length : markdown.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Node: CM-EXTRACTOR-A1</span>
                </div>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pipeline {viewMode === "code" ? "Code Transform" : "MarkItDown"} Operativo
             </p>
          </div>
        </div>
      </div>
    </div>

  );
}
