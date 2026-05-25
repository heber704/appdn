'use client'
import { useState, useEffect } from 'react'
import { Server, Plus, X, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTS = ['Disponível', 'Em uso', 'Indisponível']
const STATUS_BADGE: Record<string, string> = {
  'Disponível': 'badge-success', 'Em uso': 'badge-warning', 'Indisponível': 'badge-danger',
}

export default function AmbientesPage() {
  const [ambientes, setAmbientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', sistemaOperacional: '', navegador: '', versao: '', status: 'Disponível' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = async () => {
    setLoading(true)
    try { const res = await fetch('/api/ambientes'); setAmbientes(await res.json()) }
    catch { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const salvar = async () => {
    if (!form.nome.trim()) { setErro('Nome obrigatório'); return }
    setSalvando(true); setErro('')
    try {
      const res = await fetch('/api/ambientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setErro(data.error); return }
      toast.success('Ambiente criado!')
      setModal(false)
      setForm({ nome: '', sistemaOperacional: '', navegador: '', versao: '', status: 'Disponível' })
      carregar()
    } catch { setErro('Erro') }
    finally { setSalvando(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Ambientes de Teste</h1>
          <p className="text-text-secondary text-sm mt-0.5">{ambientes.length} ambiente{ambientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Novo ambiente</button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      : ambientes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Server className="w-8 h-8 text-text-muted" />
          <p className="text-text-secondary text-sm">Nenhum ambiente cadastrado</p>
          <button onClick={() => setModal(true)} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Criar ambiente</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {ambientes.map((a: any) => (
            <div key={a.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-accent" />
                  <h3 className="font-display font-semibold text-text-primary">{a.nome}</h3>
                </div>
                <span className={STATUS_BADGE[a.status] || 'badge-muted'}>{a.status}</span>
              </div>
              <div className="space-y-1 text-xs text-text-muted">
                {a.sistemaOperacional && <p>OS: {a.sistemaOperacional}</p>}
                {a.navegador && <p>Browser: {a.navegador}</p>}
                {a.versao && <p>Versão: {a.versao}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-md card-elevated animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-text-primary">Novo ambiente</h2>
              <button onClick={() => setModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Nome *</label><input value={form.nome} onChange={set('nome')} className="input-base" autoFocus /></div>
              <div><label className="label">Sistema operacional</label><input value={form.sistemaOperacional} onChange={set('sistemaOperacional')} placeholder="Windows 11, Ubuntu 22..." className="input-base" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Navegador</label><input value={form.navegador} onChange={set('navegador')} placeholder="Chrome 125" className="input-base" /></div>
                <div><label className="label">Versão</label><input value={form.versao} onChange={set('versao')} placeholder="v2.1.0" className="input-base" /></div>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={set('status')} className="input-base appearance-none cursor-pointer">
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {erro && <div className="flex items-center gap-2 bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2 text-sm text-status-danger"><AlertCircle className="w-4 h-4 shrink-0" />{erro}</div>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
