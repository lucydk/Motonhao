import { useEffect, useRef, useState } from 'react'
import { getRideMessages, sendRideMessage, subscribeToRideMessages } from '../services/chatService'
import Avatar from './Avatar'

// Frases prontas: na prática 90% do chat de corrida é isso, e num celular
// em movimento tocar num botão é muito mais rápido do que digitar.
const QUICK_MESSAGES = {
  passenger: ['Já estou descendo', 'Pode esperar 2 min?', 'Estou no portão', 'Ok, obrigado!'],
  driver: ['Estou a caminho', 'Cheguei, estou na frente', 'Chego em 2 min', 'Ok!']
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// rideId: corrida atual · currentUserId: quem está olhando a tela
// role: 'passenger' | 'driver' (só muda as frases prontas)
// otherName: nome de quem está do outro lado · disabled: chat fechado
export default function RideChat({ rideId, currentUserId, role = 'passenger', otherName, disabled = false }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(true)
  const listRef = useRef(null)

  useEffect(() => {
    if (!rideId) return undefined
    let cancelled = false

    getRideMessages(rideId)
      .then((data) => { if (!cancelled) setMessages(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })

    const unsubscribe = subscribeToRideMessages(rideId, (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [rideId])

  // Rola sempre para a mensagem mais recente
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  async function handleSend(body) {
    const content = (body ?? text).trim()
    if (!content || sending || disabled) return

    setSending(true)
    setError('')
    try {
      const saved = await sendRideMessage({ rideId, senderId: currentUserId, body: content })
      // Mostra na hora, sem esperar o realtime voltar
      if (saved) {
        setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]))
      }
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const unreadFromOther = messages.filter((m) => m.sender_id !== currentUserId).length

  return (
    <section className="ride-chat">
      <button type="button" className="ride-chat-header" onClick={() => setOpen((v) => !v)}>
        <span>💬 Conversa {otherName ? `com ${otherName.split(' ')[0]}` : 'da corrida'}</span>
        <span className="ride-chat-toggle">
          {!open && unreadFromOther ? <span className="ride-chat-badge">{unreadFromOther}</span> : null}
          {open ? 'ocultar' : 'abrir'}
        </span>
      </button>

      {open ? (
        <>
          <div className="ride-chat-list" ref={listRef}>
            {messages.length === 0 ? (
              <p className="ride-chat-empty">
                Nenhuma mensagem ainda. Use um dos botões abaixo para avisar rapidinho.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === currentUserId
                return (
                  <div key={m.id} className={`ride-chat-msg ${mine ? 'is-mine' : ''}`}>
                    {!mine ? (
                      <Avatar src={m.sender?.avatar_url} name={m.sender?.full_name || otherName || ''} size={26} />
                    ) : null}
                    <div className="ride-chat-bubble">
                      <span>{m.body}</span>
                      <time>{formatTime(m.created_at)}</time>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {disabled ? (
            <p className="ride-chat-empty">A conversa desta corrida foi encerrada.</p>
          ) : (
            <>
              <div className="ride-chat-quick">
                {(QUICK_MESSAGES[role] || QUICK_MESSAGES.passenger).map((q) => (
                  <button key={q} type="button" className="ride-chat-chip" disabled={sending} onClick={() => handleSend(q)}>
                    {q}
                  </button>
                ))}
              </div>

              <form
                className="ride-chat-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
              >
                <input
                  className="ride-chat-input"
                  placeholder="Escrever mensagem…"
                  value={text}
                  maxLength={500}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="submit" className="ride-chat-send" disabled={sending || !text.trim()}>
                  Enviar
                </button>
              </form>
            </>
          )}

          {error ? <p className="form-error">{error}</p> : null}
        </>
      ) : null}
    </section>
  )
}
