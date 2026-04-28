import React, { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import type { ChatMessage, ChatResponse } from "~/lib/chat-onboarding";
import type { Configuracoes } from "~/lib/mock";
import { gerarSlug, getHorariosPadrao } from "~/lib/utils";

interface ChatOnboardingProps {
  onComplete: (dados: {
    nome: string;
    configuracoes: Configuracoes;
    whatsapp_dono: string;
  }) => void;
  onError: (error: string) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatOnboarding({ onComplete, onError }: ChatOnboardingProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou sua assistente de configuração ✨\n\nVou te ajudar a configurar sua secretaria virtual de forma simples e rápida.\n\nPara começar, qual é o nome do seu salão ou clínica?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "", isLoading: true },
    ]);
    setLoading(true);

    try {
      // Call API route
      const response = await fetch("/api/chat-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.filter((m) => !m.isLoading),
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao comunicar com a IA");
      }

      const data: ChatResponse = await response.json();

      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content: data.message,
        })
      );

      // Check if complete
      if (data.completo && data.dados) {
        setTimeout(() => {
          onComplete({
            nome: data.dados!.nome,
            configuracoes: data.dados!.configuracoes,
            whatsapp_dono: data.dados!.whatsapp_dono,
          });
        }, 1500);
      }
    } catch (error) {
      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content:
            "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?",
        })
      );
      onError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">Assistente Virtual</h3>
            <p className="text-white/80 text-sm">Configuração por chat</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-cream-50 to-white">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-terracotta-500 text-white"
                  : "bg-white border border-stone-200 text-stone-800 shadow-sm"
              }`}
            >
              {msg.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 p-4 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-terracotta-500 resize-none"
            rows={2}
            disabled={loading}
          />
          <Button
            variant="primary"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="self-end"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Pressione Enter para enviar • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
