'use client'
import { useState, useEffect } from 'react'
import { Bell, Loader2, Check, CheckCheck, Trash2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Notificacao {
  id: number
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  criado_em: string
}

const tipoColor: Record<string, string> = {
  INFO: 'border-l-blue-500',
  SUCESSO: 'border-l-green-500',
  AVISO: 'border-l-yellow-500',
  ERRO: 'border-l-red-500',
}

export default function NotificacoesPage() {
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODAS' | 'NAO_LIDAS'>('TODAS')

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notificacoes')
      const data = await res.json()
      setNotifs(data.notificacoes || [])
    } catch { toast.error('Erro ao carregar notificações') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const marcarLida = async (id: number) => {
    await fetch(`/api/notificacoes`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifs(n => n.map(x => x.id === id ? { ...x, lida: true } : x))
  }

  const marcarTodasLidas = async () => {
    await fetch('/api/notificacoes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ todas: true }) })
    setNotifs(n => n.map(x => ({ ...x, lida: true })))
    toast.success('Todas marcadas como lidas')
  }

  const filtradas = filtro === 'NAO_LIDAS' ? notifs.filter(n => !n.lida) : notifs
  const naoLidas = notifs.filter(n => !n.lida).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={22} /> Notificações
            {naoLidas > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{naoLidas}</span>}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{filtradas.length} notificação(ões)</p>
        </div>
        {naoLidas > 0 && (
          <button onClick={marcarTodasLidas} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <CheckCheck size={16} /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['TODAS', 'NAO_LIDAS'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtro === f ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            {f === 'TODAS' ? 'Todas' : 'Não lidas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Bell size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map(n => (
            <div key={n.id} className={`bg-zinc-900 border-l-4 border border-zinc-800 rounded-xl p-4 transition-colors ${tipoColor[n.tipo] || 'border-l-zinc-600'} ${!n.lida ? 'bg-zinc-800/60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${n.lida ? 'text-zinc-300' : 'text-white'}`}>{n.titulo}</p>
                  <p className="text-zinc-400 text-xs mt-1">{n.mensagem}</p>
                  <p className="text-zinc-600 text-xs mt-2">{new Date(n.criado_em).toLocaleString('pt-BR')}</p>
                </div>
                {!n.lida && (
                  <button onClick={() => marcarLida(n.id)} className="text-zinc-500 hover:text-blue-400 transition-colors" title="Marcar como lida">
                    <Check size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
