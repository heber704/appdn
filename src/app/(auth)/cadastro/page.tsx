'use client'
// src/app/(auth)/cadastro/page.tsx
import { useState, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, Loader2, AlertCircle, CheckCircle2, User, Mail, Lock, AtSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CadastroPage() {
  const router = useRouter()
  const nomeRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ nome: '', email: '', login: '', senha: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErro('')
  }

  const valido = form.nome.trim().length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    && form.login.trim().length >= 3
    && form.senha.length >= 6

  const handleSubmit = async () => {
    if (!valido) return
    setLoading(true)
    setErro('')

    try {
      const res = await fetch('/api/usuarios/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro ao cadastrar')
        setLoading(false)
        return
      }

      setSucesso(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setErro('Erro de conexão')
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && valido && !loading) handleSubmit()
  }

  return (
    <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">
          Criar conta
        </h1>
        <p className="text-text-secondary text-sm mt-1">Preencha os dados para se cadastrar</p>
      </div>

      <div className="card-elevated">
        {sucesso ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-status-success" />
            <h3 className="font-display text-lg font-semibold text-text-primary">Conta criada!</h3>
            <p className="text-text-secondary text-sm">Redirecionando para o login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="label">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input ref={nomeRef} type="text" value={form.nome} onChange={set('nome')} onKeyDown={handleKeyDown}
                  placeholder="Seu nome" autoComplete="name"
                  className="input-base pl-10" />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input type="email" value={form.email} onChange={set('email')} onKeyDown={handleKeyDown}
                  placeholder="seu@email.com" autoComplete="email"
                  className="input-base pl-10" />
              </div>
            </div>

            {/* Login */}
            <div>
              <label className="label">Login</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input type="text" value={form.login} onChange={set('login')} onKeyDown={handleKeyDown}
                  placeholder="nome.usuario" autoComplete="username"
                  className="input-base pl-10" />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input type={mostrarSenha ? 'text' : 'password'} value={form.senha} onChange={set('senha')} onKeyDown={handleKeyDown}
                  placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  className={cn('input-base pl-10 pr-10', form.senha.length > 0 && form.senha.length < 6 && 'border-status-warning/50')} />
                <button type="button" onClick={() => setMostrarSenha(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.senha.length > 0 && form.senha.length < 6 && (
                <p className="text-status-warning text-xs mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-start gap-2 bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2.5 text-sm text-status-danger">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Botão */}
            <button onClick={handleSubmit} disabled={!valido || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</> : <><UserPlus className="w-4 h-4" /> Criar conta</>}
            </button>
          </div>
        )}

        <div className="divider" />

        <p className="text-center text-sm text-text-secondary">
          Já tem conta?{' '}
          <a href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
