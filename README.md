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
│   ├── components/              # Logo, Avatar, AvatarPicker, Plate, PassengerCard, GuestRoute, Navbar, BottomNavigation, Button, Input, Card, Modal,
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

### 3.3.1. Fotos de perfil
Passageiros e motociclistas precisam ter foto para usar o app (a tela `/foto` aparece logo depois do login para quem ainda não tem). Para isso funcionar, rode também `sql/migration_avatars.sql` no **SQL Editor** — ele cria o bucket `avatars` e as policies de acesso.

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


---

## Novidades: expiração automática, chat, mapa real e perfis públicos

Para ativar tudo isso, rode **uma vez** no SQL Editor do Supabase o arquivo
`sql/migration_corrida_chat_perfil.sql` (pode rodar de novo sem quebrar nada).

### 1. A corrida se fecha sozinha
- Todo pedido nasce com um prazo (`rides.expires_at`), hoje de **5 minutos** —
  o número fica em `src/config/platformConfig.js` (`RIDE_SEARCH_TIMEOUT_MINUTES`).
- Na tela do passageiro aparece um contador regressivo; ao chegar a zero, o
  pedido é cancelado automaticamente.
- A função `expire_stale_rides()` no banco fecha também as corridas de quem
  simplesmente fechou o app. Ela é chamada sempre que o painel do passageiro ou
  a lista de corridas do motociclista carrega, então nenhuma corrida fica aberta
  por dias.
- Um gatilho no banco impede que um motociclista aceite uma corrida vencida.
- Se quiser que a limpeza rode sozinha de minuto em minuto mesmo sem ninguém
  usando o app, ative a extensão `pg_cron` no Supabase e agende:
  `select cron.schedule('expirar-corridas', '* * * * *', $$select public.expire_stale_rides()$$);`

### 2. Chat da corrida
- Nova tabela `ride_messages`, com RLS: só o passageiro e o motociclista
  **daquela** corrida leem e escrevem.
- O chat aparece nas duas telas de corrida em andamento, com botões de frases
  prontas ("Estou a caminho", "Cheguei", "Já estou descendo"…) e entrega em
  tempo real via Supabase Realtime.

### 3. Mapa real durante a corrida
- O quadrado desenhado (`MapMock`) saiu das telas de corrida. Agora aparece o
  mapa do OpenStreetMap com **origem, destino e o traçado da rota** (OSRM).
- Corridas antigas sem coordenadas salvas são geocodificadas na hora pelo
  endereço em texto, então nunca se cai num mapa genérico.
- O motociclista envia a posição do GPS a cada ~8 segundos durante a corrida e o
  passageiro vê a moto se mexendo no mapa (`rides.driver_lat` / `driver_lng`).

### 4. Avaliações escritas e perfil dos outros
- Nova página `/perfil/:id`: foto, nome, tempo de casa, dados da moto, nota
  média e **a lista de avaliações com o texto que cada passageiro escreveu**.
- Dá para chegar nela clicando no cartão do motociclista, no cartão do
  passageiro ou em qualquer corrida do histórico.
- O motociclista também vê as próprias avaliações em "Meu perfil".
- Os dados vêm das funções `public_profile()` e `driver_ratings()`, que expõem
  só o necessário — a tabela `profiles` continua fechada por RLS.

---

## Cadastro completo do motociclista, botão Sair e navegação mais curta

Rode **uma vez** no SQL Editor do Supabase: `sql/migration_cadastro_documentos.sql`.

### 1. Cadastro do motociclista
**Dados pessoais:** nome completo, CPF, e-mail, telefone e foto de perfil.
**CNH:** foto da carteira.
**Moto:** marca, modelo, ano, cor, placa, foto da moto e foto do CRLV.

- CPF, telefone e placa já saem formatados enquanto a pessoa digita, e o CPF é
  conferido pelos dígitos verificadores (`src/utils/cpf.js`) — não adianta
  inventar número. Um CPF por conta, garantido por índice único no banco.
- As fotos são enviadas depois do login, em dois passos curtos: `/foto` (perfil)
  e `/documentos` (CNH, moto, CRLV). É assim porque o upload precisa de uma
  sessão ativa — antes de criar a conta não existe usuário pra dono do arquivo.
- CNH e CRLV são documentos sensíveis, então vão para um bucket **privado**
  (`documents`). No banco fica só o caminho do arquivo; a imagem só abre por
  link temporário, e apenas para o dono ou para o administrador.
- Em `/admin/motociclistas` o administrador vê o CPF e abre cada documento antes
  de aprovar ou reprovar o cadastro.
- Quem já era motociclista antes dessa etapa passa uma vez pela tela de
  documentos na próxima entrada.

### 2. Botão "Sair" no topo de todas as telas
`SignOutButton` fica na barra superior do painel (passageiro, motociclista e
admin) e também nas telas de foto e documentos. Dá pra encerrar a sessão de
onde a pessoa estiver, sem precisar voltar até a tela inicial.

### 3. Voltar sem passar por tudo de novo
Antes, sair de um pedido de corrida exigia apertar "voltar" uma vez para cada
tela do fluxo. Agora:
- A tela de escolha da corrida sai do histórico (`replace`) ao seguir para o
  resumo, então o "voltar" do celular cai direto no início.
- Cada tela interna tem um "← Voltar" que aponta para a **tela-mãe fixa**, e não
  para o histórico do navegador.
