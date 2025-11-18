"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InstanceOnboardingPage() {
  const router = useRouter()

  const handleSkip = () => {
    router.refresh()
    router.push("/dashboard")
  }

  const handleSetup = () => {
    router.refresh()
    router.push("/configuracoes")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Conecte uma Instância</CardTitle>
            <CardDescription>
              Conecte uma instância do WhatsApp para começar a analisar suas conversas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button onClick={handleSetup} className="w-full">
                Configurar Instância
              </Button>
              <Button onClick={handleSkip} variant="outline" className="w-full">
                Pular por enquanto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
