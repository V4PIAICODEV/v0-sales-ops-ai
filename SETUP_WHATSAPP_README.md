# Setup WhatsApp - Documentação Completa

Este é um projeto standalone para configuração de workspace e conexão WhatsApp via Evolution API.

## 📋 Arquivos Necessários

### 1. Estrutura de Pastas
\`\`\`
projeto-whatsapp-setup/
├── app/
│   ├── api/
│   │   └── whatsapp/
│   │       ├── create-instance/
│   │       │   └── route.ts
│   │       └── check-connection/
│   │           └── route.ts
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
\`\`\`

### 2. Dependências (package.json)
O v0 gerencia automaticamente, mas estas são as principais:
- `next` (Next.js 16)
- `react` e `react-dom`
- `@supabase/supabase-js`
- `lucide-react` (ícones)
- `tailwindcss` (estilos)

### 3. Componentes UI Necessários (shadcn/ui)
Estes já vêm por padrão no v0:
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Input`
- `Button`
- `Label`
- `Alert`, `AlertDescription`

## 🔧 Variáveis de Ambiente

Configure estas variáveis no seu projeto v0 (aba "Vars" no sidebar):

\`\`\`env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Evolution API (obrigatório)
EVOLUTION_API_URL=http://seu-servidor-evolution
EVOLUTION_API_KEY=sua-api-key

# Sistema (obrigatório)
SYSTEM_USER_ID=uuid-do-usuario-sistema
\`\`\`

## 🗄️ Estrutura do Banco de Dados

### Tabela: `workspace`
\`\`\`sql
CREATE TABLE workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  id_user UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### Tabela: `instancia`
\`\`\`sql
CREATE TABLE instancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_workspace UUID NOT NULL REFERENCES workspace(id),
  nome TEXT NOT NULL,
  numero TEXT,
  status TEXT DEFAULT 'aguardando_conexao',
  sync_mode TEXT DEFAULT 'novas',
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## 🚀 Como Usar em um Novo Projeto v0

1. **Crie um novo workspace no v0** chamado "WhatsApp Setup"

2. **Copie os arquivos** na ordem:
   - `app/globals.css`
   - `app/layout.tsx`
   - `app/page.tsx`
   - `app/api/whatsapp/create-instance/route.ts`
   - `app/api/whatsapp/check-connection/route.ts`

3. **Configure as variáveis de ambiente** na aba "Vars"

4. **Configure o Supabase** na aba "Connect"

5. **Publique o projeto**

## 📝 Fluxo de Funcionamento

1. Usuário acessa a página e insere o nome da empresa
2. Sistema cria registro na tabela `workspace`
3. Sistema cria registro na tabela `instancia`
4. Sistema chama webhook que retorna QR Code
5. QR Code é exibido para o usuário escanear
6. Sistema faz polling a cada 3s para verificar se conectou
7. Quando conectado, atualiza status no banco e exibe "WhatsApp Conectado!"

## 🎨 Personalização

### Cores
O projeto usa esquema preto e branco puro. Para alterar, edite `app/globals.css`:
- `--background`: Cor de fundo
- `--foreground`: Cor do texto
- `--primary`: Cor principal dos botões

### Webhook URL
Para alterar o webhook, edite em `app/api/whatsapp/create-instance/route.ts`:
\`\`\`typescript
const webhookResponse = await fetch("SUA_URL_AQUI", {
  // ...
})
\`\`\`

## ⚠️ Observações Importantes

1. O `SYSTEM_USER_ID` deve ser um UUID válido de um usuário no Supabase Auth
2. A Evolution API deve estar rodando e acessível
3. O webhook deve retornar um campo `qrCode` com a imagem em base64
4. As políticas RLS do Supabase são contornadas usando `SUPABASE_SERVICE_ROLE_KEY`

## 🐛 Troubleshooting

### Erro: "QR Code não foi recebido do webhook"
- Verifique se o webhook está retornando o campo `qrCode`
- Verifique os logs no console do navegador

### Erro: "new row violates row-level security policy"
- Certifique-se de estar usando `SUPABASE_SERVICE_ROLE_KEY` nas rotas API
- Verifique se o `SYSTEM_USER_ID` existe na tabela `auth.users`

### "Aguardando conexão..." não detecta quando conecta
- Verifique se o campo `nome` na tabela `instancia` corresponde ao `instanceName`
- Verifique se a Evolution API está retornando `state: "open"` quando conectado
