import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  X, 
  RefreshCcw,
  Sparkles,
  FileCode
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { DB } from "../types";
import { toast } from "sonner";
import axios from "axios";

interface MarkdownDownloaderProps {
  db: DB;
  updateDb: (db: DB) => void;
}

export function MarkdownDownloader({ db, updateDb }: MarkdownDownloaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState("preview");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      toast.success(`Interpretado: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: false,
  });

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/convert", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMarkdown(res.data.markdown);
      
      const updatedDb = await axios.get("/api/db");
      updateDb(updatedDb.data);
      
      toast.success("Secuencia de extracción completa");
    } catch (error) {
      console.error(error);
      toast.error("Fallo en el nodo MarkDown");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (file?.name.split(".")[0] || "document") + ".md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Stream descargado a disco");
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Procesador / <span className="text-indigo-600">Motor MarkItDown</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">MarkDown Pro</h2>
        <p className="text-sm text-slate-500">Pipeline profesional de conversión de documentos y extracción de datos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Upload & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Upload className="w-4 h-4" /> Ingesta de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!file ? (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed transition-all duration-300 h-72 flex flex-col items-center justify-center p-8 text-center cursor-pointer rounded-xl ${
                    isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-slate-400 bg-slate-50/30"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="bg-white p-5 rounded-2xl text-slate-400 mb-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Suelte archivos para convertir</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">PDF, DOCX, XLSX, IMG, HTML, TXT</p>
                  <Button variant="outline" className="mt-8 rounded-lg border-slate-200 text-indigo-600 font-bold text-[10px] uppercase h-9 shadow-sm">
                    Seleccionar desde Disco Local
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-4 bg-slate-50/50 shadow-inner">
                    <div className="bg-slate-900 p-2.5 rounded-lg text-white shadow-lg">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button className="p-1 text-slate-300 hover:text-rose-500 transition-colors" onClick={() => setFile(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <Button 
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs h-12 transition-all shadow-lg shadow-indigo-100"
                    onClick={processFile}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Sparkles className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                    {isProcessing ? "Procesando Stream..." : "Convertir a Markdown"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden p-8 relative">
            <h3 className="text-xl font-extrabold tracking-tighter italic uppercase z-10 relative">Nodo MarkItPlace</h3>
            <p className="text-[11px] font-medium text-slate-400 uppercase z-10 relative mt-2 leading-relaxed tracking-wider">
              Servicio Optimizado: <br />
              <span className="text-indigo-400 font-bold">MARKITPLACE.CIBERMEDIDA.ES</span>
            </p>
            <div className="mt-8 flex items-center justify-between z-10 relative border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[10px] font-bold tracking-widest uppercase">Nodo Listo</span>
              </div>
              <div className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Latencia: 152ms</div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 blur-sm scale-150 rotate-12">
                <FileText className="w-32 h-32" />
            </div>
          </Card>
        </div>

        {/* Preview / Edit Area */}
        <div className="lg:col-span-3">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white h-full flex flex-col overflow-hidden">
            <header className="bg-slate-50 border-b border-slate-100 flex items-center justify-between p-4 flex-shrink-0">
               <Tabs value={currentView} onValueChange={setCurrentView} className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                  <TabsList className="bg-transparent h-8 p-0">
                    <TabsTrigger value="preview" className="rounded-md h-full text-[10px] font-bold px-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all uppercase">
                      <Eye className="w-3 h-3 mr-2" /> Previsualizar
                    </TabsTrigger>
                    <TabsTrigger value="edit" className="rounded-md h-full text-[10px] font-bold px-4 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all uppercase">
                      <Edit3 className="w-3 h-3 mr-2" /> MD Crudo
                    </TabsTrigger>
                  </TabsList>
               </Tabs>
               
               {markdown && (
                 <Button 
                   size="sm" 
                   className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-9 uppercase px-5 shadow-lg shadow-emerald-100 transition-all"
                   onClick={downloadMarkdown}
                 >
                   <Download className="w-3.5 h-3.5 mr-2" /> Descargar Paquete
                 </Button>
               )}
            </header>
            <CardContent className="p-0 flex-1 relative overflow-auto bg-slate-50/20">
              {markdown ? (
                currentView === "preview" ? (
                  <div className="p-10 markdown-body prose prose-slate max-w-none prose-indigo prose-headings:font-bold prose-headings:tracking-tight">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea 
                    className="w-full h-full p-10 font-mono text-sm border-none focus:ring-0 resize-none bg-white min-h-[500px] shadow-inner"
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                  />
                )
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl m-8 bg-white/50">
                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-50 mb-4 opacity-50">
                    <FileText className="w-12 h-12 text-slate-200" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Esperando Stream de Extracción...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
