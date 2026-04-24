import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
  HardDrive
} from "lucide-react";
import { DB } from "../types";
import { toast } from "sonner";
import axios from "axios";

interface SettingsProps {
  db: DB;
  updateDb: (db: DB) => void;
}

export function Settings({ db, updateDb }: SettingsProps) {
  const [resetting, setResetting] = React.useState(false);

  const resetStats = async () => {
    setResetting(true);
    try {
      const newDb = {
        ...db,
        stats: {
          totalTokens: 0,
          totalSavings: 0,
          filesProcessed: 0
        },
        logs: []
      };
      await axios.post("/api/db", newDb);
      updateDb(newDb);
      toast.success("Estadísticas del sistema reiniciadas");
    } catch (error) {
      toast.error("Error al reiniciar estadísticas");
    } finally {
      setResetting(false);
    }
  };

  const statusItems = [
    { name: "Motor MarkItDown", status: "Operational", active: true },
    { name: "IA Prompt Generator", status: "Operational", active: true },
    { name: "Base de Datos Pro", status: "Connected", active: true },
    { name: "API CyberMedida", status: "Degraded", active: false },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-top duration-700">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Sistema / <span className="text-indigo-600">Configuración Central</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Configuración del Sistema</h2>
        <p className="text-sm text-slate-500">Gestión de recursos, seguridad y mantenimiento de nodos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" /> Estado de los Servicios
              </CardTitle>
              <CardDescription className="text-xs">Monitoreo en tiempo real de los módulos de IA y extracción.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {statusItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.active ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></div>
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${item.active ? "text-emerald-600" : "text-amber-600"}`}>
                        {item.status}
                      </span>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white text-slate-400">
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-xs text-slate-500">Esta acción pondrá a cero todos los contadores de tokens, ahorros y archivos procesados en el Dashboard. Los prompts guardados permanecerán intactos.</p>
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

        <div className="space-y-8">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden">
            <CardHeader className="border-b border-white/10 bg-white/5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" /> Sistema Operativo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 font-mono">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Arquitectura</p>
                <p className="text-xs text-indigo-300">PromptCore-v2.Enterprise</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Uptime Global</p>
                <p className="text-xs text-emerald-400">99.98% / 345d 14h</p>
              </div>
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Almacenamiento SSD</span>
                  <span>42.8 GB / 100 GB</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[43%] shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Carga de IA Compute</span>
                  <span>12%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[12%] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
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
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                 <HardDrive className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Backups del Sistema</p>
              <Button variant="outline" className="w-full rounded-lg border-slate-200 text-slate-600 font-bold text-[10px] uppercase h-9">
                PROGRAMAR RESPALDO
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
