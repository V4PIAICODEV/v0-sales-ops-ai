-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  foto text,
  role text default 'user',
  created_at timestamp default now()
);

-- Create workspace table
create table if not exists workspace (
  id uuid primary key default gen_random_uuid(),
  id_user uuid references auth.users(id) on delete cascade,
  nome text not null,
  created_at timestamp default now()
);

-- Create instancia table
create table if not exists instancia (
  id uuid primary key default gen_random_uuid(),
  id_workspace uuid references workspace(id) on delete cascade,
  nome text not null,
  numero text,
  status text default 'desconectado',
  sync_mode text check (sync_mode in ('historico','novas')) default 'novas',
  sync_status text check (sync_status in ('pendente','sincronizando','ativo','erro')) default 'pendente',
  token_evolution text,
  connected_at timestamp,
  created_at timestamp default now()
);

-- Create cliente table
create table if not exists cliente (
  id uuid primary key default gen_random_uuid(),
  nome text,
  telefone text unique,
  created_at timestamp default now()
);

-- Create conversa table
create table if not exists conversa (
  id uuid primary key default gen_random_uuid(),
  id_instancia uuid references instancia(id) on delete cascade,
  id_cliente uuid references cliente(id) on delete cascade,
  started_at timestamp,
  ended_at timestamp
);

-- Create mensagem table
create table if not exists mensagem (
  id uuid primary key default gen_random_uuid(),
  id_conversa uuid references conversa(id) on delete cascade,
  autor text check (autor in ('vendedor','cliente')),
  conteudo text,
  timestamp timestamp default now()
);

-- Create analise table
create table if not exists analise (
  id uuid primary key default gen_random_uuid(),
  id_conversa uuid references conversa(id) on delete cascade,
  score numeric,
  tempo_resposta_inicial interval,
  tempo_resposta_medio interval,
  qtd_followups int,
  tonalidade text,
  resumo text,
  created_at timestamp default now()
);

-- Create modelo_avaliacao table
create table if not exists modelo_avaliacao (
  id uuid primary key default gen_random_uuid(),
  id_workspace uuid references workspace(id) on delete cascade,
  nome text default 'Modelo Padrão',
  descricao text,
  ativo boolean default true,
  versao int default 1,
  created_at timestamp default now()
);

-- Create categoria table
create table if not exists categoria (
  id uuid primary key default gen_random_uuid(),
  id_modelo uuid references modelo_avaliacao(id) on delete cascade,
  nome text,
  peso numeric,
  ordem int,
  descricao text
);

-- Create criterio table
create table if not exists criterio (
  id uuid primary key default gen_random_uuid(),
  id_categoria uuid references categoria(id) on delete cascade,
  titulo text,
  descricao text,
  peso_relativo numeric,
  pontuacao_max numeric,
  ordem int,
  exemplo text,
  created_at timestamp default now()
);

-- Create avaliacao table
create table if not exists avaliacao (
  id uuid primary key default gen_random_uuid(),
  id_analise uuid references analise(id) on delete cascade,
  id_modelo uuid references modelo_avaliacao(id) on delete set null,
  resultado jsonb,
  score_final numeric,
  created_at timestamp default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table workspace enable row level security;
alter table instancia enable row level security;
alter table cliente enable row level security;
alter table conversa enable row level security;
alter table mensagem enable row level security;
alter table analise enable row level security;
alter table modelo_avaliacao enable row level security;
alter table categoria enable row level security;
alter table criterio enable row level security;
alter table avaliacao enable row level security;

-- RLS Policies for profiles
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- RLS Policies for workspace
create policy "workspace_owner" on workspace
  for all using (auth.uid() = id_user);

-- RLS Policies for instancia
create policy "instancia_by_workspace" on instancia
  for all using (
    id_workspace in (select id from workspace where id_user = auth.uid())
  );

-- RLS Policies for cliente (accessible by workspace owner)
create policy "cliente_by_workspace" on cliente
  for all using (
    exists (
      select 1 from conversa c
      join instancia i on i.id = c.id_instancia
      join workspace w on w.id = i.id_workspace
      where c.id_cliente = cliente.id and w.id_user = auth.uid()
    )
  );

-- RLS Policies for conversa
create policy "conversa_by_workspace" on conversa
  for all using (
    id_instancia in (
      select i.id from instancia i
      join workspace w on w.id = i.id_workspace
      where w.id_user = auth.uid()
    )
  );

-- RLS Policies for mensagem
create policy "mensagem_by_workspace" on mensagem
  for all using (
    id_conversa in (
      select c.id from conversa c
      join instancia i on i.id = c.id_instancia
      join workspace w on w.id = i.id_workspace
      where w.id_user = auth.uid()
    )
  );

-- RLS Policies for analise
create policy "analise_by_workspace" on analise
  for all using (
    id_conversa in (
      select c.id from conversa c
      join instancia i on i.id = c.id_instancia
      join workspace w on w.id = i.id_workspace
      where w.id_user = auth.uid()
    )
  );

-- RLS Policies for modelo_avaliacao
create policy "modelo_by_workspace" on modelo_avaliacao
  for all using (
    id_workspace in (select id from workspace where id_user = auth.uid())
  );

-- RLS Policies for categoria
create policy "categoria_by_workspace" on categoria
  for all using (
    id_modelo in (
      select m.id from modelo_avaliacao m
      join workspace w on w.id = m.id_workspace
      where w.id_user = auth.uid()
    )
  );

-- RLS Policies for criterio
create policy "criterio_by_workspace" on criterio
  for all using (
    id_categoria in (
      select cat.id from categoria cat
      join modelo_avaliacao m on m.id = cat.id_modelo
      join workspace w on w.id = m.id_workspace
      where w.id_user = auth.uid()
    )
  );

-- RLS Policies for avaliacao
create policy "avaliacao_by_workspace" on avaliacao
  for all using (
    id_analise in (
      select a.id from analise a
      join conversa c on c.id = a.id_conversa
      join instancia i on i.id = c.id_instancia
      join workspace w on w.id = i.id_workspace
      where w.id_user = auth.uid()
    )
  );
