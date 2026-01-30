"use client";

import { useState } from "react";

interface BibleStudyPanelProps {
  onSelectQuery: (query: string) => void;
}

export default function BibleStudyPanel({ onSelectQuery }: BibleStudyPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = {
    "verse": {
      title: "經文查詢",
      icon: "📖",
      items: [
        { label: "約翰福音 3:16", query: "約翰福音 3:16" },
        { label: "羅馬書 8:28", query: "羅馬書 8:28" },
        { label: "詩篇 23:1", query: "詩篇 23:1" },
        { label: "以賽亞書 53:5", query: "以賽亞書 53:5" },
      ],
    },
    "chapter": {
      title: "章節閱讀",
      icon: "📚",
      items: [
        { label: "創世記 1", query: "創世記 1" },
        { label: "約翰福音 1", query: "約翰福音 1" },
        { label: "羅馬書 8", query: "羅馬書 8" },
        { label: "詩篇 23", query: "詩篇 23" },
      ],
    },
    "topic": {
      title: "主題研究",
      icon: "🔍",
      items: [
        { label: "愛", query: "愛" },
        { label: "信心", query: "信心" },
        { label: "救恩", query: "救恩" },
        { label: "恩典", query: "恩典" },
        { label: "平安", query: "平安" },
        { label: "希望", query: "希望" },
      ],
    },
    "advanced": {
      title: "進階功能",
      icon: "⭐",
      items: [
        { label: "交叉引用分析", query: "約翰福音 3:16 的交叉引用" },
        { label: "四福音對照", query: "比較四福音中關於登山寶訓的記載" },
        { label: "人物研究", query: "研究保羅的生平和教導" },
        { label: "版本比較", query: "比較約翰福音 3:16 的不同譯本" },
        { label: "原文字詞研究", query: "研究希臘文的「愛」字" },
      ],
    },
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-100">Bible Study</h2>
          <p className="text-gray-400 text-sm">選擇一個功能開始您的聖經研讀</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(categories).map(([key, category]) => (
            <div
              key={key}
              className={`
                bg-gray-800 rounded-lg p-4 cursor-pointer transition-all
                ${selectedCategory === key ? "ring-2 ring-blue-500" : "hover:bg-gray-750"}
              `}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="font-semibold text-gray-200">{category.title}</h3>
              </div>
              
              {selectedCategory === key && (
                <div className="mt-3 space-y-2">
                  {category.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuery(item.query);
                      }}
                      className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-3 text-gray-200">💡 使用提示</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• 輸入經文引用（如：約翰福音 3:16）進行深入研讀</li>
            <li>• 輸入主題關鍵字（如：愛、信心）進行主題研究</li>
            <li>• 使用「交叉引用」關鍵字進行多層次引用分析</li>
            <li>• 使用「版本比較」比較不同聖經譯本</li>
            <li>• 使用「人物研究」研究聖經人物</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
