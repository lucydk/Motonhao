# 🏍️ Motonhão

**Sua corrida. Do seu jeito.**

Motonhão é um aplicativo de corridas de moto que funciona direto no navegador e
pode ser instalado no celular (PWA). Passageiros pedem corridas, motociclistas
aceitam, e um administrador acompanha tudo.

---

## Como funciona

1. O **passageiro** informa o destino, escolhe o tipo de corrida (Econômico, Motonhão ou Rápido) e confirma o pagamento.
2. Os **motociclistas online** recebem o pedido na hora e um deles aceita.
3. O passageiro acompanha a moto no **mapa em tempo real** e pode **conversar** com o motociclista.
4. O motociclista avança a corrida: *a caminho → em viagem → finalizada*.
5. O passageiro **avalia** o motociclista com nota e comentário.
6. Se ninguém aceitar em **5 minutos**, o pedido é cancelado sozinho.

Existem três tipos de conta: **passageiro**, **motociclista** e **administrador**
(que aprova os cadastros dos motociclistas e vê os números da plataforma).

---

## Tecnologias

| Para quê | O que usamos |
|---|---|
| Interface | **React 18** + **JavaScript (JSX)** |
| Build e servidor de desenvolvimento | **Vite** |
| Navegação entre telas | **React Router** |
| Estilo | **CSS puro** |
| Login, banco de dados, tempo real e arquivos | **Supabase** (Auth, PostgreSQL, Realtime, Storage) |
| Regras do banco | **SQL** (PL/pgSQL) com **RLS** (segurança por linha) |
| Mapa | **Leaflet** + **OpenStreetMap** |
| Endereço → coordenadas | **Nominatim** |
| Rotas, distância e tempo | **OSRM** |
| App instalável e offline básico | **PWA** (`vite-plugin-pwa`) |

Não existe servidor próprio: o app conversa direto com o Supabase, e a segurança
fica nas regras do próprio banco.

---

## Como rodar

**1. Instale as dependências**
```bash
npm install
```

**2. Crie o projeto no Supabase** ([supabase.com](https://supabase.com)) e copie
a *Project URL* e a *anon key* em **Settings → API**.

**3. Configure as variáveis**
```bash
cp .env.example .env
```
Abra o `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

**4. Monte o banco.** No **SQL Editor** do Supabase, rode estes arquivos da pasta
`sql/`, nesta ordem:

1. `schema.sql`
2. `migration_avatars.sql`
3. `migration_corrida_chat_perfil.sql`
4. `migration_cadastro_documentos.sql`

**5. Inicie o app**
```bash
npm run dev
```
Abra `http://localhost:5173`.

**6. Crie o primeiro administrador.** Cadastre-se pelo app e, no SQL Editor, rode:
```sql
update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

Para gerar a versão final: `npm run build` (e `npm run preview` para testar).

---

## Estrutura do projeto

```
motonhao/
├── public/icons/     ícones do app instalável
├── sql/              banco de dados (tabelas, regras, segurança)
├── src/
│   ├── pages/        telas (auth, passenger, driver, admin)
│   ├── components/   peças reutilizáveis (botão, mapa, chat, cartões…)
│   ├── services/     conversa com Supabase, OpenStreetMap e OSRM
│   ├── context/      estado global (login, corrida ativa, avisos)
│   ├── hooks/        lógicas reaproveitáveis
│   ├── layouts/      molduras das telas
│   ├── config/       rotas e regras de negócio (comissão, prazo)
│   ├── styles/       CSS
│   └── utils/        CPF, telefone, placa
├── index.html
└── vite.config.js    configuração do Vite e do PWA
```

---

## Regras de negócio importantes

- **Comissão:** a plataforma fica com 25% de cada corrida; o motociclista recebe 75%.
- **Prazo do pedido:** 5 minutos para alguém aceitar.

Os dois valores ficam em `src/config/platformConfig.js`.


