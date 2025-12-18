"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface AccessLog {
  id: string
  id_user: string
  timestamp: string
  evento: string
  sucesso: boolean
  erro: string | null
  user_agent: string | null
  ip_address: string | null
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [userEmails, setUserEmails] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthorizationAndFetchLogs()
  }, [])

  async function checkAuthorizationAndFetchLogs() {
    const supabase = createClient()

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        router.push("/dashboard")
        return
      }

      if (userData.user.email !== "paulo.henrique@v4company.com") {
        router.push("/dashboard")
        return
      }

      setIsAuthorized(true)

      const { data, error } = await supabase
        .from("log_acesso")
        .select("id, id_user, timestamp, evento, sucesso, erro, user_agent, ip_address")
        .order("timestamp", { ascending: false })
        .limit(100)

      if (error) throw error

      const userIds = [...new Set(data?.map((log) => log.id_user) || [])]
      const { data: users } = await supabase.auth.admin.listUsers()

      const emailMap: Record<string, string> = {}
      users?.users.forEach((user) => {
        emailMap[user.id] = user.email || "Desconhecido"
      })

      setUserEmails(emailMap)
      setLogs(data || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function getEventoBadge(evento: string, sucesso: boolean) {
    if (!sucesso) {
      return <Badge variant="destructive">Falha</Badge>
    }

    const variants: Record<string, "default" | "secondary" | "outline"> = {
      login: "default",
      logout: "secondary",
      session_refresh: "outline",
    }

    return <Badge variant={variants[evento] || "default"}>{evento}</Badge>
  }

  function getBrowserInfo(userAgent: string | null) {
    if (!userAgent) return "Desconhecido"

    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Outro"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Logs de Acesso</CardTitle>
          <CardDescription>Visualize todos os acessos ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Navegador</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">{userEmails[log.id_user] || "Desconhecido"}</TableCell>
                      <TableCell>{getEventoBadge(log.evento, log.sucesso)}</TableCell>
                      <TableCell>
                        {log.sucesso ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500">
                            Sucesso
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500">
                            Falha
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getBrowserInfo(log.user_agent)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {log.erro || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
