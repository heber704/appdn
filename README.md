# App Development Notifier — Web

Sistema de Gerenciamento de Testes de Software desenvolvido em **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma** e **MySQL**.

---

## Stack

| Camada    | Tecnologia                    |
|-----------|-------------------------------|
| Frontend  | Next.js 14 (App Router) + React 18 |
| Estilos   | Tailwind CSS + CSS Variables  |
| Auth      | NextAuth.js (JWT)             |
| ORM       | Prisma                        |
| Banco     | MySQL (mesmo do projeto C#)   |
| E-mail    | Brevo (Sendinblue) API        |
| Fontes    | Syne + DM Sans + JetBrains Mono |

---

## Instalação

### 1. Clone e instale as dependências

```bash
cd appdn
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```env
DATABASE_URL="mysql://root:@localhost:3306/Teste"
NEXTAUTH_SECRET="gere-uma-chave-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
BREVO_API_KEY="sua-chave-brevo"
EMAIL_FROM="seu@email.com"
```

### 3. Gere o cliente Prisma e aplique o schema ao banco

```bash
# Gera o Prisma Client
npm run db:generate

# Aplica o schema ao banco MySQL existente
# ATENÇÃO: isso vai criar as tabelas novas sem apagar as existentes
npm run db:push
```

> **Nota:** O `db:push` é seguro para usar no banco que já tem a tabela `usuarios`. Ele cria as tabelas novas do sistema de testes sem tocar nas existentes.

### 4. Rode o projeto

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/          # Páginas públicas: login, cadastro, recuperar senha
│   │   ├── login/
│   │   ├── cadastro/
│   │   └── recuperar-senha/
│   ├── (app)/           # Páginas protegidas (requer login)
│   │   ├── dashboard/
│   │   ├── projetos/
│   │   ├── bugs/
│   │   ├── casos-teste/
│   │   ├── ciclos/
│   │   ├── requisitos/
│   │   ├── planos/
│   │   ├── ambientes/
│   │   ├── relatorios/
│   │   ├── solicitacoes/
│   │   ├── usuarios/    # Admin only
│   │   ├── auditoria/   # Admin only
│   │   ├── notificacoes/
│   │   └── conta/
│   └── api/             # API Routes (backend)
│       ├── auth/
│       ├── dashboard/
│       ├── usuarios/
│       └── reset-senha/
├── components/
│   ├── layout/          # Sidebar, Topbar
│   └── ui/              # Componentes reutilizáveis
├── lib/
│   ├── auth.ts          # Configuração NextAuth
│   ├── prisma.ts        # Singleton Prisma
│   ├── email.ts         # Serviço Brevo
│   └── utils.ts         # Utilitários, feriados BR
└── middleware.ts        # Proteção de rotas
```

---

## Funcionalidades implementadas

### Autenticação
- [x] Login com bloqueio progressivo por tentativas
- [x] Bloqueio de conta após 5 erros (gravado no banco)
- [x] Verificação de conta inativa
- [x] Redirecionamento por cargo (Admin / Usuário)

### Recuperação de senha
- [x] Etapa 1: validação do login + envio de código por e-mail
- [x] Distinção de bloqueio: por tentativas (permite recuperar) vs. manual (bloqueia)
- [x] Etapa 2: verificação do código com contador de 60s e reenvio
- [x] Etapa 3: nova senha com validação + reativação da conta
- [x] Auto preenchimento do login na tela de login após recuperar

### Cadastro
- [x] Validação de e-mail, senha mínima (6 chars), login duplicado
- [x] Hash BCrypt da senha

### Dashboard
- [x] KPIs: bugs por status, casos de teste, cobertura
- [x] Alerta de bugs críticos
- [x] Mensagem inteligente de descanso (feriados BR incluídos)
- [x] Últimos bugs e execuções recentes
- [x] Projetos ativos

### Layout
- [x] Sidebar com navegação por cargo
- [x] Topbar com saudação dinâmica, status e menu do usuário
- [x] Design escuro com tema coeso (Tailwind CSS Variables)

---

## Próximas telas a implementar

- [ ] CRUD de Projetos
- [ ] CRUD de Bugs (com imagens)
- [ ] CRUD de Casos de Teste
- [ ] Execução de testes (passo a passo)
- [ ] Ciclos de teste
- [ ] Requisitos + rastreabilidade
- [ ] Relatórios (PDF/Excel)
- [ ] Gestão de usuários (Admin)
- [ ] Conta do usuário + desativação

---

## Banco de dados

O schema cria as seguintes tabelas novas (além das já existentes):

`projetos`, `projeto_membros`, `requisitos`, `casos_teste`, `passos_teste`,
`ciclos_teste`, `ciclo_itens`, `execucoes_teste`, `resultados_passo`,
`bugs`, `imagens_bug`, `historico_bugs`, `comentarios_bug`,
`planos_teste`, `plano_teste_ciclos`, `ambientes`,
`solicitacoes`, `notificacoes`, `auditoria`, `reset_senha`

A tabela `usuarios` existente é reutilizada pelo Prisma (com a adição do campo `bloqueio_tipo` se ainda não existir).
