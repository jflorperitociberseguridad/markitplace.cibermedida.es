import { useState } from "react";
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
  Zap
} from "lucide-react";
import { DB, SavedPrompt } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AutomationHubProps {
  db: DB;
  updateDb: (db: DB) => void;
}

export function AutomationHub({ db, updateDb }: AutomationHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

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
      toast.success(prompt.isFavorite ? "Artifact starred" : "Artifact unstarred");
    }
  };

  const deletePrompt = (id: string) => {
    const newDb = { ...db, prompts: db.prompts.filter(p => p.id !== id) };
    updateDb(newDb);
    toast.success("Script purged from Hub");
  };

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to local machine");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-700">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Repository / <span className="text-indigo-600">Automation Vault</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Automation Hub</h2>
            <p className="text-sm text-slate-500">Centralized storage for validated scripts and AI orchestration logic.</p>
          </div>
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-indigo-100 transition-all">
            <Plus className="w-4 h-4 mr-2" /> New Script
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Search className="w-3.5 h-3.5" /> Intelligence Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Input 
                  placeholder="Scan repository..." 
                  className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 text-xs pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-300" />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classification</label>
                <div className="flex flex-wrap gap-1.5">
                  <Badge 
                    variant={filter === null ? "default" : "outline"}
                    className={cn("rounded-lg text-[10px] font-bold cursor-pointer transition-all", 
                      filter === null ? "bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                    onClick={() => setFilter(null)}
                  >
                    ALL ASSETS
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

          <Card className="rounded-xl border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden p-6 relative">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Module Status</p>
              <h3 className="text-xl font-extrabold tracking-tight italic">ENCRYPTED VAULT</h3>
              <div className="mt-8 flex justify-between items-end border-t border-white/10 pt-4">
                <div className="text-3xl font-bold leading-none">{automations.length}</div>
                <div className="text-[9px] font-bold text-white/40 tracking-widest">ACTIVE SCRIPTS</div>
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
                        <Copy className="w-3.5 h-3.5 mr-2" /> Sync Local
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
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No intelligence assets found in cache</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
