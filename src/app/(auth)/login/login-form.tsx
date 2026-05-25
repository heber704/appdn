'use client'
// src/app/(auth)/login/login-form.tsx
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Loader2, AlertCircle, Lock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_TENTATIVAS = 5

export function LoginForm() {
  const router = useRouter()
  const loginRef = useRef<HTMLInputElement>(null)
  const senhaRef = useRef<HTMLInputElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [tentativas, setTentativas] = useState(0)
  const [bloqueadoAte, setBloqueadoAte] = useState<Date | null>(null)
  const [tempoRestante, setTempoRestante] = useState(0)

  // Preenche login se veio da recuperação de senha
  useEffect(() => {
    const loginRecuperado = sessionStorage.getItem('loginRecuperado')
    if (loginRecuperado) {
      setLogin(loginRecuperado)
      sessionStorage.removeItem('loginRecuperado')
      senhaRef.current?.focus()
    } else {
      loginRef.current?.focus()
    }
  }, [])

  // Contador de bloqueio
  useEffect(() => {
    if (!bloqueadoAte) return
    const interval = setInterval(() => {
      const restante = Math.ceil((bloqueadoAte.getTime() - Date.now()) / 1000)
      if (restante <= 0) {
        setBloqueadoAte(null)
        setTempoRestante(0)
        setErro('')
        clearInterval(interval)
      } else {
        setTempoRestante(restante)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [bloqueadoAte])

  const registrarFalha = async (loginTentado: string) => {
    const novasTentativas = tentativas + 1
    setTentativas(novasTentativas)

    if (novasTentativas >= MAX_TENTATIVAS) {
      // Bloqueia no banco
      await fetch('/api/usuarios/bloquear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginTentado }),
      })
      const delay = 30
      setBloqueadoAte(new Date(Date.now() + delay * 1000))
      setTempoRestante(delay)
      setErro('Conta bloqueada por excesso de tentativas.')
      setTentativas(0)
    } else {
      const delay = novasTentativas * 2
      setBloqueadoAte(new Date(Date.now() + delay * 1000))
      setTempoRestante(delay)
      setErro(`Login ou senha inválidos. (${novasTentativas}/${MAX_TENTATIVAS})`)
    }
  }

  const handleSubmit = async () => {
    if (bloqueadoAte && Date.now() < bloqueadoAte.getTime()) {
      setErro(`Aguarde ${tempoRestante}s antes de tentar novamente.`)
      return
    }

    if (!login.trim() || !senha) {
      setErro('Preencha login e senha.')
      return
    }

    setLoading(true)
    setErro('')

    try {
      const result = await signIn('credentials', {
        login: login.trim(),
        senha,
        redirect: false,
      })

      if (result?.error === 'CONTA_INATIVA') {
        setErro('Conta inativa. Entre em contato com o administrador.')
        setLoading(false)
        return
      }

      if (result?.error) {
        await registrarFalha(login.trim())
        setLoading(false)
        return
      }

      if (result?.ok) {
        setTentativas(0)
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') {
      setLogin('')
      setSenha('')
      setErro('')
      loginRef.current?.focus()
    }
  }

  const bloqueado = bloqueadoAte !== null && Date.now() < bloqueadoAte.getTime()

  return (
    <div className="space-y-4">
      {/* Campo login */}
      <div>
        <label className="label">Login</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            ref={loginRef}
            type="text"
            value={login}
            onChange={e => { setLogin(e.target.value); setErro('') }}
            onKeyDown={handleKeyDown}
            placeholder="Seu login"
            autoComplete="username"
            disabled={loading || bloqueado}
            className={cn('input-base pl-10', erro && 'border-status-danger/50 focus:ring-status-danger/30')}
          />
        </div>
      </div>

      {/* Campo senha */}
      <div>
        <label className="label">Senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            ref={senhaRef}
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro('') }}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading || bloqueado}
            className={cn('input-base pl-10 pr-10', erro && 'border-status-danger/50 focus:ring-status-danger/30')}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(v => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
          >
            {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mensagem de erro */}
      {erro && (
        <div className="flex items-start gap-2 bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2.5 text-sm text-status-danger animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {erro}
            {bloqueado && tempoRestante > 0 && (
              <span className="ml-1 font-mono">({tempoRestante}s)</span>
            )}
          </span>
        </div>
      )}

      {/* Botão */}
      <button
        ref={btnRef}
        onClick={handleSubmit}
        disabled={loading || bloqueado || !login.trim() || !senha}
        className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
        ) : bloqueado ? (
          <><Lock className="w-4 h-4" /> Aguarde {tempoRestante}s</>
        ) : (
          <><LogIn className="w-4 h-4" /> Entrar</>
        )}
      </button>
    </div>
  )
}
