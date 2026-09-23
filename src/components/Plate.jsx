// Placa no estilo Mercosul (faixa azul + caracteres grandes), pra o passageiro
// bater o olho e conferir a moto que chegou.
function formatPlate(plate = '') {
  const clean = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  // Placa antiga (ABC1234) ganha o hífen; Mercosul (ABC1D23) fica como está.
  return /^[A-Z]{3}\d{4}$/.test(clean) ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean
}

export default function Plate({ value }) {
  if (!value) return null
  return (
    <span className="plate" aria-label={`Placa ${formatPlate(value)}`}>
      <span className="plate-band">BRASIL</span>
      <span className="plate-text">{formatPlate(value)}</span>
    </span>
  )
}
