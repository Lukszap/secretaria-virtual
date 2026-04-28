# Como testar o painel de onboarding
roda `npm run dev` tanto na web quanto no api
## Modo mock (sem backend)

1. Certifique-se que `USE_MOCK = true` em `app/lib/mock.ts`
2. `cd apps/web && npm run dev`
3. Acesse http://localhost:5173
4. Teste o fluxo completo de onboarding nos dois modos (formulário e chat)
5. Ao final do onboarding, você será redirecionado para /dashboard com dados mock

## Modo real (com backend)

1. Na raiz do projeto: `npm run dev` (sobe o Worker na porta 8787)
2. Em `app/lib/mock.ts`: mude `USE_MOCK = false`
3. `cd apps/web && npm run dev`
4. Certifique-se que o Supabase está configurado no `.dev.vars` do Worker

## Testando o modo chat

1. Adicione `ANTHROPIC_API_KEY=sua_chave` em `apps/web/.env`
2. Converse naturalmente: "Tenho um salão chamado Bella Rosa em São Paulo"
3. Siga o fluxo até o fim — o sistema deve extrair os dados e salvar automaticamente

## Checklist de testes

- [ ] Onboarding formulário: completar os 5 steps
- [ ] Onboarding formulário: fechar na metade e reabrir (deve retomar do mesmo step)
- [ ] Onboarding chat: conversa completa até extração do JSON
- [ ] Complete seu Perfil: editar regras de negócio e salvar
- [ ] Complete seu Perfil: adicionar novo profissional
- [ ] Complete seu Perfil: barra de progresso atualiza ao completar seções
