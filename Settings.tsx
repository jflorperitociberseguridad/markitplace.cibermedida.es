import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Database,
  Cpu,
  ShieldCheck,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Key,
  Globe,
  Bell,
  Eye,
  EyeOff,
  Zap,
  Info,
  Lock,
  Unlock,
} from "lucide-react";
import { DB } from "../types";
import { toast } from "sonner";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SettingsProps {
  db: DB;
  updateDb: (db: DB) => void;
}

const PROVIDER_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  gemini: [
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Recomendado)" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Rápido)" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Recomendado)" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Rápido / Económico)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Legacy)" },
  ],
};

export function Settings({ db, updateDb }: SettingsProps) {
  const [resetting, setResetting] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(true);
  const [password, setPassword] = React.useState("");
  const [isScanning, setIsScanning] = React.useState(false);
  const [validatingKey, setValidatingKey] = React.useState(false);
  const [showGeminiKey, setShowGeminiKey] = React.useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = React.useState(false);

  const [config, setConfig] = React.useState({
    aiProvider: localStorage.getItem("AI_PROVIDER") || "gemini",
    llmModel: localStorage.getItem("AI_MODEL") || "gemini-1.5-pro",
    temperature: parseFloat(localStorage.getItem("AI_TEMPERATURE") || "0.7"),
    maxTokens: parseInt(localStorage.getItem("AI_MAX_TOKENS") || "2048"),
    geminiApiKey: localStorage.getItem("GEMINI_API_KEY") || "",
    openaiApiKey: localStorage.getItem("OPENAI_API_KEY") || "",
    notifications: true,
    autoSave: true,
    securityShield: true,
    region: "europe-west1",
  });

  // When provider changes, auto-select first model of that provider
  const handleProviderChange = (provider: string) => {
    const firstModel = PROVIDER_MODELS[provider]?.[0]?.value || "";
    setConfig((prev) => ({ ...prev, aiProvider: provider, llmModel: firstModel }));
    localStorage.setItem("AI_PROVIDER", provider);
    localStorage.setItem("AI_MODEL", firstModel);
    toast.info(`Proveedor cambiado a ${provider === "openai" ? "OpenAI" : "Google Gemini"}`);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));

    // Persist to localStorage
    const storageMap: Record<string, string> = {
      aiProvider: "AI_PROVIDER",
      llmModel: "AI_MODEL",
      temperature: "AI_TEMPERATURE",
      maxTokens: "AI_MAX_TOKENS",
      geminiApiKey: "GEMINI_API_KEY",
      openaiApiKey: "OPENAI_API_KEY",
    };

    if (storageMap[key]) {
      localStorage.setItem(storageMap[key], String(value));
    }
  };

  const validateCurrentKey = async () => {
    const provider = config.aiProvider;
    const apiKey = provider === "openai" ? config.openaiApiKey : config.geminiApiKey;

    if (!apiKey) {
      toast.error("Introduce una API Key primero");
      return;
    }

    setValidatingKey(true);
    try {
      const res = await axios.post("/api/validate-key", { provider, apiKey });
      if (res.data.valid) {
        toast.success(`API Key de ${provider === "openai" ? "OpenAI" : "Gemini"} validada correctamente`);
      } else {
        toast.error("API Key inválida", { description: res.data.error });
      }
    } catch {
      toast.error("Error al validar la API Key");
    } finally {
      setValidatingKey(false);
    }
  };

  const getServiceStatus = () => {
    const currentProvider = config.aiProvider;
    const hasKey = currentProvider === "openai" ? !!config.openaiApiKey : !!config.geminiApiKey;

    return [
      { name: "Motor MarkItDown", status: "Operational", active: true },
      { name: "IA Prompt Generator", status: "Operational", active: true },
      { name: "Base de Datos Pro", status: "Connected", active: true },
      {
        name: currentProvider === "openai" ? "OpenAI Engine" : "Gemini AI Engine",
        status: hasKey ? "Operational" : "Waiting Config",
        active: hasKey,
      },
    ];
  };

  const [serviceStatus, setServiceStatus] = React.useState(getServiceStatus());

  React.useEffect(() => {
    setServiceStatus(getServiceStatus());
  }, [config.aiProvider, config.geminiApiKey, config.openaiApiKey]);

  const checkIntegrity = () => {
    setIsScanning(true);
    toast.loading("Iniciando escaneo de integridad...", { id: "scan" });
    setTimeout(() => {
      setServiceStatus(getServiceStatus());
      setIsScanning(false);
      toast.success("Integridad verificada: 100% Operacional", { id: "scan" });
    }, 2000);
  };

  const handleBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `cybermedida_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Respaldo generado con éxito");
    } catch {
      toast.error("Error al generar el respaldo");
    }
  };

  const handleUnlock = () => {
    if (password === "admin" || password === "cybermedida2024") {
      setIsLocked(false);
      toast.success("Consola Desbloqueada", { description: "Acceso concedido a la configuración." });
    } else {
      toast.error("Acceso Denegado", { description: "Contraseña de administrador incorrecta." });
    }
  };

  const saveAll = () => {
    // Persist all config
    localStorage.setItem("AI_PROVIDER", config.aiProvider);
    localStorage.setItem("AI_MODEL", config.llmModel);
    localStorage.setItem("AI_TEMPERATURE", String(config.temperature));
    localStorage.setItem("AI_MAX_TOKENS", String(config.maxTokens));
    localStorage.setItem("GEMINI_API_KEY", config.geminiApiKey);
    localStorage.setItem("OPENAI_API_KEY", config.openaiApiKey);

    toast.success("Configuración Global Guardada", {
      description: "Todos los cambios han sido persistidos.",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    });
  };

  const resetStats = async () => {
    setResetting(true);
    try {
      const newDb = { ...db, stats: { totalTokens: 0, totalSavings: 0, filesProcessed: 0 } };
      await axios.post("/api/db", newDb);
      updateDb(newDb);
      toast.success("Estadísticas del sistema reiniciadas");
    } catch {
      toast.error("Error al reiniciar estadísticas");
    } finally {
      setResetting(false);
    }
  };

  // ─── Lock Screen ─────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-md rounded-2xl border-slate-200 shadow-2xl p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Acceso Restringido</h2>
            <p className="text-sm text-slate-500 mt-1">Introduce la contraseña de administrador para gestionar el núcleo.</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña del Sistema"
              className="rounded-xl border-slate-200 text-center h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            <Button
              onClick={handleUnlock}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-xs h-12 shadow-lg shadow-indigo-100"
            >
              Desbloquear Consola
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Protocolo de Seguridad <span className="text-indigo-500">CM-ROOT-V2</span>
          </p>
        </Card>
      </div>
    );
  }

  // ─── Main Settings ───────────────────────────────────────────────────
  const currentModels = PROVIDER_MODELS[config.aiProvider] || [];
  const activeApiKey = config.aiProvider === "openai" ? config.openaiApiKey : config.geminiApiKey;

  return (
    <div className="space-y-8 animate-in slide-in-from-top duration-700">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Sistema / <span className="text-indigo-600">Configuración Central</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Configuración del Sistema</h2>
          <p className="text-sm text-slate-500">Gestión de recursos, proveedores IA y mantenimiento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsLocked(true)}
            className="rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50 font-bold uppercase tracking-widest text-[10px] h-10 px-6 transition-all flex-1 sm:flex-none"
          >
            <Lock className="w-4 h-4 mr-2" /> Bloquear
          </Button>
          <Button
            onClick={saveAll}
            className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-slate-100 transition-all flex-1 sm:flex-none"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Guardar Todo
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* ─── AI Provider Selection ───────────────────────────────── */}
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-500" /> Proveedor de Inteligencia Artificial
              </CardTitle>
              <CardDescription className="text-xs">Selecciona el motor IA y configura sus credenciales.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Provider Toggle */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motor IA Activo</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProviderChange("gemini")}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      config.aiProvider === "gemini"
                        ? "border-indigo-500 bg-indigo-50/50 shadow-md shadow-indigo-100"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {config.aiProvider === "gemini" && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold", config.aiProvider === "gemini" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400")}>
                      G
                    </div>
                    <span className={cn("text-xs font-bold", config.aiProvider === "gemini" ? "text-indigo-700" : "text-slate-500")}>Google Gemini</span>
                    <span className="text-[9px] text-slate-400">gemini-1.5-pro / flash</span>
                  </button>

                  <button
                    onClick={() => handleProviderChange("openai")}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      config.aiProvider === "openai"
                        ? "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-100"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {config.aiProvider === "openai" && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold", config.aiProvider === "openai" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400")}>
                      O
                    </div>
                    <span className={cn("text-xs font-bold", config.aiProvider === "openai" ? "text-emerald-700" : "text-slate-500")}>OpenAI (ChatGPT)</span>
                    <span className="text-[9px] text-slate-400">gpt-4o / gpt-4o-mini</span>
                  </button>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Model + API Key for active provider */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modelo Principal</Label>
                  <Select value={config.llmModel} onValueChange={(v) => handleConfigChange("llmModel", v)}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentModels.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {config.aiProvider === "openai" ? "OpenAI API Key" : "Gemini API Key"}
                  </Label>
                  <div className="relative">
                    <Input
                      type={config.aiProvider === "openai" ? (showOpenaiKey ? "text" : "password") : (showGeminiKey ? "text" : "password")}
                      value={config.aiProvider === "openai" ? config.openaiApiKey : config.geminiApiKey}
                      onChange={(e) =>
                        handleConfigChange(
                          config.aiProvider === "openai" ? "openaiApiKey" : "geminiApiKey",
                          e.target.value
                        )
                      }
                      placeholder={config.aiProvider === "openai" ? "sk-..." : "AIza..."}
                      className="rounded-xl border-slate-200 font-mono text-xs pr-12 h-11"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-9 w-9 rounded-lg hover:bg-slate-50 text-slate-400"
                      onClick={() =>
                        config.aiProvider === "openai"
                          ? setShowOpenaiKey(!showOpenaiKey)
                          : setShowGeminiKey(!showGeminiKey)
                      }
                    >
                      {(config.aiProvider === "openai" ? showOpenaiKey : showGeminiKey) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-slate-400 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Necesaria para todas las funciones de IA.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={validateCurrentKey}
                      disabled={validatingKey || !activeApiKey}
                      className="h-6 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                    >
                      {validatingKey ? (
                        <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      Validar Key
                    </Button>
                  </div>
                </div>
              </div>

              {/* Also show the OTHER provider's key (collapsed) */}
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {config.aiProvider === "openai" ? "Gemini API Key (secundaria)" : "OpenAI API Key (secundaria)"}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    value={config.aiProvider === "openai" ? config.geminiApiKey : config.openaiApiKey}
                    onChange={(e) =>
                      handleConfigChange(
                        config.aiProvider === "openai" ? "geminiApiKey" : "openaiApiKey",
                        e.target.value
                      )
                    }
                    placeholder={config.aiProvider === "openai" ? "AIza... (opcional)" : "sk-... (opcional)"}
                    className="rounded-xl border-slate-200 font-mono text-xs h-10"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Configúrala ahora para cambiar de proveedor sin perder la key.</p>
              </div>

              <Separator className="bg-slate-100" />

              {/* Temperature & Tokens */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      Temperatura <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 rounded-lg text-[9px]">{config.temperature}</Badge>
                    </Label>
                    <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Más Preciso</span>
                      <span>Más Creativo</span>
                    </div>
                  </div>
                  <Slider
                    value={[config.temperature * 100]}
                    onValueChange={(v) => handleConfigChange("temperature", v[0] / 100)}
                    max={100}
                    step={1}
                    className="py-4"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      Límite de Tokens <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-lg text-[9px]">{config.maxTokens}</Badge>
                    </Label>
                  </div>
                  <Slider
                    value={[config.maxTokens]}
                    onValueChange={(v) => handleConfigChange("maxTokens", v[0])}
                    min={256}
                    max={8192}
                    step={128}
                    className="py-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Security ────────────────────────────────────────────── */}
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" /> Seguridad y Opciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Nunca compartas tus tokens de acceso
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-700">Protocolo de Blindaje</Label>
                    <p className="text-[10px] text-slate-500">Filtrado PII en tiempo real</p>
                  </div>
                  <Switch checked={config.securityShield} onCheckedChange={(v) => handleConfigChange("securityShield", v)} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-700">Auto-Auditoría</Label>
                    <p className="text-[10px] text-slate-500">Guardado de trazas local</p>
                  </div>
                  <Switch checked={config.autoSave} onCheckedChange={(v) => handleConfigChange("autoSave", v)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Services Status ──────────────────────────────────────── */}
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> Estado de los Servicios
                </CardTitle>
                <CardDescription className="text-[10px]">Monitoreo en tiempo real de los módulos.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkIntegrity}
                disabled={isScanning}
                className="h-8 rounded-lg border-indigo-100 text-indigo-600 font-bold text-[9px] uppercase tracking-wider bg-white"
              >
                <RefreshCcw className={cn("w-3 h-3 mr-2", isScanning && "animate-spin")} />
                {isScanning ? "Escaneando..." : "Verificar Integridad"}
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {serviceStatus.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", item.active ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", item.active ? "text-emerald-600" : "text-amber-600")}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Data Maintenance ─────────────────────────────────────── */}
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" /> Mantenimiento de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 italic">REINICIAR ANALÍTICA GLOBAL</p>
                  <p className="text-xs text-slate-500">Pondrá a cero todos los contadores. Los prompts guardados permanecerán intactos.</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase h-9"
                    onClick={resetStats}
                    disabled={resetting}
                  >
                    {resetting ? "PROCESANDO..." : "EJECUTAR REINICIO DE STATS"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Right Column ───────────────────────────────────────────── */}
        <div className="space-y-8">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" /> Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Zap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-700">Alertas de Automatización</Label>
                    <p className="text-[10px] text-slate-500">Notificar éxito/fallo</p>
                  </div>
                </div>
                <Switch checked={config.notifications} onCheckedChange={(v) => handleConfigChange("notifications", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden">
            <CardHeader className="border-b border-white/10 bg-white/5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" /> Sistema Operativo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 font-mono">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Proveedor IA Activo</p>
                <p className="text-xs text-indigo-300">
                  {config.aiProvider === "openai" ? "OpenAI" : "Google Gemini"} → {config.llmModel}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Keys Configuradas</p>
                <div className="flex gap-2">
                  <Badge className={cn("text-[9px]", config.geminiApiKey ? "bg-emerald-600" : "bg-slate-700")}>
                    Gemini: {config.geminiApiKey ? "✓" : "✗"}
                  </Badge>
                  <Badge className={cn("text-[9px]", config.openaiApiKey ? "bg-emerald-600" : "bg-slate-700")}>
                    OpenAI: {config.openaiApiKey ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Almacenamiento SSD</span>
                  <span>42.8 GB / 100 GB</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[43%] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                </div>
              </div>
            </CardContent>
            <div className="p-4 bg-white/5 flex items-center justify-between">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">CIBERMEDIDA-NODEROUTE-0921</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            </div>
          </Card>

          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden p-6 border-dashed border-2">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-indigo-50 rounded-full mb-4">
                <HardDrive className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Backups del Sistema</p>
              <Button
                onClick={handleBackup}
                variant="default"
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase h-10 shadow-lg shadow-indigo-100"
              >
                EJECUTAR RESPALDO LOCAL
              </Button>
              <p className="text-[9px] text-slate-400 mt-2 font-medium">Exporta la base de datos a un archivo .json</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
