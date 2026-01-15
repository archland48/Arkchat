"use client";

import { Model } from "@/types";

interface ModelSelectorProps {
  selectedModel: Model;
  onModelChange: (model: Model) => void;
}

const models: { value: Model; label: string; description: string }[] = [
  {
    value: "grok-4-fast",
    label: "Grok-4-Fast",
    description: "Fast and efficient responses",
  },
  {
    value: "supermind-agent-v1",
    label: "Supermind Agent v1",
    description: "Multi-tool agent with web search",
  },
];

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="text-sm text-gray-400 whitespace-nowrap">Model:</label>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as Model)}
        className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-gray-600 hover:bg-gray-750 transition-colors"
      >
        {models.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
      <span className="hidden sm:inline text-xs text-gray-500">
        {models.find((m) => m.value === selectedModel)?.description}
      </span>
    </div>
  );
}
