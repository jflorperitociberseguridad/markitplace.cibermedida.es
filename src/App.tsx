/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { PromptGenerator } from "./components/PromptGenerator";
import { AutomationHub } from "./components/AutomationHub";
import { MarkdownDownloader } from "./components/MarkdownDownloader";
import { Toaster } from "@/components/ui/sonner";
import { DB } from "./types";
import axios from "axios";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [db, setDb] = useState<DB | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch DB on mount
  useEffect(() => {
    const fetchDb = async () => {
      try {
        const res = await axios.get("/api/db");
        setDb(res.data);
      } catch (err) {
        console.error("Failed to fetch DB:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDb();
  }, []);

  const updateDb = async (newDb: DB) => {
    setDb(newDb);
    try {
      await axios.post("/api/db", newDb);
    } catch (err) {
      console.error("Failed to save DB:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing PromptCore...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-auto relative">
        <div className="p-10 max-w-7xl mx-auto">
          {activeTab === "dashboard" && <Dashboard db={db!} />}
          {activeTab === "prompts" && <PromptGenerator db={db!} updateDb={updateDb} />}
          {activeTab === "automation" && <AutomationHub db={db!} updateDb={updateDb} />}
          {activeTab === "markdown" && <MarkdownDownloader db={db!} updateDb={updateDb} />}
        </div>
      </main>
      
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

