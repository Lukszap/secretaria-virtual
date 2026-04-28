import {
  USE_MOCK,
  mockApi,
  type Tenant,
  type Configuracoes,
} from "./mock";

const API_BASE = "http://localhost:8787"; // URL do Worker local

// Helper para fazer requests
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function criarTenant(dados: {
  nome: string;
  configuracoes: Configuracoes;
  whatsapp_phone_number_id?: string;
  whatsapp_dono: string;
}): Promise<Tenant> {
  if (USE_MOCK) return mockApi.criarTenant(dados);
  return fetchApi("/api/tenant", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function atualizarConfiguracoes(
  tenantId: string,
  dados: Partial<Configuracoes>
): Promise<{ success: boolean; configuracoes: Configuracoes }> {
  if (USE_MOCK) return mockApi.atualizarConfiguracoes(tenantId, dados);
  return fetchApi(`/api/tenant/configuracoes`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export async function atualizarWhatsappDono(
  tenantId: string,
  whatsapp: string
): Promise<{ whatsapp_dono: string }> {
  if (USE_MOCK) return mockApi.atualizarWhatsappDono(tenantId, whatsapp);
  return fetchApi(`/api/tenant/whatsapp-dono`, {
    method: "PUT",
    body: JSON.stringify({ whatsapp_dono: whatsapp }),
  });
}

export async function obterTenant(tenantId: string): Promise<Tenant> {
  if (USE_MOCK) return mockApi.obterTenant(tenantId);
  return fetchApi(`/api/tenant/${tenantId}`);
}
