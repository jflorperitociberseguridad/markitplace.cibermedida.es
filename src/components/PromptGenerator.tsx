import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Terminal, 
  Copy, 
  Save, 
  Wand2, 
  Settings2,
  RefreshCcw,
  Check
} from "lucide-react";
import { DB, SavedPrompt } from "../types";
import { toast } from "sonner";
import axios from "axios";

interface PromptGeneratorProps {
  db: DB;
  updateDb: (db: DB) => void;
}

export function PromptGenerator({ db, updateDb }: PromptGeneratorProps) {
  const [audience, setAudience] = useState("");
  const [format, setFormat] = useState("text");
  const [style, setStyle] = useState("professional");
  const [detail, setDetail] = useState("medium");
  const [topic, setTopic] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePrompt = async () => {
    if (!topic) {
      toast.error("Por favor, introduce un tema o tarea para el prompt");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        topic,
        audience,
        format,
        style,
        detail,
        apiKey: localStorage.getItem("GEMINI_API_KEY")
      };

      const response = await axios.post("/api/generate-prompt", payload);
      const result = response.data.prompt || "Generation failure";
      setGeneratedPrompt(result);
      
      const newDb = { ...db };
      newDb.stats.totalTokens += result.length / 4;
      updateDb(newDb);
      
      toast.success("Prompt generado con éxito");
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.details || error.message;
      toast.error("Error de conexión con el Nodo IA", { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copiado a la clipboard");
  };

  const savePrompt = () => {
    if (!generatedPrompt) return;

    const newPrompt: SavedPrompt = {
      id: Math.random().toString(36).substr(2, 9),
      title: topic.slice(0, 30) + (topic.length > 30 ? "..." : ""),
      content: generatedPrompt,
      type: 'advanced',
      tags: [format, style],
      category: "Engineering",
      isFavorite: false,
      createdAt: Date.now(),
    };

    const newDb = { ...db, prompts: [newPrompt, ...db.prompts] };
    updateDb(newDb);
    toast.success("Artefacto guardado en el Lab");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Laboratorio / <span className="text-indigo-600">Nodo de Ingeniería de Prompts</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Lab de Prompts Avanzado</h2>
          <p className="text-sm text-slate-500">Configura parámetros para generar directivas de IA de alta precisión.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" /> Matriz de Parámetros
            </CardTitle>
            <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase"
                onClick={() => { setTopic(""); setAudience(""); setGeneratedPrompt(""); }}
              >
                <RefreshCcw className="w-3 h-3 mr-2" /> Reiniciar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 flex-1">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Objetivo de la Misión</Label>
              <Textarea 
                placeholder="Describe el comportamiento o tarea deseada de la IA..." 
                className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24 text-sm"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Público Objetivo</Label>
                <Input 
                  placeholder="ej. Científicos de Datos" 
                  className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Firma de Salida</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="text">TEXTO PLANO</SelectItem>
                    <SelectItem value="json">ESQUEMA JSON</SelectItem>
                    <SelectItem value="steps">PASOS PRECEDURALES</SelectItem>
                    <SelectItem value="markdown">TABLAS MARKDOWN</SelectItem>
                    <SelectItem value="python">LÓGICA PYTHON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arquetipo de Escritura</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="professional">PROFESIONAL</SelectItem>
                    <SelectItem value="creative">CREATIVO</SelectItem>
                    <SelectItem value="technical">TÉCNICO</SelectItem>
                    <SelectItem value="minimal">MINIMALISTA</SelectItem>
                    <SelectItem value="academic">ACADÉMICO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nivel de Densidad</Label>
                <Select value={detail} onValueChange={setDetail}>
                  <SelectTrigger className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="brief">CONCISO</SelectItem>
                    <SelectItem value="medium">EQUILIBRADO</SelectItem>
                    <SelectItem value="extensive">EXHAUSTIVO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs h-12 transition-all shadow-lg shadow-indigo-200 group mt-4"
              onClick={generatePrompt}
              disabled={loading}
            >
              {loading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />}
              {loading ? "Construyendo directiva..." : "Generar Prompt"}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col relative">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" /> Resultado Compilado
            </CardTitle>
            {generatedPrompt && (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">Lógica Validada</span>
            )}
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col min-h-[400px]">
            {generatedPrompt ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono text-[13px] leading-relaxed relative whitespace-pre-wrap text-slate-100 shadow-inner">
                  {generatedPrompt}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-700 transition-colors" 
                        onClick={copyToClipboard}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button 
                    className="flex-1 rounded-xl border-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 font-bold uppercase text-xs h-12 transition-colors shadow-sm"
                    onClick={savePrompt}
                  >
                    <Save className="w-4 h-4 mr-2" /> Guardar en Hub
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 font-bold uppercase text-xs h-12 transition-colors shadow-lg shadow-slate-200"
                    onClick={generatePrompt}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" /> Re-construir
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl m-2">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Terminal className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Esperando Inyección de Parámetros...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
