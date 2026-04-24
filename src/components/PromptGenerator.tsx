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
import { GoogleGenAI } from "@google/genai";
import { toast } from "sonner";

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
      toast.error("Please enter a topic for the prompt");
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Act as an expert prompt engineer. 
      Generate a highly effective system prompt based on:
      - MISSION: ${topic}
      - AUDIENCE: ${audience || "General"}
      - FORMAT: ${format}
      - STYLE: ${style}
      - DETAIL: ${detail}
      
      Return ONLY the optimized prompt content, no conversational filler.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const result = response.text || "Generation failure";
      setGeneratedPrompt(result);
      
      const newDb = { ...db };
      newDb.stats.totalTokens += result.length / 4;
      updateDb(newDb);
      
      toast.success("Prompt engineered successfully");
    } catch (error) {
      console.error(error);
      toast.error("AI Node connection error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to vault");
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
    toast.success("Artifact stored in Lab");
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Laboratory / <span className="text-indigo-600">Prompt Engineering Node</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Advanced Prompt Lab</h2>
        <p className="text-sm text-slate-500">Configure parameters to generate high-precision AI directives.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" /> Parameter Matrix
            </CardTitle>
            <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase"
                onClick={() => { setTopic(""); setAudience(""); setGeneratedPrompt(""); }}
              >
                <RefreshCcw className="w-3 h-3 mr-2" /> Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 flex-1">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mission Objective</Label>
              <Textarea 
                placeholder="Describe the desired AI behavior or task..." 
                className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24 text-sm"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Audience</Label>
                <Input 
                  placeholder="e.g. Data Scientists" 
                  className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output Signature</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="text">PLAIN TEXT</SelectItem>
                    <SelectItem value="json">JSON SCHEMA</SelectItem>
                    <SelectItem value="steps">PROCEDURAL STEPS</SelectItem>
                    <SelectItem value="markdown">MARKDOWN TABLES</SelectItem>
                    <SelectItem value="python">PYTHON LOGIC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Writing Archetype</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="professional">PROFESSIONAL</SelectItem>
                    <SelectItem value="creative">CREATIVE</SelectItem>
                    <SelectItem value="technical">TECHNICAL</SelectItem>
                    <SelectItem value="minimal">MINIMALIST</SelectItem>
                    <SelectItem value="academic">ACADEMIC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Density Level</Label>
                <Select value={detail} onValueChange={setDetail}>
                  <SelectTrigger className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="brief">CONCISE</SelectItem>
                    <SelectItem value="medium">BALANCED</SelectItem>
                    <SelectItem value="extensive">COMPREHENSIVE</SelectItem>
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
              {loading ? "Constructing directive..." : "Engineering Prompt"}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col relative">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" /> Compiled Output
            </CardTitle>
            {generatedPrompt && (
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">Logic Validated</span>
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
                    <Save className="w-4 h-4 mr-2" /> Stash in Hub
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 font-bold uppercase text-xs h-12 transition-colors shadow-lg shadow-slate-200"
                    onClick={generatePrompt}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" /> Re-construct
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl m-2">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Terminal className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Parameter Injection...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
