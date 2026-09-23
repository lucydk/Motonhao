// Regra de negócio: a plataforma fica com esse percentual do valor de cada
// corrida concluída; o restante é o que o motociclista recebe.
// Mude só esse número se a comissão mudar — todo o resto do app lê daqui.
export const PLATFORM_COMMISSION_RATE = 0.25

// Quanto a plataforma recebe de uma corrida
export function getPlatformShare(price) {
  return Number((Number(price) * PLATFORM_COMMISSION_RATE).toFixed(2))
}

// Quanto o motociclista recebe de uma corrida (o valor que ele deve ver)
export function getDriverShare(price) {
  return Number((Number(price) * (1 - PLATFORM_COMMISSION_RATE)).toFixed(2))
}

// Tempo máximo que um pedido de corrida fica "procurando motociclista".
// Passado esse prazo, a corrida se cancela sozinha (no app e no banco) em vez
// de ficar aberta por dias esperando alguém aceitar.
export const RIDE_SEARCH_TIMEOUT_MINUTES = 5

// Mesma coisa em milissegundos, pra usar direto nos contadores da tela.
export const RIDE_SEARCH_TIMEOUT_MS = RIDE_SEARCH_TIMEOUT_MINUTES * 60 * 1000
