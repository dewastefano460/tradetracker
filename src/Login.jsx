import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) alert(error.message)
        setLoading(false)
    }

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) alert(error.message)
        else alert('Cek email kamu untuk konfirmasi pendaftaran!')
        setLoading(false)
    }

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial' }}>
            {/* Bagian Biru (Kiri) */}
            <div style={{ flex: 1, backgroundColor: '#1e40af', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <h2>Professional Trading Analytics</h2>
                <p>Securely access your trading journal and monitor performance.</p>
            </div>

            {/* Bagian Form (Kanan) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px' }}>
                <h1>Welcome Back</h1>
                <p>Please sign in to your account.</p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        required
                    />
                    <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {loading ? 'Loading...' : 'Sign In'}
                    </button>
                    <button type="button" onClick={handleSignUp} style={{ backgroundColor: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer' }}>
                        Don't have an account? Create one
                    </button>
                </form>
            </div>
        </div>
    )
}