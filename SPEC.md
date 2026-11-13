# Glint — Especificação Técnica (`SPEC.md`)

> **Status:** Stack Base Definida (Core Web, Banco de Dados e ORM)  
> *Camadas de IA, Orquestração e Memória serão adicionadas conforme validação.*

---

## 1. Visão Geral da Stack Base

A arquitetura fundacional do **Glint** utiliza uma stack full-stack TypeScript moderna centrada em **Next.js**, **Prisma** e **Supabase**:

| Camada | Tecnologia | Papel no Projeto |
| :--- | :--- | :--- |
| **Framework Full-Stack** | **Next.js 16 (App Router + TypeScript)** | Renderização híbrida (Server/Client Components), Route Handlers (`app/api/`), Server Actions e roteamento via `proxy.ts`. |
| **Banco de Dados & BaaS** | **Supabase (PostgreSQL)** | Banco de dados PostgreSQL gerenciado, Autenticação (`@supabase/ssr` / `@supabase/supabase-js`), Storage e Row Level Security (RLS). |
| **ORM & Migrations** | **Prisma ORM (`prisma` + `@prisma/client`)** | Modelagem declarativa do banco (`prisma/schema.prisma`), tipagem estática ponta a ponta em TypeScript e controle de migrações SQL. |

---

## 2. Como Prisma e Supabase Operam Juntos no Next.js

1. **Modelagem e Tipagem (`Prisma`):**
   - Toda a estrutura relacional da aplicação é declarada em [`prisma/schema.prisma`](./prisma/schema.prisma).
   - O **Prisma Client** é utilizado exclusivamente no **servidor** (Server Components, Server Actions e Route Handlers em `app/api/`) através de uma instância singleton em `lib/prisma.ts`, garantindo queries fortemente tipadas e evitando exaustão de conexões em ambiente de desenvolvimento (Hot Reload).
2. **Conexão com Connection Pooling (`Supabase Supavisor`):**
   - `DATABASE_URL`: Usa a string de conexão com **Transaction Pooler** do Supabase (porta `6543` com `?pgbouncer=true`) para queries em runtime serverless/edge.
   - `DIRECT_URL`: Usa a conexão direta com o PostgreSQL do Supabase (porta `5432`) exclusivamente para rodar migrações (`npx prisma migrate dev` / `npx prisma db push`).
3. **Autenticação e Cliente Supabase (`@supabase/supabase-js` & `@supabase/ssr`):**
   - O SDK do Supabase gerencia sessão de usuários, cookies SSR no Next.js e recursos nativos da plataforma (Auth, Realtime e Storage), integrando-se às tabelas modeladas pelo Prisma via `user_id`.

---

## 3. Variáveis de Ambiente Necessárias (`.env`)

```env
# Supabase API & Auth
NEXT_PUBLIC_SUPABASE_URL="https://[SEU-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon-publica"

# Prisma + Supabase PostgreSQL Connection
# Transaction Pooler (Porta 6543) — Usado pela aplicação em runtime
DATABASE_URL="postgresql://postgres.[SEU-PROJECT-REF]:[SUA-SENHA]@aws-0-[REGIAO].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (Porta 5432) — Usado pelo Prisma CLI para Migrations / Introspection
DIRECT_URL="postgresql://postgres.[SEU-PROJECT-REF]:[SUA-SENHA]@aws-0-[REGIAO].pooler.supabase.com:5432/postgres"
```

---

## 4. Documentação de Referência da Stack

### Next.js
- **Documentação Local do Projeto (Next.js 16):** [`node_modules/next/dist/docs/`](./node_modules/next/dist/docs/) *(consulte sempre esta pasta para APIs e convenções da versão instalada)*
- **Documentação Oficial Web:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **App Router & Route Handlers:** [https://nextjs.org/docs/app](https://nextjs.org/docs/app)

### Prisma ORM
- **Documentação Oficial do Prisma:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Guia Oficial Prisma + Supabase:** [https://www.prisma.io/docs/orm/overview/databases/supabase](https://www.prisma.io/docs/orm/overview/databases/supabase)
- **Guia Oficial Prisma + Next.js (Singleton Best Practices):** [https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices)
- **Referência do `schema.prisma`:** [https://www.prisma.io/docs/orm/reference/prisma-schema-reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)

### Supabase
- **Documentação Oficial do Supabase:** [https://supabase.com/docs](https://supabase.com/docs)
- **Guia Oficial Supabase + Prisma:** [https://supabase.com/docs/guides/database/prisma](https://supabase.com/docs/guides/database/prisma)
- **Supabase Auth com Next.js App Router (`@supabase/ssr`):** [https://supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- **JavaScript Client (`@supabase/supabase-js`):** [https://supabase.com/docs/reference/javascript/introduction](https://supabase.com/docs/reference/javascript/introduction)

---

## 5. Comandos Úteis do Dia a Dia

```bash
# Gerar o cliente TypeScript do Prisma após alterar prisma/schema.prisma
npx prisma generate

# Sincronizar o schema rapidamente durante prototipagem (sem criar histórico de migration)
npx prisma db push

# Criar e aplicar uma nova migration versionada
npx prisma migrate dev --name nome_da_mudanca

# Abrir o Prisma Studio para visualizar e editar os dados localmente
npx prisma studio
```
