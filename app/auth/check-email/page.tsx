import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Conta criada com sucesso!</CardTitle>
            <CardDescription>Verifique seu email</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enviamos um email de confirmação. Por favor, verifique sua caixa de entrada e clique no link para ativar
              sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
