import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { SYSTEM_PROMPT } from "~/lib/chat-onboarding";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { messages }: { messages: ChatMessage[] } = await request.json();

  // Get API key from environment
  const apiKey = (context as unknown as Record<string, Record<string, string>>).env?.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Check if response contains completion JSON
    const jsonMatch = content.match(/\{[\s\S]*"completo"\s*:\s*true[\s\S]*\}/);
    let completo = false;
    let dados = null;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.completo === true) {
          completo = true;
          dados = parsed.dados;
        }
      } catch {
        // Invalid JSON, treat as regular message
      }
    }

    // Remove JSON from message if present
    let message = content;
    if (jsonMatch) {
      message = content.replace(jsonMatch[0], "").trim();
    }

    return new Response(
      JSON.stringify({
        message,
        completo,
        dados,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
