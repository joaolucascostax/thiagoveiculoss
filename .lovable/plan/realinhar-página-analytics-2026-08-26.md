# Realinhar página Analytics

## Objetivo
Deixar a Analytics enxuta e útil: focar no funil de conversão, veículos mais procurados e custo por lead do Meta Ads. Remover seções que não fazem sentido para o canal atual (apenas Meta Ads).

## Mudanças no conteúdo

### Remover seções dispensáveis
- Remover `DeviceBreakdown` (Mobile/Desktop/Tablet) — o usuário não vê valor nesses dados.
- Remover `ChannelBreakdown` (Canais de Aquisição) — só existe Meta Ads no momento, então a comparação entre canais não serve.
- Remover `MetaAdBreakdown` (Desempenho por Conjunto/Anúncio) — usuário não quer acompanhar esse nível de detalhe.
- Remover `UtmBreakdownTable` (Detalhe por UTM) — não é útil para o dia a dia dele.

### Seções mantidas
- Cards de estatísticas principais: Views, Cliques WhatsApp, Leads confirmados, Taxa de Conversão.
- Gráfico Views/Leads (evolução no período).
- Funil de Conversão — manter, mas **melhorar o UX**.
- ROAS (real ou estimado) — mantém, pois liga gasto Meta a resultado financeiro.
- Alertas de CPL (só aparecem quando há campanha fora da meta).
- Top 10 Veículos — mantém e reforça como seção de destaque.
- Custo por Lead (Meta Ads) — mantém a tabela resumida por campanha com meta de CPL.

### Melhorias no Funil de Conversão
- Redesenhar visualmente: etapas verticais com ícones, cores de progresso e taxa de perda mais legível.
- Deixar claro o fluxo: Visita → Ficha do veículo → Clique no WhatsApp → Lead confirmado.
- Adicionar porcentagem de conversão entre etapas de forma destacada.

### Ajustes no HelpBanner
- Remover explicações sobre Canais de Aquisição, UTM e dispositivos.
- Reforçar como Meta Ads, Views, Cliques e Leads funcionam.
- Manter aviso sobre `utm_campaign={{campaign.name}}` para o CPL bater.

### Ajustes gerais da página
- Atualizar `exportCsv` para não incluir mais linhas de UTM.
- Manter botão de sincronização do Meta e seletor de período.
- Garantir que a página continue responsiva com menos colunas duplas.

## Arquivos envolvidos
- `src/pages/admin/Analytics.tsx`
- `src/components/admin/analytics/FunnelCard.tsx`
- `src/components/admin/analytics/HelpBanner.tsx` (ou o componente inline na Analytics)
