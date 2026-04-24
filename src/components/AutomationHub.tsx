import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Star, 
  Tag as TagIcon, 
  Trash2, 
  ExternalLink,
  Code2,
  Copy,
  FolderOpen,
  Zap,
  Bot,
  Send,
  X,
  Sparkles,
  MessageSquare,
  Save,
  Rocket
} from "lucide-react";
import { DB, SavedPrompt } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface AutomationHubProps {
  db: DB;
  updateDb: (db: DB) => void;
}

interface Message {
  role: "user" | "model";
  text: string;
}

export function AutomationHub({ db, updateDb }: AutomationHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  
  // Consultant State
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const startConsultant = () => {
    setIsConsultantOpen(true);
    if (messages.length === 0) {
      setMessages([
        { 
          role: "model", 
          text: "¡Hola! Soy el Consultor de Automatización de CyberMedida. Mi misión es ayudarte a optimizar tus conexiones y flujos de trabajo con IA.\n\nPara empezar, ¿qué tipo de tarea o proceso te gustaría automatizar hoy? (Ej: Triaje de emails, sincronización CRM, reporte de ventas...)" 
        }
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isThinking) return;

    const userMessage: Message = { role: "user", text: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          ...history,
          { role: "user", parts: [{ text: inputText }] }
        ],
        config: {
          systemInstruction: `Eres un Arquitecto de Automatización experto de CyberMedida. Tu objetivo es ayudar al usuario a automatizar sus procesos y conexiones de datos.
          
          ESTRATEGIA:
          1. Haz preguntas inteligentes y breves, de una en una, para entender el flujo de trabajo.
          2. Pregunta específicamente por:
             - Herramientas involucradas (Google Sheets, Notion, Stripe, etc).
             - Evento disparador (Trigger).
             - Acción principal deseada.
             - Reglas o condiciones críticas.
          3. SÉ PROACTIVO: Sugiere opciones que el usuario quizás no ha considerado.
          4. FORMATO: Usa Markdown para que la respuesta sea legible.
          5. Al final, cuando tengas suficiente información, propón una "Receta de Automatización" detallada con pasos técnicos.`,
        }
      });

      const modelMessage: Message = { 
        role: "model", 
        text: response.text || "Lo siento, mi nodo de procesamiento ha tenido un hipo. ¿Podemos intentarlo de nuevo?"
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Consultant error:", error);
      toast.error("Error de conexión con el Consultor IA");
    } finally {
      setIsThinking(false);
    }
  };

  const [isNewScriptOpen, setIsNewScriptOpen] = useState(false);
  const [newScript, setNewScript] = useState({ title: "", content: "", category: "comunicación" });

  const handleCreateScript = () => {
    if (!newScript.title || !newScript.content) {
      toast.error("Por favor, completa el título y el contenido");
      return;
    }

    const scriptToAdd: SavedPrompt = {
      id: Math.random().toString(36).substr(2, 9),
      title: newScript.title,
      content: newScript.content,
      tags: [newScript.category],
      isFavorite: false,
      createdAt: new Date().toISOString()
    };

    const newDb = { ...db, prompts: [scriptToAdd, ...db.prompts] };
    updateDb(newDb);
    setIsNewScriptOpen(false);
    setNewScript({ title: "", content: "", category: "comunicación" });
    toast.success("Nuevo script añadido a la bóveda");
  };

  const automations = db.prompts.filter(p => true);

  const filteredPrompts = automations.filter(p => 
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.content.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!filter || p.tags.includes(filter))
  );

  const categories = Array.from(new Set(automations.flatMap(p => p.tags)));

  const toggleFavorite = (id: string) => {
    const newDb = { ...db };
    const prompt = newDb.prompts.find(p => p.id === id);
    if (prompt) {
      prompt.isFavorite = !prompt.isFavorite;
      updateDb(newDb);
      toast.success(prompt.isFavorite ? "Artefacto marcado" : "Artefacto desmarcado");
    }
  };

  const deletePrompt = (id: string) => {
    const newDb = { ...db, prompts: db.prompts.filter(p => p.id !== id) };
    updateDb(newDb);
    toast.success("Script eliminado del Hub");
  };

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-700 relative h-full">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Repositorio / <span className="text-indigo-600">Bóveda de Automatización</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Centro de Automatización</h2>
            <p className="text-sm text-slate-500">Almacenamiento centralizado de scripts validados y lógica de orquestación IA.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={startConsultant}
              className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold uppercase tracking-widest text-[10px] h-10 px-6 transition-all"
            >
              <Bot className="w-4 h-4 mr-2" /> Consultor de IA
            </Button>
            <Button 
              onClick={() => setIsNewScriptOpen(true)}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-indigo-100 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Nuevo Script
            </Button>
          </div>
        </div>
      </header>

      {/* New Script Dialog */}
      <Dialog open={isNewScriptOpen} onOpenChange={setIsNewScriptOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-600" /> Desplegar Nuevo Script
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Configura un nuevo activo de inteligencia para la bóveda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Script</Label>
              <Input 
                id="title" 
                placeholder="Ej: Análisis de Sentimiento Global" 
                className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-600 h-11"
                value={newScript.title}
                onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría / Tag Principal</Label>
              <Select 
                value={newScript.category} 
                onValueChange={(val) => setNewScript({ ...newScript, category: val })}
              >
                <SelectTrigger className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-600 h-11 text-sm">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="comunicación">Comunicación</SelectItem>
                  <SelectItem value="ia">Inteligencia Artificial</SelectItem>
                  <SelectItem value="ventas">Ventas & CRM</SelectItem>
                  <SelectItem value="seguridad">CyberSeguridad</SelectItem>
                  <SelectItem value="datos">Análisis de Datos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lógica del Script (Código/Prompt)</Label>
              <Textarea 
                id="content" 
                placeholder="Introduce la lógica aquí..." 
                className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-600 min-h-[200px] font-mono text-xs"
                value={newScript.content}
                onChange={(e) => setNewScript({ ...newScript, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setIsNewScriptOpen(false)}
              className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateScript}
              className="rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] px-8"
            >
              <Save className="w-4 h-4 mr-2" /> Guardar en Bóveda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isConsultantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg h-[90vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border-none animate-in slide-in-from-right duration-300">
            <CardHeader className="bg-indigo-600 text-white p-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-extrabold tracking-tight">Arquitecto de Automatización</CardTitle>
                  <CardDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Estatus: Consultoría Activa</CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 rounded-full"
                onClick={() => setIsConsultantOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                    m.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-slate-100 text-slate-800 rounded-tl-none prose prose-indigo prose-sm"
                  )}>
                    {m.role === "model" ? (
                      <div className="markdown-body">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs animate-pulse italic">
                  <Sparkles className="w-4 h-4" />
                  Arquitecto analizando flujos...
                </div>
              )}
            </CardContent>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <div className="relative flex items-center gap-2">
                <Input 
                  placeholder="Responde al consultor o pide un cambio..."
                  className="rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-600 pr-12 h-12 text-sm"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button 
                  size="icon" 
                  className="absolute right-1 w-10 h-10 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-100"
                  onClick={handleSendMessage}
                  disabled={isThinking}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[9px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                Protegido por el Protocolo de Seguridad CyberMedida
              </p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Search className="w-3.5 h-3.5" /> Filtro de Inteligencia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Input 
                  placeholder="Escanear repositorio..." 
                  className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 text-xs pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300" />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clasificación</label>
                <div className="flex flex-wrap gap-1.5">
                  <Badge 
                    variant={filter === null ? "default" : "outline"}
                    className={cn("rounded-lg text-[10px] font-bold cursor-pointer transition-all", 
                      filter === null ? "bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                    onClick={() => setFilter(null)}
                  >
                    TODO EL INVENTARIO
                  </Badge>
                  {categories.map(cat => (
                    <Badge 
                      key={cat}
                      variant={filter === cat ? "default" : "outline"}
                      className={cn("rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                        filter === cat ? "bg-indigo-600 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                      onClick={() => setFilter(cat)}
                    >
                      {cat.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick AI Tip */}
          <Card className="rounded-xl border-indigo-100 bg-indigo-50/50 p-6 border-2 border-dashed">
             <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                   <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">¿Sin ideas?</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed mt-1">Lanza el consultor para recibir sugerencias de automatización basadas en tu flujo.</p>
                </div>
                <Button 
                   variant="link" 
                   className="text-[10px] font-bold text-indigo-600 uppercase h-auto p-0"
                   onClick={startConsultant}
                >
                   Hablar con el Arquitecto
                </Button>
             </div>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden p-6 relative">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Estado del Módulo</p>
              <h3 className="text-xl font-extrabold tracking-tight italic">BÓVEDA CIFRADA</h3>
              <div className="mt-8 flex justify-between items-end border-t border-white/10 pt-4">
                <div className="text-3xl font-bold leading-none">{automations.length}</div>
                <div className="text-[9px] font-bold text-white/40 tracking-widest">SCRIPTS ACTIVOS</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-10 blur-xl">
               <Zap className="w-32 h-32 text-indigo-500" />
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPrompts.length > 0 ? (
              filteredPrompts.map((prompt) => (
                <Card key={prompt.id} className="rounded-xl border-slate-200 shadow-sm hover:shadow-md bg-white group hover:border-indigo-200 transition-all overflow-hidden flex flex-col">
                  <header className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <CardTitle className="text-[13px] font-bold text-slate-800">
                          {prompt.title}
                        </CardTitle>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(prompt.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 items-center">
                      <button 
                        className={cn("p-1.5 rounded-lg hover:bg-white transition-colors", prompt.isFavorite ? "text-amber-400" : "text-slate-300 hover:text-slate-400")}
                        onClick={() => toggleFavorite(prompt.id)}
                      >
                        <Star className={cn("w-4 h-4", prompt.isFavorite ? "fill-current" : "")} />
                      </button>
                      <button 
                        className="p-1.5 rounded-lg hover:bg-white text-slate-300 hover:text-rose-500 transition-colors"
                        onClick={() => deletePrompt(prompt.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </header>
                  <CardContent className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono text-[11px] h-28 overflow-hidden relative text-slate-600 shadow-inner">
                      {prompt.content}
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{tag}</span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-lg border-slate-200 hover:border-indigo-600 hover:text-indigo-600 font-bold text-[10px] uppercase h-9 shadow-sm"
                        onClick={() => copyPrompt(prompt.content)}
                      >
                        <Copy className="w-3.5 h-3.5 mr-2" /> Sincronizar Local
                      </Button>
                      <Button 
                        size="icon"
                        className="rounded-lg bg-slate-900 hover:bg-indigo-600 text-white h-9 w-9 p-0 shadow-md transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center bg-slate-50/50">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4">
                   <FolderOpen className="w-12 h-12 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No se han encontrado activos en caché</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
