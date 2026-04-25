import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DB } from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Coins, 
  Files, 
  PiggyBank, 
  TrendingUp, 
  Activity,
  Zap,
  Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  db: DB;
}

const data = [
  { name: "Mon", tokens: 2400, savings: 1.2 },
  { name: "Tue", tokens: 1398, savings: 0.8 },
  { name: "Wed", tokens: 9800, savings: 4.5 },
  { name: "Thu", tokens: 3908, savings: 2.1 },
  { name: "Fri", tokens: 4800, savings: 2.4 },
  { name: "Sat", tokens: 3800, savings: 1.9 },
  { name: "Sun", tokens: 4300, savings: 2.2 },
];

export function Dashboard({ db }: DashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Proyectos / <span className="text-indigo-600">CyberMedida WebApp v2.1</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Vista General</h2>
          <p className="text-sm text-slate-500">Rendimiento global del sistema y asignación de recursos.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Tokens Generados", value: db.stats.totalTokens.toLocaleString(), icon: Coins, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Ahorro Estimado", value: `$${db.stats.totalSavings.toFixed(2)}`, icon: PiggyBank, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Archivos Procesados", value: db.stats.filesProcessed, icon: Files, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Salud del Sistema", value: "98.2%", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-xl border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5% vs ÚLTIMO PERIODO</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> Intensidad de Asignación de Recursos
            </CardTitle>
            <CardDescription className="text-xs">Tendencias de consumo de tokens en módulos activos (7 días)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} 
                  />
                  <Area type="monotone" dataKey="tokens" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              Registro de Actividad
              <button className="text-[10px] text-indigo-600 hover:underline">VER TODO</button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[
                { type: "CONVERSION", msg: "File 'invoice_01.pdf' converted", time: "2m ago", icon: Files, color: "text-amber-500" },
                { type: "GENERATION", msg: "Advanced Prompt for Project X", time: "15m ago", icon: Zap, color: "text-indigo-500" },
                { type: "AUTOMATION", msg: "New Python script saved", time: "1h ago", icon: Terminal, color: "text-emerald-500" },
                { type: "SYSTEM", msg: "Token limit adjusted to +15.0k", time: "3h ago", icon: Activity, color: "text-slate-400" },
                { type: "CONVERSION", msg: "Doc 'meeting_notes.docx' ready", time: "5h ago", icon: Files, color: "text-amber-500" },
              ].map((log, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors cursor-default group">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <log.icon className={cn("w-3 h-3", log.color)} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{log.time}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{log.msg}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
