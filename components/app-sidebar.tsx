"use client"
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  Layers,
  LogOut,
  ChevronDown,
  FileBarChart,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { WorkspaceSelector } from "@/components/workspace-selector"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Conversas",
    href: "/conversas",
    icon: MessageSquare,
  },
  {
    title: "Análises",
    href: "/analises",
    icon: FileText,
  },
  {
    title: "Diagnósticos",
    href: "/diagnosticos",
    icon: FileBarChart,
  },
  {
    title: "Modelos de Avaliação",
    href: "/modelos",
    icon: Layers,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
]

export function AppSidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const { open } = useSidebar()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const userInitials = user?.user_metadata?.nome
    ? user.user_metadata.nome
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U"

  const isPaulo = user?.email === "paulo.henrique@v4company.com"

  const filteredNavItems = isPaulo
    ? [
        ...navItems.slice(0, 5),
        {
          title: "Logs de Acesso",
          href: "/logs",
          icon: Shield,
        },
        ...navItems.slice(5),
      ]
    : navItems

  return (
    <Sidebar>
      <SidebarHeader>
        <WorkspaceSelector />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  {open && (
                    <>
                      <span className="flex-1 text-left truncate">{user?.user_metadata?.nome || user?.email}</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
