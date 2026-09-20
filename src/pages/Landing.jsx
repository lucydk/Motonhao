import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homeRouteFor } from '../config/routes'

const STEPS = [
  {
    n: '1',
    title: 'Informe seu destino',
    text: 'Digite de onde você está saindo e para onde quer ir.'
  },
  {
    n: '2',
    title: 'Escolha sua corrida',
    text: 'Econômico, padrão ou rápido — você decide o que combina com o momento.'
  },
  {
    n: '3',
    title: 'Encontre seu motociclista',
    text: 'Um motociclista cadastrado aceita sua corrida em segundos.'
  },
  {
    n: '4',
    title: 'Chegue ao seu destino',
    text: 'Acompanhe tudo em tempo real, do aceite até o desembarque.'
  }
]

const SAFETY = [
  {
    icon: '🪪',
    title: 'Motoristas cadastrados',
    text: 'Todo motociclista passa por cadastro com dados do veículo e da CNH.'
  },
  {
    icon: '⭐',
    title: 'Avaliações reais',
    text: 'Cada corrida é avaliada e a nota fica visível para os próximos passageiros.'
  },
  {
    icon: '🔎',
    title: 'Identificação clara',
    text: 'Você vê nome, foto, placa e modelo da moto antes de embarcar.'
  },
  {
    icon: '📍',
    title: 'Acompanhamento da corrida',
    text: 'O status é atualizado em tempo real, do aceite até a chegada.'
  }
]

// Texto do botão principal quando a pessoa já está logada.
const LOGGED_IN_LABEL = {
  passenger: 'Pedir uma corrida',
  driver: 'Ver corridas disponíveis',
  admin: 'Abrir painel'
}

export default function Landing() {
  const { isAuthenticated, loading, role } = useAuth()
  const { hash } = useLocation()

  // Os links do menu (/#como-funciona etc.) só trocam o hash; o React Router
  // não rola a página sozinho, então fazemos isso aqui.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  // Já logado: o botão vai direto pro app (pedir corrida), sem passar pelo cadastro.
  const primaryTo = isAuthenticated ? homeRouteFor(role) : '/cadastro'
  const primaryLabel = isAuthenticated
    ? (LOGGED_IN_LABEL[role] || LOGGED_IN_LABEL.passenger)
    : 'Pedir uma corrida'

  return (
    <div className="landing">

      {/* HERO */}
      <section className="hero">

        <div className="hero-text">
          <span className="hero-eyebrow">
            Transporte por moto
          </span>

          <h1>
            Sua corrida.
            <br />
            Do seu jeito.
          </h1>

          <p>
            Chegue onde precisa com rapidez, praticidade e segurança.
          </p>

          {/* Enquanto a sessão carrega, mantém o espaço mas esconde os botões,
              pra não piscar "criar conta" pra quem já está logado. */}
          <div
            className="hero-actions"
            style={{ visibility: loading ? 'hidden' : 'visible' }}
          >
            <Link
              to={primaryTo}
              className="btn btn-primary btn-lg"
            >
              {primaryLabel}
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/cadastro"
                className="btn btn-outline btn-lg"
              >
                Quero ser motociclista
              </Link>
            ) : null}
          </div>
        </div>

        {/* LOGO GRANDE */}
        <div className="hero-art">
          <img
            src="/icons/logo.jpeg"
            alt="Motonhão"
            className="hero-logo"
          />
        </div>

      </section>

      {/* COMO FUNCIONA */}
      <section
        className="steps-section"
        id="como-funciona"
      >
        <h2>Como funciona</h2>

        <div className="steps-grid">
          {STEPS.map((step) => (
            <div
              className="step-card"
              key={step.n}
            >
              <span className="step-number">
                {step.n}
              </span>

              <h3>{step.title}</h3>

              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEGURANÇA */}
      <section
        className="safety-section"
        id="seguranca"
      >
        <div className="safety-header">
          <h2>Segurança em primeiro lugar</h2>

          <p>
            Cada detalhe do Motonhão foi pensado para
            que você embarque com confiança.
          </p>
        </div>

        <div className="safety-grid">
          {SAFETY.map((item) => (
            <div
              className="safety-card"
              key={item.title}
            >
              <span
                className="safety-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <h3>{item.title}</h3>

              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA MOTOCICLISTA */}
      <section
        className="driver-cta"
        id="sobre"
      >
        <div className="driver-cta-text">

          <h2>
            Transforme seu tempo em oportunidade.
          </h2>

          <p>
            Defina seus próprios horários, aceite as
            corridas que fizerem sentido para você e
            acompanhe seus ganhos em tempo real.
          </p>

          {!isAuthenticated ? (
            <Link
              to="/cadastro"
              className="btn btn-primary btn-lg"
            >
              Seja um motociclista Motonhão
            </Link>
          ) : null}

        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="landing-footer">
        <span>
          Motonhão · Projeto acadêmico de transporte por motocicleta
        </span>
      </footer>

    </div>
  )
}