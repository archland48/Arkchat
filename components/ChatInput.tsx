"use client";

import { useState, useRef, KeyboardEvent } from "react";
import BibleQuickActions from "./BibleQuickActions";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter 或 Cmd+Enter 发送消息
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    // 普通 Enter 键允许换行（不发送）
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleQuickSelect = (query: string) => {
    setInput(query);
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <BibleQuickActions onSelect={handleQuickSelect} />
        <div className="flex items-end gap-2 bg-gray-800 rounded-lg border border-gray-700 focus-within:border-gray-600 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息或查詢聖經經文（例如：約翰福音 3:16）..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent px-4 py-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none max-h-[200px] overflow-y-auto"
            style={{ minHeight: "24px" }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="m-2 p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Bible Study Assistant - 支援經文查詢、章節閱讀、關鍵字搜尋 | Enter 換行，Ctrl+Enter 或點擊按鈕發送
        </p>
      </div>
    </div>
  );
}
