'use client'
// src/app/(auth)/recuperar-senha/page.tsx
import { useState, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, KeyRound, Lock, Eye, EyeOff, Loader2,
  AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Etapa = 'login' | 'codigo' | 'senha'

export default function RecuperarSenhaPage() {
  const router = useRouter()

  const [etapa, setEtapa] = useState<Etapa>('login')
  const [login, setLogin] = useState('')
  const [emailMascarado, setEmailMascarado] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(0)
  const [tentativas, setTentativas] = useState(0)
  const [bloqueadoAte, setBloqueadoAte] = useState<Date | null>(null)

  // Contador regressivo do código
  useEffect(() => {
    if (tempoRestante <= 0) return
    const t = setInterval(() => {
      setTempoRestante(v => {
        if (v <= 1) { clearInterval(t); return 0 }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [tempoRestante])

  // Contador de bloqueio
  useEffect(() => {
    if (!bloqueadoAte) return
    const t = setInterval(() => {
      if (Date.now() >= bloqueadoAte.getTime()) {
        setBloqueadoAte(null)
        setErro('')
        clearInterval(t)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [bloqueadoAte])

  const tempoFormatado = () => {
    const m = Math.floor(tempoRestante / 60)
    const s = tempoRestante % 60
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
  }

  // ── ETAPA 1: Enviar código ─────────────────────────────────────────────────
  const enviarCodigo = async () => {
    if (!login.trim()) { setErro('Digite seu login'); return }
    setLoading(true); setErro('')

    try {
      const res = await fetch('/api/reset-senha/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim() }),
      })
      const data = await res.json()

      if (!res.ok) { setErro(data.error || 'Erro ao enviar código'); return }

      setEmailMascarado(data.emailMascarado || '')
      setTempoRestante(60)
      setEtapa('codigo')
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  // ── ETAPA 2: Verificar código ──────────────────────────────────────────────
  const verificarCodigo = async () => {
    if (bloqueadoAte) return

    if (tempoRestante === 0) {
      // Reenviar código automaticamente
      await reenviarCodigo()
      return
    }

    if (codigo.length !== 6) { setErro('Digite o código de 6 dígitos'); return }
    setLoading(true); setErro('')

    try {
      const res = await fetch('/api/reset-senha/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), token: codigo }),
      })
      const data = await res.json()

      if (!res.ok) {
        const novasTentativas = tentativas + 1
        setTentativas(novasTentativas)
        if (novasTentativas >= 5) {
          setBloqueadoAte(new Date(Date.now() + 30000))
          setErro('Muitas tentativas. Aguarde 30 segundos.')
          setTentativas(0)
        } else {
          setErro(`${data.error || 'Código inválido'} (${novasTentativas}/5)`)
        }
        return
      }

      setTentativas(0)
      setEtapa('senha')
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const reenviarCodigo = async () => {
    setLoading(true); setErro(''); setCodigo('')
    try {
      const res = await fetch('/api/reset-senha/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim() }),
      })
      if (res.ok) { setTempoRestante(60); setErro('') }
      else { const d = await res.json(); setErro(d.error || 'Erro ao reenviar') }
    } catch { setErro('Erro de conexão') }
    finally { setLoading(false) }
  }

  // ── ETAPA 3: Nova senha ────────────────────────────────────────────────────
  const salvarSenha = async () => {
    if (novaSenha.length < 6) { setErro('Senha muito curta (mínimo 6 caracteres)'); return }
    if (novaSenha !== confirmarSenha) { setErro('As senhas não coincidem'); return }

    setLoading(true); setErro('')

    try {
      const res = await fetch('/api/reset-senha/redefinir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), token: codigo, novaSenha }),
      })
      const data = await res.json()

      if (!res.ok) { setErro(data.error || 'Erro ao salvar senha'); return }

      setSucesso(true)
      sessionStorage.setItem('loginRecuperado', login.trim())
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') action()
    if (e.key === 'Escape') {
      if (etapa === 'codigo') setEtapa('login')
      else if (etapa === 'senha') setEtapa('codigo')
      else router.push('/login')
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 mb-4">
          <ShieldCheck className="w-6 h-6 text-accent" />
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">
          Recuperar senha
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {etapa === 'login' && 'Digite seu login para receber o código'}
          {etapa === 'codigo' && `Código enviado para ${emailMascarado}`}
          {etapa === 'senha' && 'Defina sua nova senha'}
        </p>
      </div>

      <div className="card-elevated">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {(['login', 'codigo', 'senha'] as Etapa[]).map((e, i) => (
            <div key={e} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all',
                etapa === e ? 'bg-accent text-white' :
                ['codigo', 'senha'].indexOf(etapa) > i ? 'bg-status-success text-white' :
                'bg-bg-elevated text-text-muted border border-border'
              )}>
                {['codigo', 'senha'].indexOf(etapa) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={cn('h-px flex-1 transition-all', ['codigo', 'senha'].indexOf(etapa) > i ? 'bg-status-success' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {sucesso ? (
          // ── Sucesso ──
          <div className="flex flex-col items-center gap-3 py-6 text-center animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-status-success" />
            <h3 className="font-display text-lg font-semibold">Senha alterada!</h3>
            <p className="text-text-secondary text-sm">Redirecionando para o login...</p>
          </div>

        ) : etapa === 'login' ? (
          // ── Etapa 1: Login ──
          <div className="space-y-4">
            <div>
              <label className="label">Login</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="text" value={login}
                  onChange={e => { setLogin(e.target.value); setErro('') }}
                  onKeyDown={e => handleKeyDown(e, enviarCodigo)}
                  placeholder="Seu login"
                  autoFocus
                  className="input-base pl-10"
                />
              </div>
            </div>
            {erro && <ErroBox msg={erro} />}
            <button onClick={enviarCodigo} disabled={!login.trim() || loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Mail className="w-4 h-4" /> Enviar código</>}
            </button>
          </div>

        ) : etapa === 'codigo' ? (
          // ── Etapa 2: Código ──
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Código de 6 dígitos</label>
                {tempoRestante > 0 ? (
                  <span className="text-xs font-mono text-text-secondary">
                    Expira em <span className={cn('font-bold', tempoRestante <= 10 && 'text-status-danger')}>{tempoFormatado()}</span>
                  </span>
                ) : (
                  <button onClick={reenviarCodigo} disabled={loading}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors">
                    <RefreshCw className="w-3 h-3" /> Reenviar
                  </button>
                )}
              </div>
              <input
                type="text" value={codigo} maxLength={6}
                onChange={e => { setCodigo(e.target.value.replace(/\D/g, '')); setErro('') }}
                onKeyDown={e => handleKeyDown(e, verificarCodigo)}
                placeholder="000000"
                autoFocus
                className="input-base text-center text-2xl font-mono tracking-widest"
              />
            </div>
            {tempoRestante === 0 && (
              <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg px-3 py-2 text-sm text-status-warning">
                Código expirado. Clique em reenviar para receber um novo.
              </div>
            )}
            {bloqueadoAte && (
              <div className="bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2 text-sm text-status-danger">
                Muitas tentativas. Aguarde antes de tentar novamente.
              </div>
            )}
            {erro && !bloqueadoAte && <ErroBox msg={erro} />}
            <button onClick={verificarCodigo}
              disabled={loading || !!bloqueadoAte || (tempoRestante === 0 ? false : codigo.length !== 6)}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> :
               tempoRestante === 0 ? <><RefreshCw className="w-4 h-4" /> Reenviar código</> :
               <><CheckCircle2 className="w-4 h-4" /> Verificar código</>}
            </button>
          </div>

        ) : (
          // ── Etapa 3: Nova senha ──
          <div className="space-y-4">
            <div>
              <label className="label">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type={mostrarSenha ? 'text' : 'password'} value={novaSenha}
                  onChange={e => { setNovaSenha(e.target.value); setErro('') }}
                  onKeyDown={e => handleKeyDown(e, salvarSenha)}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                  className="input-base pl-10 pr-10"
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type={mostrarSenha ? 'text' : 'password'} value={confirmarSenha}
                  onChange={e => { setConfirmarSenha(e.target.value); setErro('') }}
                  onKeyDown={e => handleKeyDown(e, salvarSenha)}
                  placeholder="Repita a senha"
                  className={cn('input-base pl-10',
                    confirmarSenha && novaSenha !== confirmarSenha && 'border-status-danger/50')}
                />
              </div>
              {confirmarSenha && novaSenha !== confirmarSenha && (
                <p className="text-status-danger text-xs mt-1">As senhas não coincidem</p>
              )}
            </div>
            {erro && <ErroBox msg={erro} />}
            <button onClick={salvarSenha}
              disabled={loading || novaSenha.length < 6 || novaSenha !== confirmarSenha}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><CheckCircle2 className="w-4 h-4" /> Salvar senha</>}
            </button>
          </div>
        )}

        {!sucesso && (
          <>
            <div className="divider" />
            <button onClick={() => etapa === 'login' ? router.push('/login') : setEtapa(etapa === 'codigo' ? 'login' : 'codigo')}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {etapa === 'login' ? 'Voltar ao login' : 'Etapa anterior'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ErroBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2.5 text-sm text-status-danger animate-fade-in">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{msg}</span>
    </div>
  )
}
