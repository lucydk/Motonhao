# 🏍️ Motonhão

**Sua corrida. Do seu jeito.**

PWA de transporte por motocicleta construída com React + Vite + Supabase (Auth, Postgres, Realtime, RLS). Projeto acadêmico com estrutura profissional.

---

## 1. Estrutura de pastas

```
motonhao/
├── public/
│   └── icons/                  # ícones do PWA (192, 512, maskable)
├── sql/
│   └── schema.sql               # schema completo do Supabase (tabelas, RLS, triggers, realtime)
├── src/
│   ├── assets/
│   ├── components/              # Navbar, BottomNavigation, Button, Input, Card, Modal,
│   │                             # RideCard, DriverCard, RideStatus, Rating, MapMock, Loading,
│   │                             # EmptyState, Toast, ProtectedRoute, InstallPWA, OfflineBanner, UpdatePrompt
│   ├── context/                 # AuthContext, RideContext, ToastContext
│   ├── hooks/                   # useOnlineStatus, useAvailableRides
│   ├── layouts/                 # MainLayout (landing/auth), DashboardLayout (app)
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── auth/                # Login, Register, ForgotPassword, ResetPassword
│   │   ├── passenger/           # Dashboard, ChooseRide, ConfirmRide, ActiveRide, RideHistory, Profile
│   │   ├── driver/               # Dashboard, ActiveRide, Earnings, Profile
│   │   └── admin/                # Dashboard, Users, Drivers, Rides
│   ├── services/                 # authService, profileService, rideService, driverService, ratingService
│   ├── styles/                   # variables, global, components, landing, auth, dashboard (CSS puro)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js                # inclui vite-plugin-pwa
├── package.json
├── .env.example
└── README.md
```

---

## 2. Instalar dependências

```bash
npm install
```

---

## 3. Configurar o Supabase

### 3.1. Criar o projeto
1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. Em **Settings → API**, copie a **Project URL** e a **anon public key**.

### 3.2. Variáveis de ambiente
```bash
cp .env.example .env
```
Edite `.env` e preencha:
```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```
Nunca coloque essas chaves direto no código — elas já são lidas apenas via `import.meta.env` em `src/lib/supabase.js`.

### 3.3. Rodar o SQL
1. No painel do Supabase, abra **SQL Editor**.
2. Cole todo o conteúdo de `sql/schema.sql` e execute.

Esse script cria, na ordem:
- Enums (`user_role`, `ride_type`, `ride_status`, `payment_method`, `payment_status`)
- Tabelas `profiles`, `drivers`, `rides`, `ratings`, `payments` com FKs, índices e constraints
- Trigger que cria automaticamente o `profile` (e o `driver`, se aplicável) quando um usuário se cadastra no Supabase Auth
- Trigger que recalcula a média de avaliação (`rating`) do motociclista a cada nova avaliação
- Trigger que incrementa `total_rides` e define `started_at`/`completed_at` conforme o status da corrida muda
- Triggers que criam e atualizam o registro em `payments` automaticamente
- Row Level Security (RLS) habilitado em todas as tabelas, com policies para passageiro, motociclista e admin
- Publicação da tabela `rides` e `drivers` no Realtime

### 3.4. Ativar confirmação de e-mail (opcional)
Em **Authentication → Providers → Email**, você pode desativar "Confirm email" durante o desenvolvimento para testar cadastro/login mais rápido.

### 3.5. Criar o primeiro administrador
1. Cadastre-se normalmente pelo app (como passageiro, por exemplo).
2. No **SQL Editor** do Supabase, rode:
   ```sql
   update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
   ```
3. Faça login novamente no app — esse usuário agora acessa `/admin`.

---

## 4. Executar o projeto

```bash
npm run dev
```

Acesse `http://localhost:5173`.

Para build de produção:
```bash
npm run build
npm run preview
```

---

## 5. Testar o PWA

1. Rode `npm run build && npm run preview` (o service worker só é totalmente ativado em build/preview, embora `devOptions.enabled: true` também o habilite em `npm run dev`).
2. Abra o app no Chrome (desktop ou Android).
3. **Desktop:** clique no ícone de instalação na barra de endereço, ou use o botão flutuante **"Instalar Motonhão"** que aparece na tela.
4. **Android:** no Chrome, use "Adicionar à tela inicial" ou o mesmo botão de instalação.
5. **iOS (Safari):** use Compartilhar → "Adicionar à Tela de Início" (o `beforeinstallprompt` não existe no iOS, então o botão customizado não aparece lá, mas o app funciona como PWA instalado normalmente).
6. Para testar o modo offline: com o app aberto, abra o DevTools → Network → marque "Offline". Você verá o aviso "Você está offline. Algumas funções do Motonhão não estão disponíveis." no topo da tela. Os arquivos estáticos continuam funcionando via cache do `vite-plugin-pwa`; login, cadastro, criação de corridas e Realtime exigem conexão.
7. Para testar o aviso de nova versão: gere um novo build (`npm run build`) com alguma alteração e sirva novamente com o app já aberto/instalado — o banner "Nova versão do Motonhão disponível" deve aparecer com o botão "Atualizar agora".

---

## 6. Fluxo funcional da corrida (resumo)

1. **Passageiro** informa origem/destino → vê 3 opções (Econômico/Padrão/Rápido) com preço, tempo e distância **simulados** (não há integração real de mapa) → confirma forma de pagamento → corrida é criada no Supabase com status `searching`.
2. **Motociclistas online** recebem a nova corrida automaticamente via **Supabase Realtime** (sem polling) e podem **Aceitar**.
3. Ao aceitar, o status muda para `accepted` e o **passageiro recebe a atualização em tempo real**, vendo os dados do motociclista (nome, avaliação, moto, placa).
4. O motociclista avança o status manualmente: `accepted → driver_arriving → in_progress → completed`. Cada mudança é propagada ao passageiro via Realtime.
5. Ao concluir, o passageiro avalia a corrida (1 a 5 estrelas + comentário) — a nota é salva em `ratings` e a **média do motociclista é recalculada automaticamente por trigger no banco**.
6. Histórico de corridas, ganhos do motociclista (dia/semana/total) e o painel administrativo consultam dados reais do Supabase.

---

## 7. Observações importantes

- Não há backend Node/Express: toda a lógica de dados passa pelo Supabase (Auth, Postgres, RLS, Realtime) diretamente do cliente, através dos arquivos em `src/services`.
- Mapas e cálculo de distância/tempo/preço são **simulados** (`src/services/rideService.js → estimateRide`), pois exigiriam uma API externa de geolocalização — conforme especificado no briefing.
- Todo o restante (autenticação, cadastro, criação e aceite de corridas, atualizações de status, avaliações, histórico, ganhos e painel admin) é **funcional de ponta a ponta** com o Supabase.
