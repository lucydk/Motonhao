// ---------------------------------------------------------------
// CPF: máscara enquanto a pessoa digita e validação dos dígitos
// verificadores (o mesmo cálculo que a Receita usa).
// ---------------------------------------------------------------

export function onlyDigits(value = '') {
  return value.replace(/\D/g, '')
}

export function formatCpf(value = '') {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

export function isValidCpf(value = '') {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // 111.111.111-11 e afins

  for (const length of [9, 10]) {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i)
    }
    const rest = (sum * 10) % 11
    const digit = rest === 10 ? 0 : rest
    if (digit !== Number(cpf[length])) return false
  }

  return true
}

export function formatPhone(value = '') {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatPlate(value = '') {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7)
}
