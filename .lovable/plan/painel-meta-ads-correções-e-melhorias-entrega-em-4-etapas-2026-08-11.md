# Painel Meta Ads — correções e melhorias (entrega em 4 etapas)

Tudo em português simples, com ícones de ajuda explicando cada métrica. Catálogo (catalog-feed), cadastro de veículos e Kanban continuam funcionando.

## Etapa 1 — Correções críticas (números errados hoje)

**Clique ≠ Lead.** Hoje um clique no WhatsApp cria evento `whatsapp_click`, evento `lead` e um registro na tabela de leads ao mesmo tempo — por isso os dois cards mostram sempre o mesmo número e o CPL é calculado em cima de cliques.
- O clique passa a disparar só `whatsapp_click` + Pixel `Contact`.
- O registro é criado com status novo **aguardando_contato** e fica **fora do Kanban**, numa aba separada "Cliques (aguardando contato)" dentro de /admin/leads. De lá você promove para "Novo" com um botão, ou o registro vira lead automaticamente ao ganhar nome/telefone.
- CPL, funil, ROAS e conversão passam a usar apenas leads confirmados.

**Período do sync do Meta.** A função lê `days` da query string, mas o painel envia no corpo — por isso 7d/14d/30d sempre puxavam 30 dias. Passa a ler do corpo, com fallback.

**Pixel configurável.** O ID está fixo no HTML. Vai para Configurações (`meta_pixel_id` + `meta_dataset_id`) e é inicializado dinamicamente, com o ID atual como padrão.

**ROAS real.** Receita = soma de `sale_value` dos leads vendidos no período; ROAS = receita ÷ gasto; mostra a taxa de fechamento real. O modo estimado (8%) fica só como fallback, rotulado como estimativa.

**Higiene.** `.env` no `.gitignore`; banner fixo de erro no topo do Analytics quando o sync falhar; indicador "última sincronização em …".

## Etapa 2 — Rastrear leads que vão direto pro WhatsApp

- Campos `origin_code` e `origin_type` (site / whatsapp_direto / organico / manual) nos leads.
- Mensagem do WhatsApp no site já sai com código automático no fim: `[SITE-HRV21-CATALOGO]` (ou `-ORG` sem UTM), e o mesmo código é salvo no registro.
- Campo rápido "Código de origem" em cada card do Kanban, com classificação automática do tipo.
- Tabela `campaign_codes` + tela **/admin/codigos** para cadastrar os códigos usados nos anúncios (ex.: HRV-WA01 → nome da campanha). O Analytics usa essa tabela para atribuir os leads de WhatsApp direto à campanha certa e calcular o CPL deles.

## Etapa 3 — Analytics e Dashboard

- Gráfico de **gasto por dia** ao lado do gráfico de views/leads.
- **Comparação com o período anterior** nos cards principais (verde = melhora; no CPL, queda é melhora).
- **Conjuntos e anúncios**: novas tabelas `meta_adsets` e `meta_ads`, sync com `level=adset` e `level=ad`, e tabela expansível campanha → conjunto → anúncio com gasto/CPL de cada.
- **Métricas novas** no sync: frequency, ctr, cpm, cpc e `actions` (JSONB) — inclui conversas iniciadas no WhatsApp pelo próprio Meta. Alerta de **fadiga de criativo** (frequência > 3 e CTR caindo).
- **Semáforo de ação sugerida** por campanha (🟢 escalar / 🟡 observar / 🔴 revisar / ⚪ aprendizado) com o motivo em texto ao passar o mouse.
- **Leads por origem** (site, WhatsApp direto, orgânico) com CPL separado por origem paga.
- Cards renomeados para "Cliques no WhatsApp" e "Leads confirmados"; texto de ajuda atualizado (sai a frase "devem ser iguais").
- **Dashboard**: bloco de performance dos últimos 7 dias (gasto, leads confirmados, CPL médio, veículo com mais interesse, campanha com melhor CPL, alerta se alguma estiver 🔴) acima dos cards de estoque.

## Etapa 4 — CAPI (Conversions API)

A CAPI tinha sido removida a seu pedido e o secret `META_CAPI_ACCESS_TOKEN` não existe mais. Vamos refazer com o token novo:
- Você me envia o token novo (peço pelo formulário seguro) e confirma o Dataset ID.
- Nova função `meta-capi` enviando ViewContent, Contact e Lead para o dataset, com `event_id` compartilhado com o Pixel (deduplicação), `action_source: website`, `event_source_url`, e `user_data` com fbc, fbp, user agent e IP.
- Dados pessoais (telefone/e-mail) com hash SHA-256 antes do envio.
- Tabela `capi_logs` para diagnóstico, com tela/erro visível se o token voltar a ser bloqueado.

## Detalhes técnicos

Migrations previstas: `lead_status` ganha `aguardando_contato`; `leads` ganha `origin_code` e `origin_type`; `store_settings` ganha `meta_pixel_id` e `meta_dataset_id`; novas tabelas `campaign_codes`, `meta_adsets`, `meta_ads`, `capi_logs` (todas com GRANTs e RLS restrita a admin). Arquivos principais: `WhatsAppButton.tsx`, `lib/tracking.ts`, `pages/admin/Leads.tsx`, `pages/admin/Analytics.tsx`, `pages/admin/Dashboard.tsx`, `pages/admin/StoreSettings.tsx`, `components/admin/analytics/*`, `supabase/functions/meta-ads-sync/index.ts`, novo `supabase/functions/meta-capi/index.ts`, `index.html`, `main.tsx`, `.gitignore`.

Aprovando, começo pela Etapa 1.
