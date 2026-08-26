import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  BarChart3,
  Users,
  Megaphone,
  Settings,
  Zap,
  MessageCircle,
  Target,
} from "lucide-react";

const sections = [
  {
    id: "estoque",
    icon: Car,
    title: "Estoque de veículos",
    what: "Onde você cadastra e gerencia todos os carros que a loja tem à venda.",
    how: [
      "Vá em Estoque → Veículos para ver a lista completa.",
      "Clique em Novo veículo para cadastrar. Use o Smart Fill (IA) colando um anúncio pronto — ela preenche marca, modelo, ano e preço sozinha.",
      "Adicione fotos arrastando na área de upload. A primeira imagem é a capa.",
      "Arraste os cards na lista para reordenar como aparecem no site.",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics (Marketing)",
    what: "Painel de performance: quem visitou, de onde veio, quantos leads geraram, quanto custou cada lead.",
    how: [
      "Funil: visitantes → visualizações de veículo → cliques no WhatsApp → leads.",
      "ROAS e CPL: retorno sobre investimento e custo por lead das campanhas Meta.",
      "Top veículos: os carros mais vistos e que mais geraram contato.",
      "UTM breakdown: quais campanhas/fontes trouxeram os melhores leads.",
      "Alertas de CPL: você define uma meta por campanha e o sistema avisa se o custo estourar.",
    ],
  },
  {
    id: "leads",
    icon: Users,
    title: "Kanban de Leads",
    what: "Gestão visual de todos os interessados. Cada card é um contato via WhatsApp.",
    how: [
      "Novo: acabou de clicar no WhatsApp.",
      "Qualificado: você conversou e o interesse é real.",
      "Vendido: fechou a venda — informe o valor. O Meta recebe evento Purchase e passa a otimizar por vendas (não só cliques).",
      "Perdido: descartado. Ajuda a IA aprender o que NÃO é lead bom.",
      "Arraste os cards entre colunas. Cada mudança dispara os eventos certos automaticamente.",
    ],
  },
  {
    id: "pixel",
    icon: Zap,
    title: "Meta Pixel",
    what: "Rastreamento no navegador (ViewContent, Lead, Contact) para o Facebook/Instagram Ads.",
    how: [
      "Pixel já configurado no site — dispara automaticamente.",
      "Valide os eventos no Events Manager do Meta.",
    ],
  },
  {
    id: "campanhas",
    icon: Megaphone,
    title: "Campanhas Meta",
    what: "Sincronização automática de gasto, impressões, cliques e alcance das suas campanhas de tráfego pago.",
    how: [
      "Configure os secrets META_AD_ACCOUNT_ID (formato act_XXX) e META_CAPI_ACCESS_TOKEN com escopo ads_read.",
      "Defina metas de CPL por campanha na tela de Analytics.",
      "O sistema sincroniza dados diários e cruza com seus leads para calcular ROAS real.",
    ],
  },
  {
    id: "whatsapp",
    icon: MessageCircle,
    title: "WhatsApp",
    what: "Botão flutuante e cards do site que abrem conversa pré-preenchida com o carro de interesse.",
    how: [
      "Configure o número em Estoque → Config. da loja.",
      "Toda vez que alguém clica, criamos automaticamente um Lead no Kanban com os dados de rastreamento (UTM, fbc, fbp).",
      "Mensagem pré-preenchida com marca/modelo/ano/preço.",
    ],
  },
  {
    id: "config",
    icon: Settings,
    title: "Configurações da loja",
    what: "Nome, endereço, telefone, WhatsApp, horários e demais dados que aparecem no site público.",
    how: [
      "Alterou? Salvo imediatamente e refletido no site em segundos.",
      "Imagens de logo/hero também gerenciadas aqui.",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Guia da plataforma</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O que cada área faz, pra que serve e como usar.
        </p>
      </div>

      <Card className="p-5 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Primeiros passos</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Cadastre seus veículos em <strong>Estoque</strong>.</li>
              <li>Configure WhatsApp e dados da loja em <strong>Config. da loja</strong>.</li>
              <li>Valide o Pixel no <strong>Events Manager do Meta</strong>.</li>
              <li>Acompanhe leads no <strong>Kanban</strong> e mova para <em>Vendido</em> quando fechar.</li>
              <li>Analise performance em <strong>Analytics</strong> e ajuste campanhas.</li>
            </ol>
          </div>
        </div>
      </Card>

      <Accordion type="single" collapsible className="space-y-2">
        {sections.map((s) => (
          <AccordionItem key={s.id} value={s.id} className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="font-semibold">{s.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pl-8">
                <div>
                  <Badge variant="secondary" className="mb-1">O que é</Badge>
                  <p className="text-sm text-muted-foreground">{s.what}</p>
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1">Como usar</Badge>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {s.how.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
