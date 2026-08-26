import {
  LayoutDashboard,
  Car,
  Settings,
  LogOut,
  BarChart3,
  Users,
  HelpCircle,
  Megaphone,
  Plus,
  Target,
  FileText,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type Item = { title: string; url: string; icon: typeof Car; end?: boolean };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Visão Geral",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Estoque",
    items: [
      { title: "Veículos", url: "/admin/veiculos", icon: Car },
      { title: "Novo veículo", url: "/admin/veiculos/novo", icon: Plus },
      { title: "Config. da loja", url: "/admin/configuracoes", icon: Settings },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      { title: "Públicos Meta", url: "/admin/publicos", icon: Target },
      { title: "Relatórios", url: "/admin/relatorios", icon: FileText },
      { title: "Catálogo WhatsApp", url: "/admin/catalogo", icon: Megaphone },
    ],
  },
  {
    label: "Leads",
    items: [{ title: "Kanban", url: "/admin/leads", icon: Users }],
  },
  {
    label: "Ajuda",
    items: [{ title: "Guia da plataforma", url: "/admin/ajuda", icon: HelpCircle }],
  },
];

export default function AdminSidebar() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-foreground hover:bg-muted"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
