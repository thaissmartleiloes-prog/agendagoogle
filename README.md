# 🗓 Smart Agenda — Guia de Implantação
### Para quem não tem experiência técnica

---

## Visão geral do que você vai fazer

```
1. Criar conta GitHub → subir os arquivos
2. Criar conta Vercel → publicar o site (3 cliques)
3. Criar conta Supabase → banco de dados + login
4. Criar projeto Google Cloud → integração com Google Calendar
5. Colar as chaves no Vercel → tudo funcionando!
```

**Tempo estimado:** 1h30 na primeira vez  
**Custo:** R$ 0 (todos os planos gratuitos)

---

## ETAPA 1 — GitHub (onde ficará o código)

### 1.1 Criar conta
1. Acesse **github.com**
2. Clique em **Sign up**
3. Use seu e-mail e crie uma senha
4. Confirme o e-mail

### 1.2 Criar repositório
1. Após logar, clique no **+** no canto superior direito
2. Clique em **New repository**
3. Nome: `smart-agenda`
4. Deixe como **Private** (privado)
5. Clique em **Create repository**

### 1.3 Subir os arquivos
1. Na página do repositório, clique em **uploading an existing file**
2. Arraste a pasta inteira do projeto para a área indicada
3. Clique em **Commit changes**

✅ Pronto! Seu código está salvo no GitHub.

---

## ETAPA 2 — Vercel (onde o site vai ficar no ar)

### 2.1 Criar conta
1. Acesse **vercel.com**
2. Clique em **Sign Up**
3. Escolha **Continue with GitHub** (usa a conta que você criou)
4. Autorize o acesso

### 2.2 Publicar o projeto
1. Clique em **Add New Project**
2. Na lista, procure o repositório `smart-agenda` e clique em **Import**
3. Clique em **Deploy** (não precisa mudar nada!)
4. Aguarde ~2 minutos ☕

Você vai receber um link tipo: `smart-agenda-xxx.vercel.app`

> ⚠️ O site vai funcionar, mas ainda sem banco de dados.  
> As próximas etapas ativam o login e o armazenamento.

---

## ETAPA 3 — Supabase (banco de dados + login)

### 3.1 Criar conta
1. Acesse **supabase.com**
2. Clique em **Start your project**
3. Faça login com GitHub

### 3.2 Criar projeto
1. Clique em **New Project**
2. Escolha um nome: `smart-agenda`
3. Crie uma senha (guarde em local seguro!)
4. Região: **South America (São Paulo)**
5. Clique em **Create new project**
6. Aguarde ~2 minutos

### 3.3 Criar as tabelas do banco
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query**
3. Abra o arquivo `supabase-schema.sql` (que está no projeto)
4. Copie **todo** o conteúdo e cole no editor
5. Clique em **Run** (botão verde)

Você verá "Success" — as tabelas foram criadas com os 8 usuários!

### 3.4 Ativar login com e-mail (Magic Link)
1. No menu lateral, clique em **Authentication**
2. Clique em **Providers**
3. Confirme que **Email** está ativado
4. Em **Settings**, desative "Confirm email" por enquanto (facilita os testes)

### 3.5 Pegar as chaves do Supabase
1. No menu lateral, clique em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Anote:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → será `SUPABASE_SERVICE_ROLE_KEY` ⚠️ nunca compartilhe esta!

---

## ETAPA 4 — Google Cloud (para o Google Calendar)

### 4.1 Criar projeto
1. Acesse **console.cloud.google.com**
2. Faça login com a conta Google da Thais (a administradora)
3. Clique em **Select a project** → **New Project**
4. Nome: `Smart Agenda`
5. Clique em **Create**

### 4.2 Ativar a API do Google Calendar
1. No menu lateral, vá em **APIs & Services** → **Library**
2. Pesquise por **Google Calendar API**
3. Clique nela e depois em **Enable**

### 4.3 Criar credenciais OAuth
1. Vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Se pedir para configurar a "tela de consentimento":
   - Escolha **External**
   - Preencha o nome do app: `Smart Agenda`
   - Preencha seu e-mail de suporte
   - Clique em **Save and Continue** em todas as telas
4. De volta em **Create Credentials** → **OAuth client ID**:
   - Tipo: **Web application**
   - Nome: `Smart Agenda Web`
   - Em **Authorized redirect URIs**, adicione:
     ```
     https://SEU-SITE.vercel.app/api/auth/google/callback
     ```
     (substitua pelo seu link do Vercel)
5. Clique em **Create**
6. Anote:
   - **Client ID** → será `GOOGLE_CLIENT_ID`
   - **Client Secret** → será `GOOGLE_CLIENT_SECRET`

### 4.4 Adicionar usuários de teste
1. Vá em **APIs & Services** → **OAuth consent screen**
2. Role até **Test users**
3. Clique em **Add users**
4. Adicione os e-mails de todos os 8 colaboradores

---

## ETAPA 5 — Conectar tudo no Vercel

### 5.1 Adicionar as variáveis de ambiente
1. Acesse **vercel.com** → seu projeto `smart-agenda`
2. Clique em **Settings** → **Environment Variables**
3. Adicione cada variável abaixo:

| Nome da variável | Valor | Onde pegar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... | Supabase → Settings → API |
| `GOOGLE_CLIENT_ID` | xxx.apps.googleusercontent.com | Google Cloud → Credentials |
| `GOOGLE_CLIENT_SECRET` | GOCSPX-... | Google Cloud → Credentials |
| `NEXTAUTH_URL` | https://SEU-SITE.vercel.app | O link do seu Vercel |
| `NEXTAUTH_SECRET` | (gere abaixo) | Gere uma string aleatória |

**Como gerar o NEXTAUTH_SECRET:**
- Acesse **generate-secret.vercel.app**
- Copie o valor gerado e cole no campo

### 5.2 Fazer o re-deploy
1. Na aba **Deployments** do Vercel
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**
4. Aguarde ~2 minutos

---

## ✅ Pronto! Testando o sistema

### Primeiro acesso
1. Acesse o link do seu site (ex: `smart-agenda-xxx.vercel.app`)
2. Clique no nome de um colaborador
3. Ele receberá um e-mail com o link de acesso (Magic Link)
4. Ao clicar no link, entra direto no sistema

### Conectar o Google Calendar (cada colaborador faz uma vez)
1. Após logar, haverá um aviso amarelo **"Conectar Google Calendar"**
2. Clicar no botão abre a tela de permissão do Google
3. O colaborador autoriza o acesso
4. A partir daí, todos os agendamentos sincronizam automaticamente

---

## Domínio personalizado (opcional, ~R$40/ano)

Se quiser um endereço mais bonito como `agenda.smartleiloes.com.br`:

1. Compre um domínio em **registro.br** (domínios .com.br) ou **namecheap.com**
2. No Vercel → **Settings** → **Domains**
3. Clique em **Add Domain** e siga as instruções
4. Vercel vai te mostrar um código DNS para configurar no registro.br

---

## Estrutura dos arquivos do projeto

```
smart-agenda/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── appointments/route.ts   ← API de agendamentos
│   │   │   ├── auth/google/callback/   ← OAuth Google
│   │   │   └── gcal-webhook/route.ts  ← Sync bidirecional
│   │   ├── agenda/page.tsx             ← Tela principal
│   │   ├── login/page.tsx              ← Tela de login
│   │   └── layout.tsx
│   ├── components/
│   │   ├── AgendaApp.tsx               ← App principal
│   │   ├── AppointmentModal.tsx        ← Modal de agendamento
│   │   └── WeekView.tsx                ← Todas as visualizações
│   └── lib/
│       ├── supabase.ts                 ← Banco de dados
│       └── google-calendar.ts          ← Integração Google
├── supabase-schema.sql                 ← Execute no Supabase
├── .env.example                        ← Modelo das variáveis
└── package.json
```

---

## Problemas comuns

**"O site abre mas não consigo logar"**
→ Verifique se as variáveis do Supabase foram adicionadas corretamente no Vercel e se fez o re-deploy.

**"Recebi o e-mail mas o link não funciona"**
→ No Supabase → Authentication → URL Configuration, adicione seu domínio Vercel em "Site URL".

**"O Google Calendar não sincroniza"**
→ Verifique se o e-mail do colaborador foi adicionado como "Test user" no Google Cloud Console.

**"Deu erro 500"**
→ No Vercel → seu projeto → **Functions** → veja os logs de erro para identificar a variável faltando.

---

## Suporte

Em caso de dúvidas, volte ao Claude e descreva exatamente:
1. Em qual etapa está
2. Qual mensagem de erro apareceu
3. Uma captura de tela se possível

---

*Smart Agenda v1.0 — Gerado automaticamente*
