import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import DashboardLayout from './layouts/DashboardLayout'
import Configuration from './pages/Configuration'
import RunningTrades from './pages/RunningTrades'
import TradeHistory from './pages/TradeHistory'
import Performance from './pages/Performance'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<RunningTrades />} />
          <Route path="history" element={<TradeHistory />} />
          <Route path="performance" element={<Performance />} />
          <Route path="configuration" element={<Configuration />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App