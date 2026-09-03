import { Link } from 'react-router-dom'

const STEPS = [
  { n: '1', title: 'Informe seu destino', text: 'Digite de onde você está saindo e para onde quer ir.' },
  { n: '2', title: 'Escolha sua corrida', text: 'Econômico, padrão ou rápido — você decide o que combina com o momento.' },
  { n: '3', title: 'Encontre seu motociclista', text: 'Um motociclista cadastrado aceita sua corrida em segundos.' },
  { n: '4', title: 'Chegue ao seu destino', text: 'Acompanhe tudo em tempo real, do aceite até o desembarque.' }
]

const SAFETY = [
  { icon: '🪪', title: 'Motoristas cadastrados', text: 'Todo motociclista passa por cadastro com dados do veículo e da CNH.' },
  { icon: '⭐', title: 'Avaliações reais', text: 'Cada corrida é avaliada e a nota fica visível para os próximos passageiros.' },
  { icon: '🔎', title: 'Identificação clara', text: 'Você vê nome, foto, placa e modelo da moto antes de embarcar.' },
  { icon: '📍', title: 'Acompanhamento da corrida', text: 'O status é atualizado em tempo real, do aceite até a chegada.' }
]

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-text">
          <span className="hero-eyebrow">Transporte por moto</span>
          <h1>Sua corrida. <br />Do seu jeito.</h1>
          <p>Chegue onde precisa com rapidez, praticidade e segurança.</p>
          <div className="hero-actions">
            <Link to="/cadastro" className="btn btn-primary btn-lg">Pedir uma corrida</Link>
            <Link to="/cadastro" className="btn btn-outline btn-lg">Quero ser motociclista</Link>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 480 360" className="moto-illustration">
            <g className="speed-lines">
              <rect x="0" y="120" width="140" height="6" rx="3" />
              <rect x="0" y="150" width="90" height="6" rx="3" />
              <rect x="0" y="180" width="160" height="6" rx="3" />
            </g>
            <g transform="translate(120,90)">
              <circle cx="30" cy="190" r="42" className="wheel" />
              <circle cx="260" cy="190" r="42" className="wheel" />
              <path d="M30,190 L110,190 L150,110 L210,110 L260,190" className="frame" />
              <path d="M150,110 L150,60 L200,55" className="frame" />
              <rect x="90" y="150" width="70" height="20" rx="6" className="seat" />
              <circle cx="200" cy="55" r="10" className="lamp" />
            </g>
          </svg>
        </div>
      </section>

      <section className="steps-section" id="como-funciona">
        <h2>Como funciona</h2>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div className="step-card" key={step.n}>
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="safety-section" id="seguranca">
        <div className="safety-header">
          <h2>Segurança em primeiro lugar</h2>
          <p>Cada detalhe do Motonhão foi pensado para que você embarque com confiança.</p>
        </div>
        <div className="safety-grid">
          {SAFETY.map((item) => (
            <div className="safety-card" key={item.title}>
              <span className="safety-icon" aria-hidden="true">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="driver-cta" id="sobre">
        <div className="driver-cta-text">
          <h2>Transforme seu tempo em oportunidade.</h2>
          <p>Defina seus próprios horários, aceite as corridas que fizerem sentido para você e acompanhe seus ganhos em tempo real.</p>
          <Link to="/cadastro" className="btn btn-primary btn-lg">Seja um motociclista Motonhão</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Motonhão · Projeto acadêmico de transporte por motocicleta</span>
      </footer>
    </div>
  )
}
