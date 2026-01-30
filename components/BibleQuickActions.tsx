"use client";

import { useState } from "react";

interface BibleQuickActionsProps {
  onSelect: (query: string) => void;
}

const QUICK_QUERIES = [
  { label: "約翰福音 3:16", query: "約翰福音 3:16" },
  { label: "馬太福音 5:3-10", query: "馬太福音 5:3-10" },
  { label: "創世記 1", query: "創世記 1" },
  { label: "搜尋：愛", query: "search for 愛" },
  { label: "搜尋：信心", query: "search for 信心" },
];

export default function BibleQuickActions({ onSelect }: BibleQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-sm text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        快速查經
      </button>
    );
  }

  return (
    <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">快速查經</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_QUERIES.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              onSelect(item.query);
              setIsExpanded(false);
            }}
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-gray-200"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
