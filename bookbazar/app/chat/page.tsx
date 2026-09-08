"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-50 h-14 w-14 rounded-full bg-indigo-600 text-white text-2xl shadow-xl hover:bg-indigo-700"
      >
        💬
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex h-[min(70dvh,500px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:h-125 sm:w-95">

          {/* Header */}
          <div className="flex items-center justify-between border-b bg-indigo-600 px-4 py-3 text-white">
            <h2 className="font-semibold">BookMandu AI</h2>

            <button
              onClick={() => setOpen(false)}
              className="text-xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {messages.length === 0 && (
              <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
                👋 Hi! Ask me about books, authors, prices, or recommendations.
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.parts
                    .map((part) =>
                      part.type === "text" ? part.text : ""
                    )
                    .join("")}
                </div>
              </div>
            ))}

            {status === "streaming" && (
              <div className="rounded-xl bg-slate-100 p-3 text-sm">
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (!input.trim()) return;

              sendMessage({
                text: input,
              });

              setInput("");
            }}
            className="border-t p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about books..."
              disabled={status !== "ready"}
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-indigo-500"
            />
          </form>
        </div>
      )}
    </>
  );
}