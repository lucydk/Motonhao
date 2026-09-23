# Motonhão — Documentação completa

> **Sua corrida. Do seu jeito.**
> Aplicativo web instalável (PWA) de corridas de moto, com passageiros,
> motociclistas e painel administrativo. Projeto acadêmico com estrutura profissional.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Linguagens e tecnologias](#2-linguagens-e-tecnologias)
3. [Arquitetura](#3-arquitetura)
4. [Estrutura de pastas e arquivos](#4-estrutura-de-pastas-e-arquivos)
5. [Tipos de usuário e mapa de telas](#5-tipos-de-usuário-e-mapa-de-telas)
6. [Como cada funcionalidade funciona](#6-como-cada-funcionalidade-funciona)
7. [Banco de dados (Supabase)](#7-banco-de-dados-supabase)
8. [Serviços de mapa (OpenStreetMap)](#8-serviços-de-mapa-openstreetmap)
9. [Regras de negócio](#9-regras-de-negócio)
10. [PWA (app instalável)](#10-pwa-app-instalável)
11. [Segurança](#11-segurança)
12. [Evolução do projeto](#12-evolução-do-projeto)
13. [Instalação e execução](#13-instalação-e-execução)
14. [Limitações conhecidas e próximos passos](#14-limitações-conhecidas-e-próximos-passos)

---

## 1. Visão geral

O Motonhão conecta **passageiros** que precisam de uma corrida de moto a
**motociclistas** cadastrados e verificados. Tudo acontece em tempo real:

- o passageiro pede uma corrida e vê preço, distância e tempo estimados;
- motociclistas que estão online recebem o pedido na hora e um deles aceita;
- durante a corrida há **mapa ao vivo**, **chat** e **status** atualizados sozinhos;
- ao final o passageiro **avalia** o motociclista, e a nota aparece no perfil dele;
- o **administrador** confere os documentos dos motociclistas e acompanha os números.

O app roda no navegador e pode ser **instalado no celular** como se fosse um
aplicativo nativo. Não há servidor próprio (backend): o navegador conversa
diretamente com o **Supabase**, e as regras de segurança ficam dentro do banco.

---

## 2. Linguagens e tecnologias

### 2.1 Linguagens

| Linguagem | Onde é usada |
|---|---|
| **JavaScript (ES Modules)** | Toda a lógica do app: serviços, contextos, hooks, utilitários e configuração |
| **JSX** | Telas e componentes React (`.jsx`) — HTML escrito dentro do JavaScript |
| **CSS** | Todo o visual (CSS puro, sem framework), com variáveis para cores e medidas |
| **HTML** | Um único `index.html`; o restante é montado pelo React |
| **SQL / PL/pgSQL** | Banco de dados: tabelas, gatilhos (triggers), funções e segurança (RLS) |
| **Markdown** | Esta documentação e o README |

### 2.2 Bibliotecas e ferramentas

Versões conforme o `package.json`.

| Tecnologia | Versão | Para que serve |
|---|---|---|
| **React** / **React DOM** | ^18.3.1 | Construção da interface em componentes |
| **React Router DOM** | ^6.26.2 | Navegação entre telas (rotas, redirecionamentos, rotas protegidas) |
| **Vite** | ^5.4.8 | Servidor de desenvolvimento rápido e geração do build final |
| **@vitejs/plugin-react** | ^4.3.1 | Faz o Vite entender JSX |
| **vite-plugin-pwa** | ^0.20.5 | Gera o manifesto, o service worker e o aviso de nova versão |
| **@supabase/supabase-js** | ^2.45.4 | Cliente do Supabase: login, consultas, tempo real e arquivos |
| **Leaflet** | ^1.9.4 | Biblioteca de mapas |
| **React-Leaflet** | ^4.2.1 | Integração do Leaflet com React |

### 2.3 Serviços externos

| Serviço | Uso | Chave de API? |
|---|---|---|
| **Supabase** | Login (Auth), banco PostgreSQL, tempo real (Realtime), arquivos (Storage) | Sim — URL e *anon key* do seu projeto |
| **OpenStreetMap** | Imagens (tiles) do mapa | Não |
| **Nominatim** | Converte endereço em coordenadas e o contrário | Não |
| **OSRM** | Calcula rota, distância e tempo entre dois pontos | Não |
| **Google Fonts** | Fontes *Space Grotesk* (títulos) e *Inter* (texto) | Não |

---

## 3. Arquitetura

```
┌─────────────────────────── Navegador / App instalado (PWA) ───────────────────────────┐
│                                                                                       │
│   Páginas (pages) ──► Componentes (components)                                        │
│        │                                                                              │
│        ├──► Contextos (Auth, Ride, Toast)  ← estado global                            │
│        ├──► Hooks (rota, corridas disponíveis, upload, online)                        │
│        └──► Serviços (services) ─────────────────────────────┐                        │
│                                                              │                        │
└──────────────────────────────────────────────────────────────┼────────────────────────┘
                                                               │
              ┌────────────────────────┬───────────────────────┴───────────┐
              ▼                        ▼                                   ▼
        Supabase                 Nominatim                              OSRM
  Auth · Postgres · RLS       endereço ↔ coordenadas              rota · distância · tempo
  Realtime · Storage
```

**Camadas do código**

1. **Páginas** (`src/pages`) — cada tela do app.
2. **Componentes** (`src/components`) — peças reutilizáveis (botão, cartão, mapa, chat…).
3. **Contextos** (`src/context`) — estado compartilhado por todo o app.
4. **Hooks** (`src/hooks`) — lógicas reaproveitáveis.
5. **Serviços** (`src/services`) — **único** lugar que fala com o Supabase e com as APIs de mapa. As telas nunca chamam o banco diretamente (exceto as listagens simples do painel administrativo).
6. **Config e utilitários** (`src/config`, `src/utils`) — regras fixas e funções auxiliares.

**Ordem dos provedores** (`src/main.jsx`):
`BrowserRouter → ToastProvider → AuthProvider → RideProvider → App`

---

## 4. Estrutura de pastas e arquivos

```
motonhao/
├── index.html                       página única; título, ícones e tema do app
├── vite.config.js                   configuração do Vite + PWA (manifesto, cache)
├── package.json                     dependências e comandos (dev, build, preview)
├── .env.example                     modelo das variáveis do Supabase
├── public/icons/                    ícones do app (192, 512, maskable, logo)
├── sql/
│   ├── schema.sql                   banco base: tabelas, gatilhos, RLS, realtime
│   ├── migration_avatars.sql        bucket de fotos de perfil
│   ├── migration_corrida_chat_perfil.sql   expiração, chat, mapa ao vivo, perfil público
│   └── migration_cadastro_documentos.sql   CPF, CNH, CRLV, bucket privado
└── src/
    ├── main.jsx                     ponto de entrada; monta provedores e importa CSS
    ├── App.jsx                      todas as rotas do app
    ├── lib/supabase.js              cria o cliente do Supabase
    ├── config/
    │   ├── routes.js                tela inicial de cada tipo de conta
    │   └── platformConfig.js        comissão (25%) e prazo do pedido (5 min)
    ├── context/
    │   ├── AuthContext.jsx          sessão, perfil, dados do motociclista, sair
    │   ├── RideContext.jsx          corrida ativa + escuta em tempo real
    │   └── ToastContext.jsx         avisos rápidos na tela
    ├── hooks/
    │   ├── useRideRoute.js          prepara origem, destino e traçado do mapa da corrida
    │   ├── useAvailableRides.js     lista de corridas abertas (motociclista)
    │   ├── useAvatarUpload.js       envio da foto de perfil
    │   └── useOnlineStatus.js       detecta se o aparelho está sem internet
    ├── services/
    │   ├── authService.js           cadastro, login, sair, recuperar senha
    │   ├── profileService.js        perfil próprio e perfil público
    │   ├── driverService.js         online/offline, aprovação, ganhos
    │   ├── rideService.js           preço, criar/aceitar/cancelar corrida, tempo real
    │   ├── chatService.js           mensagens da corrida
    │   ├── ratingService.js         avaliações
    │   ├── avatarService.js         corta/reduz a foto e envia ao Storage
    │   ├── documentService.js       CNH, moto e CRLV (bucket privado)
    │   └── osmService.js            GPS, Nominatim e OSRM
    ├── utils/cpf.js                 máscaras e validação de CPF, telefone e placa
    ├── layouts/
    │   ├── MainLayout.jsx           moldura de landing e telas de login/cadastro
    │   └── DashboardLayout.jsx      moldura do app (topo, botão Sair, menu inferior)
    ├── components/                  Avatar, AvatarPicker, PhotoField, Button, Input, Card,
    │                                Modal, Toast, Loading, EmptyState, Logo, Plate, Rating,
    │                                RatingList, RideCard, DriverCard, PassengerCard,
    │                                RideStatus, RideCountdown, RideChat, MapReal, PageHeader,
    │                                Navbar, BottomNavigation, SignOutButton, ProtectedRoute,
    │                                GuestRoute, InstallPWA, UpdatePrompt, OfflineBanner,
    │                                MapMock (antigo, não é mais usado)
    ├── pages/
    │   ├── Landing.jsx, NotFound.jsx, PublicProfile.jsx
    │   ├── auth/       Login, Register, ForgotPassword, ResetPassword, ProfilePhoto, DriverDocuments
    │   ├── passenger/  PassengerDashboard, ChooseRide, ConfirmRide, ActiveRide, RideHistory, Profile
    │   ├── driver/     DriverDashboard, ActiveRide, Earnings, Profile
    │   └── admin/      AdminDashboard, Users, Drivers, Rides
    └── styles/          variables, global, components, map, landing, auth, dashboard (CSS)
```

---

## 5. Tipos de usuário e mapa de telas

### 5.1 Os três perfis

| Perfil | O que faz |
|---|---|
| **Passageiro** (`passenger`) | Pede corridas, conversa com o motociclista, avalia, vê histórico |
| **Motociclista** (`driver`) | Fica online, aceita corridas, conduz a corrida, vê ganhos e avaliações |
| **Administrador** (`admin`) | Vê usuários, corridas e números; aprova ou reprova motociclistas |

O perfil é escolhido no cadastro (passageiro ou motociclista). O **administrador**
é criado manualmente pelo SQL (veja a seção 13).

### 5.2 Rotas

| Rota | Tela | Quem acessa |
|---|---|---|
| `/` | Landing (apresentação) | Todos |
| `/entrar` · `/cadastro` | Login e criação de conta | Só quem **não** está logado |
| `/esqueci-senha` · `/redefinir-senha` | Recuperação de senha | Todos |
| `/foto` | Foto de perfil obrigatória | Logado |
| `/documentos` | CNH, moto e CRLV | Motociclista |
| `/perfil/:id` | Perfil público de outra pessoa | Logado |
| `/passenger` | Início: mapa e pedido de corrida | Passageiro |
| `/passenger/escolher-corrida` | Escolha do tipo de corrida | Passageiro |
| `/passenger/confirmar` | Resumo e forma de pagamento | Passageiro |
| `/passenger/corrida-ativa` | Corrida em andamento | Passageiro |
| `/passenger/rides` | Histórico | Passageiro |
| `/passenger/profile` | Meu perfil | Passageiro |
| `/driver` | Início: online/offline e corridas disponíveis | Motociclista |
| `/driver/corrida-ativa` | Corrida em andamento | Motociclista |
| `/driver/earnings` | Ganhos | Motociclista |
| `/driver/profile` | Meu perfil e avaliações recebidas | Motociclista |
| `/admin` | Painel com números | Administrador |
| `/admin/usuarios` · `/admin/motociclistas` · `/admin/corridas` | Listas | Administrador |
| `*` | Página não encontrada | Todos |

### 5.3 Proteção das rotas

- **`GuestRoute`** — se a pessoa já está logada, manda direto para a tela inicial do perfil dela.
- **`ProtectedRoute`** — exige login e, quando `allowedRoles` é informado, confere o perfil. Além disso aplica, nesta ordem:
  1. **Foto obrigatória:** passageiro e motociclista sem foto vão para `/foto`.
  2. **Documentos do motociclista:** sem CNH, foto da moto e CRLV, vai para `/documentos`.
- Ao trocar de perfil errado (ex.: passageiro tentando abrir `/admin`), a pessoa é redirecionada para a tela inicial do próprio perfil (`homeRouteFor`).

---

## 6. Como cada funcionalidade funciona

### 6.1 Cadastro e login

1. Em `/cadastro` a pessoa escolhe **Passageiro** ou **Motociclista** e preenche os dados.
2. O app valida na tela: nome e sobrenome, **CPF** (pelos dígitos verificadores, `utils/cpf.js`), telefone com DDD, senha (mín. 6 caracteres) e, para motociclistas, marca, modelo, ano (1970 até o ano seguinte) e placa de 7 caracteres. CPF, telefone e placa são formatados enquanto se digita.
3. `authService.signUp` verifica se a **placa** já existe e chama `supabase.auth.signUp`, enviando todos os dados como *metadata*.
4. No banco, o gatilho `handle_new_user` cria automaticamente o registro em `profiles` (e em `drivers`, se for motociclista) com base nessa metadata.
5. Erros de placa ou CPF duplicados viram mensagens em português.
6. Depois do login, o `AuthContext` carrega o perfil e o motociclista; as rotas decidem para onde enviar a pessoa.

A sessão fica salva no navegador (`persistSession`) e o token é renovado sozinho.
Há também **recuperar senha** por e-mail (`/esqueci-senha` → link → `/redefinir-senha`).

### 6.2 Foto de perfil obrigatória

- Logo após o login, quem não tem foto cai em `/foto`.
- A imagem é **cortada em quadrado e reduzida para 512×512 JPEG** no próprio navegador (`fileToSquareBlob`). Isso deixa a foto leve (~50–90 KB), corrige a rotação de fotos de celular e remove dados de localização (EXIF).
- O arquivo vai para o bucket público `avatars`, em `avatars/<id-do-usuário>/avatar.jpg`, e a URL é gravada em `profiles.avatar_url` (com `?v=<hora>` para furar o cache quando a foto é trocada).

### 6.3 Documentos do motociclista

- Em `/documentos`: **CNH**, **foto da moto** e **CRLV**, com botões "Tirar foto" (câmera) e "Galeria".
- As fotos são reduzidas (lado maior de até 1400 px, mantendo a proporção — não se corta documento).
- Vão para o bucket **privado** `documents`, em `<id-do-usuário>/<tipo>.jpg`. No banco fica **só o caminho** do arquivo.
- Para visualizar, gera-se um **link temporário** (`createSignedUrl`) — 1 hora para o dono, 2 minutos quando o administrador abre um documento.
- Só o dono e o administrador têm acesso.

### 6.4 Verificação pelo administrador

- Em `/admin/motociclistas` o administrador vê CPF, moto, placa, documentos, nota e situação, e pode **Aprovar** ou **Reprovar** (com motivo opcional).
- Situações: `pending` (em análise), `approved`, `rejected`.
- O motociclista em análise ou reprovado vê uma tela explicativa no lugar do painel e **não pode ficar online**.
- Por padrão, novos motociclistas já entram **aprovados** (para não travar os testes). Para exigir aprovação, rode no SQL:
  `alter table public.drivers alter column verification_status set default 'pending';`

### 6.5 Pedido de corrida (passageiro)

**Tela inicial `/passenger`**
1. Ao abrir, o app fecha pedidos antigos vencidos e verifica se já existe corrida ativa; se existir, leva direto para ela.
2. Tenta o **GPS** do aparelho. Se falhar, usa a última posição conhecida (guardada no `localStorage`). Se nada funcionar, o passageiro pode **tocar no mapa** ou **buscar a cidade**.
3. O endereço da posição é descoberto por geocodificação reversa (Nominatim).
4. O passageiro informa origem (opcional — usa a localização atual) e destino, cada um com número.

**Tela `/passenger/escolher-corrida`**
1. Os endereços viram coordenadas (Nominatim), limitados a ~20 km ao redor do passageiro, para não achar uma rua homônima em outra cidade.
2. O **OSRM** calcula rota, distância e tempo, e o traçado aparece no mapa.
3. Os pinos de origem e destino podem ser **arrastados** para corrigir a posição; a rota e os preços são recalculados na hora.
4. Aparecem as opções de corrida (veja a seção 9.1). Se o mapa falhar, o app mostra uma **estimativa aproximada** em vez de travar.
5. O cartão **"Barconhão para o Saulo"** aparece logo abaixo das opções. É um cartão só de texto (🍺): não tem preço, não é clicável e não gera corrida.

**Tela `/passenger/confirmar`**
- Resumo (origem, destino, distância, tempo, preço) e forma de pagamento: **Dinheiro, Pix ou Cartão**.
- Ao confirmar, `createRide` grava a corrida com status `searching`, coordenadas e o prazo de expiração.

### 6.6 Aceite da corrida (motociclista)

1. Em `/driver`, o motociclista aprovado aperta **Ficar online** (`drivers.is_online`).
2. `useAvailableRides` carrega as corridas em `searching` e passa a escutar **novas corridas em tempo real** (Supabase Realtime, sem ficar consultando o banco toda hora).
3. A lista tira sozinha o que já venceu (a cada 10 s) e é recarregada a cada 60 s.
4. Ao aceitar, `acceptRide` faz um *update* condicional (`status = searching` **e** prazo válido). Se outro motociclista aceitou primeiro, a atualização não encontra a corrida e o app avisa: "Essa corrida já foi aceita por outro motociclista".
5. O motociclista mostra **a sua parte** do valor (75%), nunca o valor total.

### 6.7 Corrida em andamento

**Estados da corrida**

```
searching ──► accepted ──► driver_arriving ──► in_progress ──► completed
    │             │               │
    └─────────────┴───────────────┴──► cancelled
```

| Estado | Significado | Quem muda |
|---|---|---|
| `searching` | Procurando motociclista | Criada pelo passageiro |
| `accepted` | Motociclista encontrado | Motociclista aceita |
| `driver_arriving` | Motociclista no local de embarque | Motociclista ("Cheguei ao local de embarque") |
| `in_progress` | Em viagem | Motociclista ("Iniciar viagem") |
| `completed` | Finalizada | Motociclista ("Finalizar corrida") |
| `cancelled` | Cancelada | Passageiro (enquanto procura ou depois de aceita), motociclista (antes de iniciar a viagem) ou pelo fim do prazo |

**Como a tela se mantém atualizada**
- `RideContext.watchRide` busca a corrida completa (com motociclista e passageiro) e assina as mudanças daquela corrida (`ride-<id>`). A cada mudança, busca a versão atualizada.
- Passageiro e motociclista veem o mesmo status em tempo real, pelo componente `RideStatus`.

**Mapa ao vivo**
- `useRideRoute` usa as coordenadas gravadas na corrida. Corridas antigas sem coordenadas são geocodificadas pelo texto do endereço na hora.
- Durante a corrida, o app do motociclista lê o GPS continuamente (`watchPosition`) e envia a posição para `rides.driver_lat/driver_lng` **no máximo a cada 8 segundos**. O passageiro vê a 🏍️ se mexendo no mapa.
- Se o motociclista negar o GPS, a corrida segue normal, só sem a moto no mapa.

### 6.8 Expiração automática do pedido

- Todo pedido nasce com `expires_at = agora + 5 minutos`.
- O passageiro vê um **contador regressivo** (`RideCountdown`). Ao chegar a zero, o app cancela o pedido.
- No banco, `expire_stale_rides()` cancela todos os pedidos vencidos; é chamada sempre que o painel do passageiro ou do motociclista carrega — assim nada fica aberto mesmo se o passageiro fechar o app.
- O gatilho `prevent_expired_accept` **impede o aceite** de uma corrida vencida, mesmo que dois cliques aconteçam ao mesmo tempo.
- Opcional: agendar a limpeza a cada minuto com `pg_cron`.

### 6.9 Chat da corrida

- Aparece nas duas telas enquanto a corrida está `accepted`, `driver_arriving` ou `in_progress`.
- **Frases prontas** por perfil (ex.: "Estou a caminho", "Cheguei, estou na frente", "Já estou descendo") e campo livre de até 500 caracteres.
- Mensagens salvas em `ride_messages` e entregues em tempo real (canal `ride-chat-<id>`). A mensagem enviada aparece na hora, sem esperar a volta do Realtime.
- Só o passageiro e o motociclista **daquela** corrida (e o administrador) leem e escrevem — regra no banco (RLS).

### 6.10 Avaliação

- Quando a corrida vira `completed`, abre uma janela para o passageiro dar **1 a 5 estrelas** e um **comentário**.
- Salva em `ratings` (uma avaliação por corrida). O gatilho `handle_new_rating` **recalcula a média** do motociclista automaticamente.
- O comentário aparece no perfil do motociclista.

### 6.11 Perfil público

- Página `/perfil/:id`: foto, nome, tempo de casa, dados da moto, placa, nota média, total de corridas e **lista das avaliações escritas**.
- Acessível clicando no cartão do motociclista, do passageiro ou em qualquer corrida do histórico.
- Os dados vêm das funções `public_profile()` e `driver_ratings()`, que expõem **só o necessário** — a tabela `profiles` continua fechada.
- O motociclista também vê as próprias avaliações em "Meu perfil".

### 6.12 Ganhos do motociclista

- `getEarnings` soma as corridas `completed` do motociclista, sempre aplicando **75%** do valor.
- Mostra: hoje, esta semana, total de corridas, média por corrida e um gráfico de barras dos últimos 7 dias com corridas.

### 6.13 Painel administrativo

- **Dashboard:** usuários, motociclistas, corridas totais, em andamento, finalizadas, canceladas, **faturamento bruto** e **receita líquida da plataforma** (25%).
- **Usuários:** nome, e-mail, telefone, perfil e data de criação.
- **Motociclistas:** documentos, verificação, aprovar/reprovar.
- **Corridas:** últimas 100, com passageiro, motociclista, trajeto, valor e status.

### 6.14 Botão Sair e navegação

- O botão **Sair** fica no topo de todas as telas do app (e nas telas de foto e documentos).
- Para o "voltar" não precisar ser apertado várias vezes, a tela de escolha sai do histórico (`replace: true`) e cada tela interna tem um "← Voltar" apontando para uma **tela-mãe fixa**.
- Menu inferior: passageiro (Início, Corridas, Perfil) e motociclista (Início, Ganhos, Perfil). O administrador não usa o menu inferior.

---

## 7. Banco de dados (Supabase)

### 7.1 Ordem para montar o banco

1. `sql/schema.sql` — base
2. `sql/migration_avatars.sql` — fotos de perfil
3. `sql/migration_corrida_chat_perfil.sql` — expiração, chat, mapa ao vivo, perfil público, verificação
4. `sql/migration_cadastro_documentos.sql` — CPF, documentos, bucket privado

Todos podem ser executados de novo sem quebrar nada (`if not exists` / `or replace`).

### 7.2 Tipos (enums)

| Tipo | Valores |
|---|---|
| `user_role` | `passenger`, `driver`, `admin` |
| `ride_type` | `economic`, `standard`, `fast` |
| `ride_status` | `searching`, `accepted`, `driver_arriving`, `in_progress`, `completed`, `cancelled` |
| `payment_method` | `cash`, `pix`, `card` |
| `payment_status` | `pending`, `paid`, `failed`, `refunded` |
| `driver_verification` | `pending`, `approved`, `rejected` |

### 7.3 Tabelas

**`profiles`** — uma linha por usuário (ligada a `auth.users`)
`id`, `full_name`, `email`, `phone`, `cpf` (único), `avatar_url`, `role`, `created_at`

**`drivers`** — dados do motociclista (1 por perfil)
`id`, `profile_id`, `motorcycle_brand/model/year/color`, `license_plate`, `rating` (padrão 5.00), `total_rides`, `is_online`, `verification_status`, `verification_note`, `cnh_photo_path`, `motorcycle_photo_path`, `crlv_photo_path`, `documents_submitted_at`, `created_at`

**`rides`** — corridas
`id`, `passenger_id`, `driver_id`, `origin`, `destination`, `distance`, `estimated_time`, `price`, `ride_type`, `status`, `payment_method`, `origin_lat/lng`, `destination_lat/lng`, `driver_lat/lng`, `driver_location_at`, `expires_at`, `created_at`, `started_at`, `completed_at`

**`ratings`** — avaliações (uma por corrida)
`id`, `ride_id`, `passenger_id`, `driver_id`, `rating` (1 a 5), `comment`, `created_at`

**`payments`** — pagamentos (registro de controle)
`id`, `ride_id`, `passenger_id`, `amount`, `method`, `status`, `created_at`

**`ride_messages`** — chat
`id`, `ride_id`, `sender_id`, `body` (1 a 500 caracteres), `created_at`

### 7.4 Gatilhos e funções

| Nome | Quando dispara | O que faz |
|---|---|---|
| `handle_new_user` | Ao criar usuário no Auth | Cria `profiles` (com CPF) e, se motociclista, `drivers` |
| `handle_new_ride` | Ao criar corrida | Cria o registro em `payments` como `pending` |
| `handle_ride_completed` | Ao atualizar corrida | Em `in_progress` grava `started_at`; em `completed` grava `completed_at` e soma 1 em `total_rides` |
| `handle_payment_on_completion` | Ao atualizar corrida | `completed` → pagamento `paid`; `cancelled` → `refunded` |
| `handle_new_rating` | Ao criar avaliação | Recalcula a nota média do motociclista |
| `prevent_expired_accept` | Ao atualizar corrida | Bloqueia aceitar corrida vencida |
| `expire_stale_rides()` | Chamada pelo app | Cancela corridas `searching` com prazo vencido |
| `public_profile(uuid)` | Chamada pelo app | Devolve os dados públicos de um usuário |
| `driver_ratings(uuid)` | Chamada pelo app | Devolve as avaliações escritas (até 100) com nome e foto de quem escreveu |
| `is_admin()` / `current_driver_id()` | Usadas nas políticas | Identificam o usuário logado |

### 7.5 Segurança por linha (RLS)

Todas as tabelas têm RLS ativado. Resumo das regras:

| Tabela | Quem lê | Quem escreve |
|---|---|---|
| `profiles` | O próprio, o administrador e quem está ligado a ele por uma corrida | O próprio ou o administrador |
| `drivers` | Qualquer usuário logado | O próprio motociclista ou o administrador |
| `rides` | Passageiro da corrida, motociclista da corrida, motociclistas (corridas em `searching`) e administrador | Passageiro cria; passageiro/motociclista/administrador atualizam; motociclista pode aceitar corrida aberta |
| `ratings` | Passageiro, motociclista avaliado e administrador | Passageiro da corrida |
| `payments` | Passageiro, motociclista da corrida e administrador | Passageiro ou administrador |
| `ride_messages` | Passageiro e motociclista da corrida, e administrador | Só quem está na corrida, e apenas como si mesmo |

### 7.6 Storage (arquivos)

| Bucket | Acesso | Limite | Tipos | Conteúdo |
|---|---|---|---|---|
| `avatars` | **Público** para leitura | 2 MB | JPEG, PNG, WebP | Foto de perfil |
| `documents` | **Privado** (dono e administrador) | 5 MB | JPEG, PNG, WebP | CNH, foto da moto, CRLV |

Cada usuário só escreve dentro da **própria pasta** (`<id-do-usuário>/…`).

### 7.7 Tempo real (Realtime)

Tabelas publicadas: `rides`, `drivers`, `ride_messages`.

| Canal | Quem escuta | O que recebe |
|---|---|---|
| `ride-<id>` | Passageiro e motociclista da corrida | Mudanças de status, posição da moto etc. |
| `rides-searching` | Motociclistas online | Novos pedidos de corrida |
| `ride-chat-<id>` | Passageiro e motociclista da corrida | Novas mensagens |

---

## 8. Serviços de mapa (OpenStreetMap)

Tudo em `src/services/osmService.js`, sem chave de API.

| Função | O que faz | Serviço |
|---|---|---|
| `getCurrentPosition` | Posição do aparelho (GPS) | API do navegador |
| `saveLastKnownLocation` / `getLastKnownLocation` | Guarda a última posição para o mapa não abrir vazio | `localStorage` |
| `getReferenceLocation` | GPS, ou a última posição conhecida se o GPS falhar | — |
| `reverseGeocode` | Coordenadas → endereço | Nominatim |
| `geocodeAddress` | Endereço → coordenadas (limitado a ~20 km de um ponto, só Brasil) | Nominatim |
| `getRoute` | Distância (km), tempo (min) e traçado da rota | OSRM |

**Componente `MapReal`** (Leaflet): mostra 📍 origem, 🏁 destino, 🏍️ moto ao vivo, ponto azul da posição atual e a rota em laranja. Pinos podem ser arrastados e o mapa pode ser tocado para marcar a posição.

> O GPS do navegador só funciona em **HTTPS** (ou em `localhost`).

---

## 9. Regras de negócio

### 9.1 Preço e tempo

Constantes em `src/services/rideService.js`:

```
preço  = 4,50 + distância(km) × 2,35 × multiplicador
tempo  = distância ÷ velocidade × 60   (mínimo de 3 minutos)
```

| Opção | Nome no app | Multiplicador | Velocidade média |
|---|---|---|---|
| `economic` | Motonhão Econômico | 0,85 | 28 km/h |
| `standard` | Motonhão | 1,00 | 34 km/h |
| `fast` | Motonhão Rápido | 1,35 | 42 km/h |

Se o mapa não conseguir calcular a rota, `estimateRide` gera uma distância simulada
(de 1,2 a ~13 km) a partir do texto digitado, só para o app continuar funcionando.

### 9.2 Comissão

Em `src/config/platformConfig.js`:

- `PLATFORM_COMMISSION_RATE = 0.25` → a plataforma fica com **25%**.
- O motociclista recebe **75%** (`getDriverShare`).
- Exemplo: corrida de R$ 16,25 → motociclista R$ 12,19 e plataforma R$ 4,06.

Alterar esse número atualiza o app inteiro.

### 9.3 Prazo do pedido

`RIDE_SEARCH_TIMEOUT_MINUTES = 5` (mesmo arquivo). Sem aceite em 5 minutos, o pedido é cancelado.

---

## 10. PWA (app instalável)

Configurado em `vite.config.js` com `vite-plugin-pwa`.

- **Manifesto:** nome "Motonhão", tema escuro (`#0A0A0A`), modo `standalone`, orientação retrato, ícones 192, 512 e *maskable*.
- **Service worker** (Workbox): guarda os arquivos estáticos em cache. Chamadas ao Supabase usam **`NetworkOnly`** — dados nunca vêm de cache antigo.
- **`InstallPWA`:** botão "Instalar Motonhão" (Chrome/Android/desktop). No iOS, instala-se por Compartilhar → "Adicionar à Tela de Início".
- **`UpdatePrompt`:** avisa "Nova versão disponível" e ativa a atualização em segundo plano, sem recarregar a página. Verifica atualizações de hora em hora.
- **`OfflineBanner`:** aviso no topo quando o aparelho está sem internet. Login, cadastro, corridas e tempo real exigem conexão.

---

## 11. Segurança

- **Sem chaves no código:** URL e chave do Supabase vêm de variáveis de ambiente (`.env`, ignorado pelo Git). A chave usada é a **anon**, pensada para ficar no navegador; quem protege os dados é o **RLS**.
- **Regras no banco:** mesmo que alguém altere o app no navegador, o banco recusa o que não é permitido.
- **Documentos sensíveis:** CNH e CRLV em bucket **privado**, com link temporário.
- **Dados públicos mínimos:** perfis de outras pessoas só passam por funções que devolvem os campos necessários.
- **CPF:** validado pelos dígitos e único por conta.
- **Placa:** normalizada e única por conta.
- **Aceite de corrida:** atualização condicional + gatilho impedem dois aceites e aceite de pedido vencido.
- **Fotos:** reduzidas no navegador e sem dados de localização (EXIF).

---

## 12. Evolução do projeto

O app foi construído em etapas (a ordem foi reconstruída a partir do código e do README anterior, então é aproximada):

1. **Base do app** — React + Vite + Supabase: cadastro e login, três perfis, pedido e aceite de corrida em tempo real, status da corrida, avaliação, histórico, ganhos, painel administrativo e PWA.
2. **Mapa real** — troca da simulação por OpenStreetMap: GPS, busca de endereço (Nominatim), rota, distância e tempo reais (OSRM), pinos arrastáveis.
3. **Comissão da plataforma** — 25% para a plataforma, 75% para o motociclista, refletido em ganhos, cartões de corrida e painel administrativo.
4. **Fotos de perfil** — foto obrigatória para passageiros e motociclistas, com recorte e compressão automáticos.
5. **Expiração, chat, mapa na corrida e perfil público** — pedido cancelado em 5 minutos, chat com frases prontas, mapa real com a moto ao vivo, avaliações escritas e `/perfil/:id`.
6. **Cadastro completo do motociclista** — CPF, CNH, foto da moto e CRLV em bucket privado; verificação pelo administrador; botão **Sair** em todas as telas; navegação de "voltar" mais curta.
7. **Ajuste final** — cartão de texto **"Barconhão para o Saulo"** na escolha da corrida; novo README e esta documentação.

---

## 13. Instalação e execução

```bash
npm install                # dependências
cp .env.example .env       # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                # http://localhost:5173
npm run build              # versão final na pasta dist
npm run preview            # testa a versão final (ideal para o PWA)
```

**Primeiro administrador**
1. Cadastre-se normalmente pelo app.
2. No SQL Editor do Supabase:
   ```sql
   update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
   ```
3. Entre de novo no app: essa conta agora abre `/admin`.

**Confirmação de e-mail:** em *Authentication → Providers → Email* do Supabase dá para
desativar "Confirm email" durante os testes.

**Testar o PWA:** rode `npm run build && npm run preview`, abra no Chrome e use o botão
de instalar. Para ver o aviso offline: DevTools → Network → Offline.

---

## 14. Limitações conhecidas e próximos passos

Pontos honestos para quem for evoluir o projeto:

- **Pagamento simulado:** a tabela `payments` só registra o método e o status; não há cobrança real (Pix/cartão).
- **Preço calculado no navegador:** o valor é calculado no app e gravado como veio. Para produção, o ideal é recalcular ou validar no servidor (função do banco ou Edge Function).
- **Serviços públicos gratuitos:** Nominatim e OSRM públicos têm limites de uso e não são recomendados para grande volume; em produção, use instâncias próprias ou um provedor pago.
- **Cancelamento sem regras:** o passageiro cancela até a corrida ser aceita e o motociclista até `driver_arriving`; depois de iniciada, a corrida segue até ser finalizada. Não há taxa nem punição por cancelar.
- **Aprovação de motociclistas:** o padrão atual é aprovar automaticamente; para uso real, ative o padrão `pending`.
- **Limpeza agendada:** a expiração de pedidos roda quando alguém abre o app; para rodar sozinha, agende com `pg_cron`.
- **Arquivo legado:** `src/components/MapMock.jsx` não é mais usado e pode ser removido.
- **Ideias futuras:** notificações push, pagamento integrado, cancelamento com regras, ranking de motociclistas, testes automatizados e publicação (deploy) em HTTPS.

### O cartão "Barconhão para o Saulo"

Fica em `src/pages/passenger/ChooseRide.jsx`, logo depois da lista de opções, com o
estilo `.ride-option-static` em `src/styles/components.css`. É só texto: não tem
preço, não é clicável e não cria corrida (não existe como `ride_type` no banco).
Para transformá-lo em uma opção real, seria preciso adicionar o valor ao enum
`ride_type` no SQL, incluí-lo em `RIDE_TYPE_CONFIG` (`rideService.js`) e em
`RIDE_TYPE_LABEL` (`RideCard.jsx`).
