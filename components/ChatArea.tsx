"use client";

import { useState, useRef, useEffect } from "react";
import { Conversation, Message, Model } from "@/types";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import ModelSelector from "./ModelSelector";

interface ChatAreaProps {
  conversation: Conversation | undefined;
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
  onNewConversation: () => void;
}

export default function ChatArea({
  conversation,
  onUpdateConversation,
  onNewConversation,
}: ChatAreaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!conversation) return;

    const updatedMessages = conversation.messages.map((msg) =>
      msg.id === messageId ? { ...msg, content: newContent } : msg
    );

    onUpdateConversation(conversation.id, {
      messages: updatedMessages,
    });
  };

  const handleModelChange = (model: Model) => {
    if (!conversation) return;
    onUpdateConversation(conversation.id, { model });
  };

  const handleSendMessage = async (content: string) => {
    if (!conversation || !content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    // Add user message immediately
    const updatedMessages = [...conversation.messages, userMessage];
    const selectedModel = conversation.model || "grok-4-fast";
    
    onUpdateConversation(conversation.id, {
      messages: updatedMessages,
      title:
        conversation.messages.length === 0
          ? content.slice(0, 50)
          : conversation.title,
    });

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let hasReceivedContent = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.content) {
                  hasReceivedContent = true;
                  assistantContent += parsed.content;
                  // Update message in real-time
                  const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: assistantContent,
                    createdAt: new Date().toISOString(),
                  };
                  onUpdateConversation(conversation.id, {
                    messages: [...updatedMessages, assistantMessage],
                  });
                }
              } catch (e: any) {
                if (e.message && e.message.includes("error")) {
                  throw e;
                }
                // Ignore JSON parse errors for empty lines
              }
            }
          }
        }

        // If we didn't receive any content, something went wrong
        if (!hasReceivedContent && assistantContent === "") {
          throw new Error("No response received from the API");
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message || "Unknown error"}. Please check your API token and try again.`,
        createdAt: new Date().toISOString(),
      };
      onUpdateConversation(conversation.id, {
        messages: [...updatedMessages, errorMessage],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">ChatGPT Clone</h1>
          <p className="text-gray-400 mb-8">
            Start a new conversation to begin chatting
          </p>
          <button
            onClick={onNewConversation}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            New Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => {
              // Trigger custom event for sidebar toggle
              window.dispatchEvent(new CustomEvent('toggleSidebar'));
            }}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-lg font-semibold truncate">{conversation.title}</h2>
        </div>
        <ModelSelector
          selectedModel={conversation.model || "grok-4-fast"}
          onModelChange={handleModelChange}
        />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">Start a conversation</p>
              <p className="text-sm">Type a message below to begin chatting</p>
            </div>
          </div>
        ) : (
          <>
            {conversation.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onEdit={handleEditMessage}
              />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
