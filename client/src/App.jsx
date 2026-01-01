import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import WorkerDashboard from './pages/WorkerDashboard.jsx'

function App() {
  function ProtectedRoute({ element, role }) {
    const token = localStorage.getItem('token')
    const user = (() => {
      try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
    })()

    if (!token) return <Navigate to="/" replace />
    if (role && user?.role !== role) return <Navigate to="/" replace />
    return element
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute role="admin" element={<AdminDashboard />} />} />
      <Route path="/worker" element={<ProtectedRoute role="worker" element={<WorkerDashboard />} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
