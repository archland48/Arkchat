"use client";

import { useState, useRef, KeyboardEvent } from "react";
import BibleQuickActions from "./BibleQuickActions";

interface ChatInputProps {
  onSendMessage: (message: string, bibleModeEnabled: boolean) => void;
  disabled?: boolean;
  bibleModeEnabled?: boolean;
  onBibleModeToggle?: (enabled: boolean) => void;
}

export default function ChatInput({ 
  onSendMessage, 
  disabled, 
  bibleModeEnabled = false,
  onBibleModeToggle 
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [justComposed, setJustComposed] = useState(false);
  const [enterAfterComposition, setEnterAfterComposition] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input, bibleModeEnabled);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleBibleToggle = () => {
    if (onBibleModeToggle) {
      onBibleModeToggle(!bibleModeEnabled);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter 或 Cmd+Enter 发送消息
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
      setJustComposed(false);
      setEnterAfterComposition(false);
      return;
    }
    
    // 如果正在使用中文输入法（IME），Enter 键用于确认输入
    if (e.key === "Enter" && isComposing) {
      // 让输入法处理 Enter 键（确认输入）
      return;
    }
    
    // 如果刚刚完成中文输入确认，第一个 Enter 键用于发送消息（像 Cursor 一样）
    if (e.key === "Enter" && justComposed && !enterAfterComposition) {
      e.preventDefault();
      setEnterAfterComposition(true);
      // 发送消息
      if (input.trim() && !disabled) {
        handleSubmit();
      }
      setJustComposed(false);
      return;
    }
    
    // 如果已经按过一次 Enter（在确认输入后），第二次 Enter 允许换行
    if (e.key === "Enter" && enterAfterComposition) {
      // 允许换行（不阻止默认行为）
      setEnterAfterComposition(false);
      return;
    }
    
    // 普通 Enter 键：如果输入框为空或只有空白，发送消息；否则换行
    if (e.key === "Enter" && !isComposing && !justComposed) {
      // 如果输入为空或只有空白，发送消息
      if (!input.trim()) {
        e.preventDefault();
        handleSubmit();
        return;
      }
      // 否则允许换行（不阻止默认行为）
    }
  };

  // 处理中文输入法（IME）的 composition 事件
  const handleCompositionStart = () => {
    setIsComposing(true);
    setJustComposed(false);
    setEnterAfterComposition(false);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    // 标记刚刚完成输入，下一个 Enter 键将发送消息（像 Cursor 一样）
    setJustComposed(true);
    setEnterAfterComposition(false);
    // 300ms 后清除标记，避免永久影响
    setTimeout(() => {
      setJustComposed(false);
      setEnterAfterComposition(false);
    }, 300);
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
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="輸入訊息或查詢聖經經文（例如：約翰福音 3:16）..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent px-4 py-3 text-gray-100 placeholder-gray-500 resize-none focus:outline-none max-h-[200px] overflow-y-auto"
            style={{ minHeight: "24px" }}
          />
          {/* Bible Mode Toggle Button */}
          <button
            onClick={handleBibleToggle}
            disabled={disabled}
            className={`m-2 p-2 rounded-lg transition-colors ${
              bibleModeEnabled
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={bibleModeEnabled ? "Bible Mode 已啟用 - 點擊關閉" : "Bible Mode 已關閉 - 點擊啟用"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </button>
          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="m-2 p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            title="發送訊息 (Ctrl+Enter 或 Cmd+Enter)"
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
          {bibleModeEnabled ? (
            <span className="text-blue-400">📖 Bible Mode 已啟用 - 將自動查詢聖經資源</span>
          ) : (
            "Bible Study Assistant - 支援經文查詢、章節閱讀、關鍵字搜尋 | Enter 換行，Ctrl+Enter 或點擊按鈕發送"
          )}
        </p>
      </div>
    </div>
  );
}
