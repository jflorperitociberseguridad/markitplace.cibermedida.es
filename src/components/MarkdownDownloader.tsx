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
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import axios from "axios";

import { DB } from "../types";

export function MarkdownDownloader({ db, updateDb }: { db: DB, updateDb: (db: DB) => void }) {
  const [markdown, setMarkdown] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const downloadMarkdown = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = file ? file.name.split('.')[0] : "cybermedida_export";
    a.download = `${fileName}_${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Descarga iniciada", { icon: <Download className="w-4 h-4 text-indigo-600" /> });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    toast.success("Copiado al portapapeles");
  };

  const clearWorkspace = () => {
    setMarkdown("");
    setFile(null);
    toast.info("Espacio de trabajo despejado");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Herramientas / <span className="text-indigo-600">Conversor Universal</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Extracción MarkItDown</h2>
            <p className="text-sm text-slate-500">Convierte documentos complejos (PDF, DOCX, XLSX, IMG) en Markdown estructurado.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={clearWorkspace} 
              disabled={!markdown && !file}
              className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 font-bold uppercase tracking-widest text-[10px] h-10 px-4"
            >
              <Trash2 className="w-3 h-3 mr-2" /> Limpiar
            </Button>
            <Button 
              onClick={downloadMarkdown}
              disabled={!markdown}
              className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-slate-100 transition-all"
            >
              <Download className="w-3.5 h-3.5 mr-2" /> Descargar .MD
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
                   <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Status: Terminal Local Ready</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  El motor MarkItDown procesa archivos binarios en tiempo real, transformándolos en un flujo de datos compatible con agentes LLM y sistemas de documentación.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold uppercase tracking-wider">PDF-OCR</div>
                  <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold uppercase tracking-wider">DOCX-XML</div>
                  <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold uppercase tracking-wider">XL-MAP</div>
                </div>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 blur-sm scale-150">
                <FileCode className="w-24 h-24" />
             </div>
          </Card>
        </div>

        {/* Output Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-[600px]">
          <Card className="rounded-3xl border-slate-200 shadow-2xl bg-white overflow-hidden flex-1 flex flex-col border-none">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between px-8 py-4">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setViewMode("edit")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest cursor-pointer transition-all uppercase",
                    viewMode === "edit" ? "bg-white shadow-md text-indigo-600 scale-105" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Code className="w-3.5 h-3.5" /> RAW
                </div>
                <div 
                  onClick={() => setViewMode("preview")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest cursor-pointer transition-all uppercase",
                    viewMode === "preview" ? "bg-white shadow-md text-indigo-600 scale-105" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" /> PREVIEW
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyToClipboard}
                  disabled={!markdown}
                  className="h-9 px-4 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white font-bold text-[9px] uppercase tracking-widest"
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
                  placeholder="El contenido extraído aparecerá aquí. Puedes editar directamente el Markdown para refinar los resultados..."
                  className="w-full h-full border-none focus:ring-0 rounded-none p-10 font-mono text-xs leading-relaxed resize-none bg-transparent min-h-[500px]"
                />
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
                  <span>C: {markdown.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>L: {markdown.split("\n").length}</span>
                </div>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> MarkItDown V2.4 Pipeline Operativo
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
