import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="flex justify-center">
          <div className="p-6 bg-white rounded-full">
            <MessageSquare className="w-20 h-20 text-black" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white text-balance">Sales Ops AI</h1>
          <p className="text-xl text-gray-400 text-pretty">Bem-vindo à plataforma de automação de vendas</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/setup">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 h-12 px-8 text-base font-semibold">
              Configurar WhatsApp
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 text-pretty">
          Configure seu workspace e conecte o WhatsApp em poucos passos
        </p>
      </div>
    </div>
  )
}
