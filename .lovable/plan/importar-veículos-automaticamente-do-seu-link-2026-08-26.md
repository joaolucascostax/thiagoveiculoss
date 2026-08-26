# Importar veículos automaticamente do seu link

Objetivo: o estoque do site passa a ser alimentado pelo CSV que você atualiza diariamente, sem digitar veículo por veículo.

O arquivo foi verificado: 173 veículos, com título, descrição, preço, ano, km, cor, câmbio, combustível, tipo de carroceria e até 20 fotos por veículo.

## Como vai funcionar

- Uma rotina no backend baixa o link, lê cada veículo e grava/atualiza no estoque do site.
- Cada veículo do feed é identificado pelo código dele (ex: 1001342). Se já existir, é atualizado (preço, km, fotos, descrição). Se for novo, é criado.
- Veículos importados que saírem do feed (vendidos) são desativados automaticamente — não aparecem mais no site, mas o histórico e os leads ligados a eles são preservados.
- Veículos cadastrados manualmente no painel não são tocados pela importação.
- Roda automaticamente 1x por dia (07:00 de Brasília) e também sob demanda.

## No painel admin

Na tela de Veículos, um botão "Importar do feed" com:
- resultado da última importação (criados, atualizados, desativados, erros);
- data/hora da última sincronização.

## Detalhes técnicos

1. Migração no banco:
   - `vehicles.external_id text unique` (código do veículo no feed) e `vehicles.source text default 'manual'` (`manual` | `feed`);
   - `feed_imports`: tabela de log com `started_at`, `finished_at`, `created_count`, `updated_count`, `deactivated_count`, `error` — leitura só para admin, escrita pela função (service role);
   - GRANTs para `authenticated`/`service_role` conforme as políticas.

2. Edge function `vehicles-feed-sync`:
   - baixa o CSV do link (parser de CSV com suporte a campos entre aspas e vírgulas internas);
   - mapeia colunas → tabela `vehicles`: `make`→`brand`, `trim`/`model`→`model`, `year`, `price` (número, tirando " BRL"), `mileage.value`→`mileage` ("88.594 KM"), `transmission`→AUTOMÁTICO/MANUAL, `fuel_type`→GASOLINA/FLEX/DIESEL/HÍBRIDO/ELÉTRICO, `exterior_color`→`color`, `description`, `image[0..19].url`→`images` (na ordem, sem vazios), `state_of_vehicle`→`is_new`;
   - upsert por `external_id`, `source='feed'`, `is_active=true`; desativa os `source='feed'` ausentes no feed;
   - grava o log em `feed_imports`;
   - protegida por `verify_jwt` para o botão do admin e pelo segredo de cron para a execução agendada (mesmo padrão de `meta-ads-sync`).

3. Agendamento diário via cron chamando a função.

4. Frontend: hook `useFeedSync` + botão e status na tela de Veículos do admin. Nenhuma mudança no visual do site público.
