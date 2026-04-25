// Returns the active AI provider config from localStorage
export function getAIConfig() {
  const provider = localStorage.getItem("AI_PROVIDER") || "gemini";
  const model = localStorage.getItem("AI_MODEL") || (provider === "openai" ? "gpt-4o" : "gemini-1.5-pro");
  const apiKey = provider === "openai"
    ? localStorage.getItem("OPENAI_API_KEY") || ""
    : localStorage.getItem("GEMINI_API_KEY") || "";

  return { provider, model, apiKey };
}
