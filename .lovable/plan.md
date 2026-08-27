# Conversions API do Meta (eventos pelo servidor)

Objetivo: além do Pixel no navegador, enviar os mesmos eventos pelo servidor, usando o mesmo `event_id` que o site já gera — assim o Meta reconhece como o mesmo evento (deduplicação) e o rastreio fica muito mais confiável.

## 1. Nova função de servidor `meta-capi`

Recebe um evento do site e repassa para a Graph API v21.0 do Meta (`/{META_DATASET_ID}/events`).

- Segredos usados: `META_CAPI_TOKEN`, `META_DATASET_ID` e o opcional `META_TEST_EVENT_CODE`. Faltando token ou dataset, responde `200 {skipped:"not_configured"}` — rastreio nunca quebra a navegação.
- CORS liberado, trata `OPTIONS`.
- Aceita apenas: PageView, ViewContent, Search, Contact, InitiateCheckout, Lead, AddToWishlist, Purchase. Outro nome → 400. Sem `event_id` → 400.
- Hash SHA-256 (hex minúsculo) em `em, ph, fn, ln, ct, st, zp, country`, normalizando antes (minúsculo, sem acento, sem espaço extra; e-mail sem espaços; telefone só dígitos com DDI 55 quando vier com 10/11 dígitos; CEP só dígitos; country nos 2 primeiros caracteres). Valor que já é hash (64 hex) passa direto.
- `fbc`, `fbp` e `external_id` vão em texto puro (o Meta exige assim).
- `client_ip_address` vem de `x-forwarded-for` (primeiro da lista, fallback `cf-connecting-ip` / `x-real-ip`) e `client_user_agent` do header `user-agent` da própria requisição.
- `test_event_code` só entra no payload quando o segredo existir.
- Erro da Graph API ou exceção: registra no log e responde 200 (nunca 500).

## 2. Ajuste em `src/lib/tracking.ts`

- Nova `sendToCapi(event, params, eventId, identity?)` chamando `supabase.functions.invoke("meta-capi")` com `event_name`, `event_id`, `event_time` (epoch em segundos), `event_source_url` (`window.location.href`), `action_source: "website"`.
  - `user_data`: `fbc` e `fbp` de `readClickIds()`, `external_id = getSessionId()`, `ct: "rio verde"`, `st: "go"`, `country: "br"`, mais o spread de `identity` (e-mail/telefone quando houver).
  - `custom_data`: os `params` do pixel.
  - Tudo em try/catch silencioso.
- `trackPixel` ganha um 4º parâmetro opcional `identity?: { em?: string; ph?: string }` e, logo após o `fbq("track", ...)`, chama `void sendToCapi(event, params, id, identity)`.
- `trackConversion`, `trackEvent`, `createLead` e `buildTrackingCode` ficam iguais.

## 3. Segredos

`META_CAPI_TOKEN` e `META_DATASET_ID` ainda não existem no projeto (só `META_PIXEL_ID`). Vou abrir o formulário seguro para você colar:

- `META_CAPI_TOKEN` — token gerado no Gerenciador de Eventos → dataset Site Thiago → Conversions API.
- `META_DATASET_ID` — `999629776164879`.
- `META_TEST_EVENT_CODE` — código da aba "Eventos de teste" (opcional; remover após validar).

Sem esses segredos o código já fica pronto e inerte (nada quebra); assim que forem preenchidos, os eventos começam a sair pelo servidor.

## 4. Validação

Com a aba "Eventos de teste" aberta, navegar pelo site: cada evento deve aparecer duas vezes (Navegador + Servidor) marcado como deduplicado. Depois é só remover o `META_TEST_EVENT_CODE`.

## Detalhes técnicos

Arquivos: novo `supabase/functions/meta-capi/index.ts` (CORS via `npm:@supabase/supabase-js@2/cors`, `verify_jwt` já é `false` por padrão) e `src/lib/tracking.ts`. Nenhuma alteração de banco.
