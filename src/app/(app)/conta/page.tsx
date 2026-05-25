'use client'
// src/app/(app)/conta/page.tsx
import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import {
  User, Mail, AtSign, Briefcase, Shield, Camera, Save,
  Loader2, AlertCircle, CheckCircle2, Trash2, LogOut, X
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function ContaPage() {
  const fotoRef = useRef<HTMLInputElement>(null)
  const [dados, setDados] = useState<any>(null)
  const [form, setForm] = useState({ nome: '', email: '', login: '' })
  const [original, setOriginal] = useState({ nome: '', email: '', login: '' })
  const [foto, setFoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [uploadandoFoto, setUploadandoFoto] = useState(false)
  const [erro, setErro] = useState('')
  const [modalDesativar, setModalDesativar] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [desativando, setDesativando] = useState(false)

  useEffect(() => {
    fetch('/api/conta')
      .then(r => r.json())
      .then(data => {
        setDados(data)
        const vals = { nome: data.nome, email: data.email, login: data.login }
        setForm(vals)
        setOriginal(vals)
        if (data.temFoto) {
          fetch('/api/conta/foto').then(r => r.json()).then(f => setFoto(f.data)).catch(() => null)
        }
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  const mudou = form.nome !== original.nome || form.email !== original.email || form.login !== original.login
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErro('')
  }

  const salvar = async () => {
    if (!mudou) return
    setSalvando(true); setErro('')
    try {
      const res = await fetch('/api/conta', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error); return }
      setOriginal({ nome: form.nome, email: form.email, login: form.login })
      setDados((d: any) => ({ ...d, ...data }))
      toast.success('Dados atualizados!')
    } catch { setErro('Erro de conexão') }
    finally { setSalvando(false) }
  }

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadandoFoto(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      const res = await fetch('/api/conta/foto', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      // Atualiza preview
      const reader = new FileReader()
      reader.onload = e => setFoto(e.target?.result as string)
      reader.readAsDataURL(file)
      toast.success('Foto atualizada!')
    } catch { toast.error('Erro ao enviar foto') }
    finally { setUploadandoFoto(false); if (fotoRef.current) fotoRef.current.value = '' }
  }

  const removerFoto = async () => {
    await fetch('/api/conta/foto', { method: 'DELETE' })
    setFoto(null)
    toast.success('Foto removida')
  }

  const desativarConta = async () => {
    setDesativando(true)
    try {
      const res = await fetch('/api/conta/desativar', { method: 'POST' })
      if (!res.ok) { toast.error('Erro ao desativar'); return }
      setModalDesativar(false)
      // Countdown de 10s antes de deslogar
      let c = 10
      setCountdown(c)
      const t = setInterval(() => {
        c--
        setCountdown(c)
        if (c <= 0) {
          clearInterval(t)
          signOut({ callbackUrl: '/login' })
        }
      }, 1000)
    } catch { toast.error('Erro de conexão') }
    finally { setDesativando(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>

  if (countdown > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-status-danger/10 border-2 border-status-danger/30 flex items-center justify-center mx-auto mb-6">
            <span className="font-display text-3xl font-bold text-status-danger">{countdown}</span>
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Conta desativada</h2>
          <p className="text-text-secondary text-sm">Você será desconectado em {countdown} segundo{countdown !== 1 ? 's' : ''}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Minha conta</h1>
        <p className="text-text-secondary text-sm mt-0.5">Gerencie seus dados e preferências</p>
      </div>

      {/* Foto de perfil */}
      <div className="card flex items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-accent/15 border-2 border-accent/30 flex items-center justify-center">
            {foto ? (
              <img src={foto} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-accent">
                {dados?.nome?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {uploadandoFoto && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-text-primary">{dados?.nome}</p>
          <p className="text-text-muted text-sm">{dados?.cargo}</p>
        </div>
        <div className="flex gap-2">
          <input ref={fotoRef} type="file" accept="image/*" onChange={uploadFoto} className="hidden" />
          <button onClick={() => fotoRef.current?.click()} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Camera className="w-4 h-4" /> Alterar foto
          </button>
          {foto && (
            <button onClick={removerFoto} className="btn-secondary flex items-center gap-1.5 text-sm text-status-danger border-status-danger/20 hover:bg-status-danger/10">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="card space-y-4">
        <h2 className="font-display font-semibold text-text-primary">Dados pessoais</h2>

        <div>
          <label className="label">Nome completo</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input value={form.nome} onChange={set('nome')} className="input-base pl-10" />
          </div>
        </div>
        <div>
          <label className="label">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input type="email" value={form.email} onChange={set('email')} className="input-base pl-10" />
          </div>
        </div>
        <div>
          <label className="label">Login</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input value={form.login} onChange={set('login')} className="input-base pl-10" />
          </div>
        </div>

        {/* Campos somente leitura */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <label className="label">Cargo</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input value={dados?.cargo} readOnly className="input-base pl-10 opacity-60 cursor-not-allowed" />
            </div>
            <p className="text-text-muted text-xs mt-1">Definido pelo administrador</p>
          </div>
          <div>
            <label className="label">Situação</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input value={dados?.situacao} readOnly className="input-base pl-10 opacity-60 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-2 bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2 text-sm text-status-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />{erro}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button onClick={salvar} disabled={!mudou || salvando}
            className="btn-primary flex items-center gap-2">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar alterações
          </button>
        </div>
      </div>

      {/* Info da conta */}
      <div className="card">
        <h2 className="font-display font-semibold text-text-primary mb-4">Informações da conta</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">ID da conta</span>
            <span className="font-mono text-text-secondary">#{dados?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Membro desde</span>
            <span className="text-text-secondary">{dados?.criadoEm ? formatDate(dados.criadoEm) : '—'}</span>
          </div>
        </div>
      </div>

      {/* Zona de perigo */}
      <div className="card border-status-danger/20">
        <h2 className="font-display font-semibold text-status-danger mb-1">Zona de perigo</h2>
        <p className="text-text-secondary text-sm mb-4">
          Ao desativar sua conta, você perderá o acesso imediatamente.<br />
          Somente o administrador poderá reativá-la.
        </p>
        <button onClick={() => setModalDesativar(true)}
          className="btn-danger flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Desativar minha conta
        </button>
      </div>

      {/* Modal de confirmação */}
      {modalDesativar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalDesativar(false)} />
          <div className="relative w-full max-w-sm card-elevated animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-status-danger">Desativar conta</h3>
              <button onClick={() => setModalDesativar(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-secondary text-sm mb-2">
              Tem certeza? Você será desconectado em <strong>10 segundos</strong> e não conseguirá mais entrar.
            </p>
            <p className="text-text-muted text-xs mb-5">
              Somente o administrador poderá reativar seu acesso.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalDesativar(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={desativarConta} disabled={desativando}
                className="btn-danger flex-1 flex items-center justify-center gap-2">
                {desativando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Sim, desativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}