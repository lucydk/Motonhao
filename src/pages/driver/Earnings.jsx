import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getEarnings } from '../../services/driverService'
import Card from '../../components/Card'
import Loading from '../../components/Loading'

export default function Earnings() {
  const { driver } = useAuth()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (driver) getEarnings(driver.id).then(setData)
  }, [driver])

  if (!data) return <Loading fullScreen label="Calculando seus ganhos…" />

  const days = Object.entries(data.byDay).sort().slice(-7)
  const maxValue = Math.max(1, ...days.map(([, v]) => v))

  return (
    <div className="page">
      <h1>Meus ganhos</h1>

      <div className="driver-stats">
        <Card className="stat-card"><span>Hoje</span><strong>R$ {data.today.toFixed(2)}</strong></Card>
        <Card className="stat-card"><span>Esta semana</span><strong>R$ {data.week.toFixed(2)}</strong></Card>
        <Card className="stat-card"><span>Corridas</span><strong>{data.ridesCount}</strong></Card>
        <Card className="stat-card"><span>Média/corrida</span><strong>R$ {data.average.toFixed(2)}</strong></Card>
      </div>

      <Card>
        <h2>Últimos dias</h2>
        {days.length === 0 ? (
          <p className="page-subtitle">Nenhuma corrida concluída ainda.</p>
        ) : (
          <div className="earnings-chart">
            {days.map(([day, value]) => (
              <div className="earnings-bar-wrap" key={day}>
                <div className="earnings-bar" style={{ height: `${Math.max(6, (value / maxValue) * 100)}%` }} />
                <span>{day.slice(8, 10)}/{day.slice(5, 7)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
