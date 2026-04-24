export interface PromptVariable {
  name: string;
  value: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  type: 'basic' | 'advanced' | 'automation';
  variables?: PromptVariable[];
  tags: string[];
  category: string;
  isFavorite: boolean;
  createdAt: number;
}

export interface AppStats {
  totalTokens: number;
  totalSavings: number;
  filesProcessed: number;
}

export interface DB {
  prompts: SavedPrompt[];
  automations: SavedPrompt[];
  stats: AppStats;
}
