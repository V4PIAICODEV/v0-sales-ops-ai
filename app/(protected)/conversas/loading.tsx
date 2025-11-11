import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ConversasLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar with conversations list */}
      <div className="w-80 border-r border-border bg-card">
        <div className="border-b border-border p-4">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-1 h-4 w-32" />
        </div>

        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
          ))}
        </div>

        <Card className="m-4">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
