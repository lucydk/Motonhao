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
