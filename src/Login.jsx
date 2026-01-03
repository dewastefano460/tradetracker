import { useState } from 'react'
import { supabase } from './supabaseClient'
import { BarChart2, CheckCircle2 } from 'lucide-react'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        setLoading(false)
    }

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) alert(error.message)
        else alert('Cek email kamu untuk konfirmasi pendaftaran!')
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen font-sans bg-surface">
            {/* Left Side - Brand Area */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#1e3e94] to-[#0f172a] flex-col justify-center items-center text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
                <div className="relative z-10 text-center max-w-md">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-xl">
                        <BarChart2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">Professional Trading Analytics</h1>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        Securely access your trading journal, monitor performance metrics, and analyze your edge with TradeCore's institutional-grade platform.
                    </p>
                </div>
                <div className="absolute bottom-8 text-blue-200 text-sm">
                    © 2026 TradeCore Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form Area */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12 bg-surface">
                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 lg:hidden mb-8">
                            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold">T</div>
                            <span className="font-bold text-xl text-brand-dark">TradeCore</span>
                        </div>
                        <h2 className="text-3xl font-bold text-text-primary tracking-tight">
                            {isSignUp ? "Create an account" : "Welcome Back"}
                        </h2>
                        <p className="text-text-secondary">
                            {isSignUp ? "Enter your details to get started." : "Please sign in to your account."}
                        </p>
                    </div>

                    <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-400 text-text-primary bg-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-400 text-text-primary bg-white"
                                    required
                                />
                            </div>
                        </div>

                        {!isSignUp && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input id="remember" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-text-secondary">Remember me</label>
                                </div>
                                <button type="button" className="text-sm font-medium text-brand-blue hover:text-blue-700">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-[#1e3e94] hover:bg-[#152c6b] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                isSignUp ? "Create Account" : "Sign In"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-text-secondary">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-medium text-brand-blue hover:text-blue-700 transition-colors"
                        >
                            {isSignUp ? "Sign In" : "Create an account"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}