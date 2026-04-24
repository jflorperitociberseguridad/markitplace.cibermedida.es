import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Terminal, 
  Zap, 
  FileText, 
  History, 
  Settings,
  ChevronRight,
  Activity
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Panel de Control", icon: LayoutDashboard },
    { id: "prompts", label: "Lab de Prompts", icon: Terminal },
    { id: "automation", label: "Automatizaciones", icon: Zap },
    { id: "markdown", label: "MarkDown Pro", icon: FileText },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-400 flex flex-col h-full flex-shrink-0 z-50 shadow-2xl">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">P</div>
          <h1 className="text-white font-bold tracking-tight text-xl">PromptCore</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all relative group overflow-hidden border border-transparent",
              activeTab === item.id 
                ? "bg-slate-800 text-white shadow-sm" 
                : "hover:bg-slate-800/50 hover:text-slate-200"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-indigo-400" : "text-slate-500")} />
            <span className="font-semibold tracking-tight">{item.label}</span>
            {activeTab === item.id && (
              <ChevronRight className="w-3 h-3 ml-auto text-indigo-400 opacity-50" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">Uso de Tokens</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
            <div className="bg-indigo-500 h-full w-[64%] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
          <p className="text-white text-xs font-medium">124,500 <span className="text-slate-500 font-normal">/ 200k Tokens</span></p>
        </div>
        
        <div className="mt-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-4 h-4" />
            v2.4.0
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="Sistema Online"></div>
        </div>
      </div>
    </div>
  );
}
