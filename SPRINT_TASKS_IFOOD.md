# Sprint Tasks (baseado no iFood)

Documento com tasks reorganizadas para refletir o comportamento do app iFood na home e funcionalidades essenciais.

## Objetivo
Fazer a home do cliente ficar extremamente parecida com o iFood: banner de cupons, barra de busca, carrossel de categorias, destaques/últimas lojas, vitrine de restaurantes, cards ricos com imagem/nota/tempo, e botão de carrinho persistente.

## Epics / Features
- Autenticação e perfil (login, social login, OTP)  
- Vitrine / Home (busca, categorias, cupons, destaques)  
- Restaurantes (CRUD backend + frontend)  
- Produtos (CRUD backend + frontend)  
- Carrinho e checkout (carrinho persistente, tela de checkout, pedidos)  
- Filtros & Ordenação (por nota, tempo, tipo de cozinha)  
- Integrações (supabase auth / social login opcional)

## Tasks sugeridas por sprint (priorizadas)

Sprint 1 (Base iFood - cliente)
- T1.1: Implementar banner de cupons fixo na home (visual/CTA).  
- T1.2: Barra de busca com debounce e integração com endpoint `GET /api/restaurantes?busca=`.  
- T1.3: Carrossel de categorias horizontal com ícones e ação de filtro.  
- T1.4: Cards de restaurante com imagem, nota, tempo estimado e CTA para abrir cardápio.  
- T1.5: Botão flutuante de carrinho com contador de itens e navegação para tela de carrinho.

Sprint 2 (Cadastro e catálogo)
- T2.1: CRUD Restaurantes no backend (model, rotas, controllers).  
- T2.2: CRUD Produtos por restaurante no backend.  
- T2.3: Listagem (filtros e paginação) no frontend para restaurantes/produtos.  
- T2.4: Tela de cadastro/edição de restaurante (frontend).  

Sprint 3 (Autenticação e checkout)
- T3.1: Implementar login por email/senha + token JWT (backend).  
- T3.2: Implementar login social (Google/Facebook) e sincronização com Supabase (opcional).  
- T3.3: Carrinho persistente (localStorage) + fluxo de checkout (criar pedido via API).  
- T3.4: Tela de Meus Pedidos e histórico.

Sprint 4 (Qualidade e extras)
- T4.1: Filtros avançados (ordenar por menor tempo, melhor nota, taxa de entrega).  
- T4.2: Implementar páginas de perfil e configurações do usuário.  
- T4.3: Monitoramento de erros e logs (Sentry / Logstash).  
- T4.4: Testes automatizados (unit + integração) para endpoints críticos.

## Notas de implementação / acordos
- Contrato REST simplificado:  
  - GET /api/restaurantes?busca=&page=&per_page=&categoria=  
  - GET /api/restaurantes/:id  
  - GET /api/restaurantes/:id/produtos  
  - POST /api/pedidos (body com itens, endereco, observacao)
- UX targets: home deve carregar rápido (<600ms para dados de vitrine em infra dev local) e componentes devem ser acessíveis.
- Priorizar implementação mobile-first (grid responsivo) e usabilidade no toque.

## Próximos passos propostos
1. Entregar mudanças visuais na home (banner, categorias, últimas lojas, botão de carrinho) — já em progresso.  
2. Criar endpoints e fixtures para restaurantes de exemplo para popular a vitrine em dev.  
3. Implementar persistência simples do carrinho (localStorage) e tela de carrinho.  
4. Revisar tarefas e dividir em issues pequenas no tracker (GitHub Projects / Issues).


---
Gerado automaticamente pelo assistente; ajuste prioridades/estimativas conforme time.
