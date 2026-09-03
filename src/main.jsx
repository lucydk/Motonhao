import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { RideProvider } from './context/RideContext'
import { ToastProvider } from './context/ToastContext'
import './styles/variables.css'
import './styles/global.css'
import './styles/components.css'
import './styles/landing.css'
import './styles/auth.css'
import './styles/dashboard.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <RideProvider>
            <App />
          </RideProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)
