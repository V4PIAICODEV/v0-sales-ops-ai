"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Check, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useRouter } from "next/navigation"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

type Criterio = {
  id: string
  titulo: string
  descricao: string
  peso_relativo: number
  pontuacao_max: number
  ordem: number
  exemplo: string | null
}

type Categoria = {
  id: string
  nome: string
  peso: number
  ordem: number
  descricao: string | null
  criterio: Criterio[]
}

type Model = {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  versao: number
  created_at: string
  categoria: Categoria[]
}

export function ModelosManager({
  models,
  workspaceId,
}: {
  models: Model[]
  workspaceId: string
}) {
  const router = useRouter()
  const [isModelDialogOpen, setIsModelDialogOpen] = React.useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false)
  const [isCriteriaDialogOpen, setIsCriteriaDialogOpen] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState<Model | null>(null)
  const [selectedCategory, setSelectedCategory] = React.useState<Categoria | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Form states
  const [modelName, setModelName] = React.useState("")
  const [modelDescription, setModelDescription] = React.useState("")
  const [categoryName, setCategoryName] = React.useState("")
  const [categoryDescription, setCategoryDescription] = React.useState("")
  const [categoryWeight, setCategoryWeight] = React.useState("0.2")
  const [criteriaTitle, setCriteriaTitle] = React.useState("")
  const [criteriaDescription, setCriteriaDescription] = React.useState("")
  const [criteriaWeight, setCriteriaWeight] = React.useState("1")
  const [criteriaExample, setCriteriaExample] = React.useState("")

  const activeModel = models.find((m) => m.ativo)

  const handleCreateModel = async () => {
    if (!modelName.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    // Deactivate all other models
    await supabase.from("modelo_avaliacao").update({ ativo: false }).eq("id_workspace", workspaceId)

    const { error } = await supabase.from("modelo_avaliacao").insert({
      nome: modelName,
      descricao: modelDescription,
      id_workspace: workspaceId,
      ativo: true,
      versao: 1,
    })

    if (!error) {
      setModelName("")
      setModelDescription("")
      setIsModelDialogOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleActivateModel = async (modelId: string) => {
    setIsLoading(true)
    const supabase = createClient()

    // Deactivate all models
    await supabase.from("modelo_avaliacao").update({ ativo: false }).eq("id_workspace", workspaceId)

    // Activate selected model
    await supabase.from("modelo_avaliacao").update({ ativo: true }).eq("id", modelId)

    router.refresh()
    setIsLoading(false)
  }

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm("Tem certeza que deseja excluir este modelo?")) return

    setIsLoading(true)
    const supabase = createClient()

    await supabase.from("modelo_avaliacao").delete().eq("id", modelId)

    router.refresh()
    setIsLoading(false)
  }

  const handleCreateCategory = async () => {
    if (!categoryName.trim() || !selectedModel) return

    setIsLoading(true)
    const supabase = createClient()

    const ordem = selectedModel.categoria.length

    const { error } = await supabase.from("categoria").insert({
      nome: categoryName,
      descricao: categoryDescription,
      peso: Number.parseFloat(categoryWeight),
      ordem,
      id_modelo: selectedModel.id,
    })

    if (!error) {
      setCategoryName("")
      setCategoryDescription("")
      setCategoryWeight("0.2")
      setIsCategoryDialogOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

    setIsLoading(true)
    const supabase = createClient()

    await supabase.from("categoria").delete().eq("id", categoryId)

    router.refresh()
    setIsLoading(false)
  }

  const handleCreateCriteria = async () => {
    if (!criteriaTitle.trim() || !selectedCategory) return

    setIsLoading(true)
    const supabase = createClient()

    const ordem = selectedCategory.criterio.length

    const { error } = await supabase.from("criterio").insert({
      titulo: criteriaTitle,
      descricao: criteriaDescription,
      peso_relativo: Number.parseFloat(criteriaWeight),
      pontuacao_max: 10,
      ordem,
      exemplo: criteriaExample || null,
      id_categoria: selectedCategory.id,
    })

    if (!error) {
      setCriteriaTitle("")
      setCriteriaDescription("")
      setCriteriaWeight("1")
      setCriteriaExample("")
      setIsCriteriaDialogOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDeleteCriteria = async (criteriaId: string) => {
    if (!confirm("Tem certeza que deseja excluir este critério?")) return

    setIsLoading(true)
    const supabase = createClient()

    await supabase.from("criterio").delete().eq("id", criteriaId)

    router.refresh()
    setIsLoading(false)
  }

  const radarData =
    activeModel?.categoria.map((cat) => ({
      category: cat.nome,
      value: cat.peso * 100,
    })) || []

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Models List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Modelos</CardTitle>
              <Button size="sm" onClick={() => setIsModelDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {models.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhum modelo criado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{model.nome}</p>
                        {model.ativo && <Badge variant="default">Ativo</Badge>}
                      </div>
                      {model.descricao && <p className="text-xs text-muted-foreground mt-1">{model.descricao}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{model.categoria.length} categorias</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!model.ativo && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivateModel(model.id)}
                          disabled={isLoading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedModel(model)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteModel(model.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Visualização do Modelo Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ChartContainer
                config={{
                  value: {
                    label: "Peso",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 10,
                      }}
                    />
                    <Radar
                      name="Peso"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhum modelo ativo
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories and Criteria */}
      {selectedModel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Categorias e Critérios - {selectedModel.nome}</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setIsCategoryDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedModel.categoria.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhuma categoria criada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedModel.categoria.map((category) => (
                  <Collapsible key={category.id}>
                    <div className="border rounded-lg">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2 flex-1">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <div className="flex-1">
                            <p className="font-medium">{category.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              Peso: {(category.peso * 100).toFixed(0)}% • {category.criterio.length} critérios
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCategory(category)
                              setIsCriteriaDialogOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-2">
                          {category.criterio.map((criteria) => (
                            <div key={criteria.id} className="flex items-start justify-between p-2 bg-muted rounded-md">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{criteria.titulo}</p>
                                <p className="text-xs text-muted-foreground">{criteria.descricao}</p>
                                {criteria.exemplo && (
                                  <p className="text-xs text-muted-foreground mt-1">Exemplo: {criteria.exemplo}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteCriteria(criteria.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Model Dialog */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Modelo</DialogTitle>
            <DialogDescription>Crie um novo modelo de avaliação para suas conversas</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model-name">Nome do Modelo</Label>
              <Input
                id="model-name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Modelo Padrão"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-description">Descrição</Label>
              <Textarea
                id="model-description"
                value={modelDescription}
                onChange={(e) => setModelDescription(e.target.value)}
                placeholder="Descrição do modelo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateModel} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Categoria</DialogTitle>
            <DialogDescription>Adicione uma categoria ao modelo {selectedModel?.nome}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nome da Categoria</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Atendimento"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea
                id="category-description"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Descrição da categoria..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-weight">Peso (0-1)</Label>
              <Input
                id="category-weight"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={categoryWeight}
                onChange={(e) => setCategoryWeight(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Criteria Dialog */}
      <Dialog open={isCriteriaDialogOpen} onOpenChange={setIsCriteriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Critério</DialogTitle>
            <DialogDescription>Adicione um critério à categoria {selectedCategory?.nome}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="criteria-title">Título do Critério</Label>
              <Input
                id="criteria-title"
                value={criteriaTitle}
                onChange={(e) => setCriteriaTitle(e.target.value)}
                placeholder="Tempo de resposta"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="criteria-description">Descrição</Label>
              <Textarea
                id="criteria-description"
                value={criteriaDescription}
                onChange={(e) => setCriteriaDescription(e.target.value)}
                placeholder="Descrição do critério..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="criteria-weight">Peso Relativo</Label>
              <Input
                id="criteria-weight"
                type="number"
                step="0.1"
                min="0"
                value={criteriaWeight}
                onChange={(e) => setCriteriaWeight(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="criteria-example">Exemplo (opcional)</Label>
              <Textarea
                id="criteria-example"
                value={criteriaExample}
                onChange={(e) => setCriteriaExample(e.target.value)}
                placeholder="Exemplo de aplicação..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCriteriaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCriteria} disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
