"use client"

import { LayoutDashboard, MessageSquare, BarChart3, Users, Settings, Database } from 'lucide-react'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { WorkspaceSelector } from "./workspace-selector"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Conversas",
    icon: MessageSquare,
    href: "/conversas",
  },
  {
    title: "Análises",
    icon: BarChart3,
    href: "/analises",
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/clientes",
  },
  {
    title: "Modelos",
    icon: Database,
    href: "/modelos",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/configuracoes",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <WorkspaceSelector />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
    </Sidebar>
  )
}
