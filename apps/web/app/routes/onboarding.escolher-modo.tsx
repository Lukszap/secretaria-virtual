import { useNavigate } from "@remix-run/react";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";

const MODE_KEY = "onboarding_mode";

export default function EscolherModo() {
  const navigate = useNavigate();

  const selectMode = (mode: "form" | "chat") => {
    localStorage.setItem(MODE_KEY, mode);
    if (mode === "chat") {
      navigate("/onboarding/chat");
    } else {
      navigate("/onboarding");
    }
  };

  const currentMode = typeof window !== "undefined" ? localStorage.getItem(MODE_KEY) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-stone-800 mb-3">
            Escolher Modo
          </h1>
          <p className="text-lg text-stone-600">
            Como você prefere configurar seu sistema?
          </p>
          {currentMode && (
            <p className="text-sm text-stone-500 mt-2">
              Modo atual: <span className="font-medium text-terracotta-600">{currentMode === "chat" ? "Chat" : "Formulário"}</span>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              currentMode === "form" ? "ring-2 ring-terracotta-500 bg-terracotta-50" : ""
            }`}
            onClick={() => selectMode("form")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-terracotta-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-display font-semibold text-stone-800 mb-2">
                Modo Formulário
              </h3>
              <p className="text-stone-600">
                Prefiro preencher por etapas de forma organizada
              </p>
              {currentMode === "form" && (
                <span className="inline-block mt-3 px-3 py-1 bg-terracotta-500 text-white text-xs rounded-full">
                  Selecionado
                </span>
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              currentMode === "chat" ? "ring-2 ring-sage-500 bg-sage-50" : ""
            }`}
            onClick={() => selectMode("chat")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-display font-semibold text-stone-800 mb-2">
                Modo Chat
              </h3>
              <p className="text-stone-600">
                Prefiro conversar com a assistente virtual
              </p>
              {currentMode === "chat" && (
                <span className="inline-block mt-3 px-3 py-1 bg-sage-500 text-white text-xs rounded-full">
                  Selecionado
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
