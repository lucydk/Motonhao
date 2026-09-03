import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

import PassengerDashboard from './pages/passenger/PassengerDashboard'
import ChooseRide from './pages/passenger/ChooseRide'
import ConfirmRide from './pages/passenger/ConfirmRide'
import PassengerActiveRide from './pages/passenger/ActiveRide'
import RideHistory from './pages/passenger/RideHistory'
import PassengerProfile from './pages/passenger/Profile'

import DriverDashboard from './pages/driver/DriverDashboard'
import DriverActiveRide from './pages/driver/ActiveRide'
import Earnings from './pages/driver/Earnings'
import DriverProfile from './pages/driver/Profile'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/Users'
import AdminDrivers from './pages/admin/Drivers'
import AdminRides from './pages/admin/Rides'

import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['passenger']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/passenger" element={<PassengerDashboard />} />
        <Route path="/passenger/escolher-corrida" element={<ChooseRide />} />
        <Route path="/passenger/confirmar" element={<ConfirmRide />} />
        <Route path="/passenger/corrida-ativa" element={<PassengerActiveRide />} />
        <Route path="/passenger/rides" element={<RideHistory />} />
        <Route path="/passenger/profile" element={<PassengerProfile />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/corrida-ativa" element={<DriverActiveRide />} />
        <Route path="/driver/earnings" element={<Earnings />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/usuarios" element={<AdminUsers />} />
        <Route path="/admin/motociclistas" element={<AdminDrivers />} />
        <Route path="/admin/corridas" element={<AdminRides />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
