-- Function to create default evaluation model for a workspace
create or replace function create_default_evaluation_model(workspace_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  model_id uuid;
  cat1_id uuid;
  cat2_id uuid;
  cat3_id uuid;
  cat4_id uuid;
  cat5_id uuid;
begin
  -- Create the default model
  insert into modelo_avaliacao (id_workspace, nome, descricao, ativo, versao)
  values (
    workspace_id,
    'Modelo Padrão de Vendas',
    'Modelo completo para avaliação de conversas de vendas via WhatsApp',
    true,
    1
  )
  returning id into model_id;

  -- Category 1: Conexão e Rapport (1/10)
  insert into categoria (id_modelo, nome, peso, ordem, descricao)
  values (
    model_id,
    'Conexão e Rapport',
    1.0,
    1,
    'Facilitar a abertura. É a "chave da porta". Rápido, humano e profissional.'
  )
  returning id into cat1_id;

  insert into criterio (id_categoria, titulo, descricao, peso_relativo, pontuacao_max, ordem, exemplo)
  values (
    cat1_id,
    'Saudação Humana e Validação',
    'O vendedor usou o nome do cliente E validou o interesse inicial?',
    1.0,
    1.0,
    1,
    'Olá, [Nome]! Vi que você se interessou pelo [Produto]. Estou aqui para te ajudar a entender como ele resolve [Problema Comum].'
  );

  -- Category 2: Diagnóstico e Descoberta (3/10)
  insert into categoria (id_modelo, nome, peso, ordem, descricao)
  values (
    model_id,
    'Diagnóstico e Descoberta',
    3.0,
    2,
    'Coletar "munição" (a dor e o cenário) e obter o "sim" inicial para a solução, antes mesmo de falar dela.'
  )
  returning id into cat2_id;

  insert into criterio (id_categoria, titulo, descricao, peso_relativo, pontuacao_max, ordem, exemplo)
  values
  (
    cat2_id,
    'Pergunta de Abertura Consultiva (O Problema)',
    'O vendedor fez uma pergunta aberta focada no objetivo ou problema?',
    0.5,
    3.0,
    1,
    'O que te trouxe a buscar uma solução como a nossa hoje? ou Qual o principal desafio que você espera resolver?'
  ),
  (
    cat2_id,
    'Qualificação Sutil (Cenário/Potencial de Compra)',
    'O vendedor fez uma pergunta sutil para entender o cenário e potencial do cliente?',
    1.0,
    3.0,
    2,
    'Apenas para entender a sua rotina e direcionar as próximas perguntas, qual sua área de atuação hoje e (se B2B) qual o porte da sua empresa?'
  ),
  (
    cat2_id,
    'Aprofundamento (O Impacto)',
    'O vendedor investigou o impacto do problema dentro do cenário?',
    0.5,
    3.0,
    3,
    'Entendido. E hoje, como esse desafio [problema citado] afeta [o seu negócio/sua rotina]?'
  ),
  (
    cat2_id,
    'Resumo com Fechamento de Teste (Trial Close)',
    'O vendedor conectou a dor ao resultado esperado e pediu permissão para avançar, ganhando o primeiro "sim"?',
    1.0,
    3.0,
    4,
    'Ok, [Nome]. Com base no que você me falou sobre [citar problema], eu vejo que tem total aderência com o que nossa solução pode gerar de [citar resultado]. Faz sentido para você se eu te mostrar a proposta para seguirmos com um plano?'
  );

  -- Category 3: Oferta Personalizada (2/10)
  insert into categoria (id_modelo, nome, peso, ordem, descricao)
  values (
    model_id,
    'Oferta Personalizada',
    2.0,
    3,
    'Conectar a solução diretamente ao diagnóstico. O cliente deve pensar: "Isso foi feito para mim".'
  )
  returning id into cat3_id;

  insert into criterio (id_categoria, titulo, descricao, peso_relativo, pontuacao_max, ordem, exemplo)
  values
  (
    cat3_id,
    'Conexão Direta Dor-Solução',
    'A oferta foi apresentada usando as palavras e o contexto do cliente?',
    1.0,
    2.0,
    1,
    'Como você disse que precisa de [resultado], esta é a parte da solução que entrega exatamente isso...'
  ),
  (
    cat3_id,
    'Foco no Benefício/Valor (WIIFM)',
    'O vendedor comunicou o resultado que o cliente terá, em vez de apenas listar características técnicas?',
    1.0,
    2.0,
    2,
    'What''s In It For Me - foco no benefício para o cliente'
  );

  -- Category 4: Clareza e Didática (1/10)
  insert into categoria (id_modelo, nome, peso, ordem, descricao)
  values (
    model_id,
    'Clareza e Didática (O Formato)',
    1.0,
    4,
    'Garantir que a mensagem seja lida e compreendida instantaneamente. É o "veículo" da oferta.'
  )
  returning id into cat4_id;

  insert into criterio (id_categoria, titulo, descricao, peso_relativo, pontuacao_max, ordem, exemplo)
  values (
    cat4_id,
    'Comunicação "Anti-Fricção"',
    'A comunicação foi limpa? (Parágrafos curtos, negrito, listas, evitou textões). Áudios curtos (até 30s) apenas para proximidade. Preços/planos de forma visual.',
    1.0,
    1.0,
    1,
    'Uso de formatação adequada, áudios curtos, imagens para preços'
  );

  -- Category 5: Condução e Fechamento (3/10)
  insert into categoria (id_modelo, nome, peso, ordem, descricao)
  values (
    model_id,
    'Condução e Fechamento',
    3.0,
    5,
    'Usar técnicas de persuasão para lidar com a decisão, objeções e o "medo" natural do cliente antes da compra.'
  )
  returning id into cat5_id;

  insert into criterio (id_categoria, titulo, descricao, peso_relativo, pontuacao_max, ordem, exemplo)
  values
  (
    cat5_id,
    'Validação e Contorno de Objeções',
    'Ao receber uma objeção (preço, tempo), o vendedor validou o sentimento antes de responder?',
    0.5,
    3.0,
    1,
    'Eu entendo sua preocupação com o valor...'
  ),
  (
    cat5_id,
    'Uso de Gatilhos Mentais (Persuasão)',
    'O vendedor usou Prova Social ou Urgência/Escassez para acelerar a decisão?',
    1.0,
    3.0,
    2,
    'Muitos clientes com [mesmo cenário/problema] relatam [resultado X]... ou ...essa condição especial é válida até hoje'
  ),
  (
    cat5_id,
    'Gestão de Tensão (Escalação de Canal)',
    'Ao perceber uma objeção complexa ou atrito, o vendedor sugeriu proativamente uma ligação?',
    0.5,
    3.0,
    3,
    'Para eu te explicar esse ponto em detalhe, posso te ligar 2 minutinhos?'
  ),
  (
    cat5_id,
    'CTA (Call to Action) Efetivo',
    'O vendedor foi diretivo e pediu o próximo passo de forma clara?',
    1.0,
    3.0,
    4,
    'Com isso resolvido, podemos seguir com a emissão do seu pedido? ou Qual o melhor e-mail para eu enviar o link de pagamento?'
  );

end;
$$;

-- Grant execute permission to authenticated users
grant execute on function create_default_evaluation_model(uuid) to authenticated;
