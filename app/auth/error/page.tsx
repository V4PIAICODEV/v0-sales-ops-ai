import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Desculpe, algo deu errado.</CardTitle>
          </CardHeader>
          <CardContent>
            {params?.error ? (
              <p className="text-sm text-muted-foreground">Código do erro: {params.error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Ocorreu um erro não especificado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
