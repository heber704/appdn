'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, X, Shield, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface LogAuditoria {
  id: number
  acao: string
  tabela: string
  registro_id: string | null
  dados_anteriores: any
  dados_novos: any
  ip: string | null
  usuario: { nome: string; email: string }
  criado_em: string
}

const acaoColor: Record<string, string> = {
  CREATE: 'bg-green-500/20 text-green-400',
  UPDATE: 'bg-blue-500/20 text-blue-400',
  DELETE: 'bg-red-500/20 text-red-400',
  LOGIN: 'bg-purple-500/20 text-purple-400',
  LOGOUT: 'bg-zinc-500/20 text-zinc-400',
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('TODOS')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const POR_PAGINA = 20

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ busca, acao: filtroAcao, pagina: String(pagina), limite: String(POR_PAGINA) })
      const res = await fetch(`/api/auditoria?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch { toast.error('Erro ao carregar auditoria') }
    finally { setLoading(false) }
  }, [busca, filtroAcao, pagina])

  useEffect(() => { carregar() }, [carregar])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield size={22} /> Auditoria</h1>
          <p className="text-zinc-400 text-sm mt-1">{total} registro(s) no total</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-lg transition-colors">
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={e => { setBusca(e.target.value); setPagina(1) }} placeholder="Buscar por usuário, tabela..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><X size={14} /></button>}
        </div>
        <select value={filtroAcao} onChange={e => { setFiltroAcao(e.target.value); setPagina(1) }}
          className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
          {['TODOS','CREATE','UPDATE','DELETE','LOGIN','LOGOUT'].map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-zinc-500"><Shield size={48} className="mx-auto mb-4 opacity-50" /><p>Nenhum log encontrado</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  {['Data/Hora','Usuário','Ação','Tabela','Registro','IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">{new Date(l.criado_em).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">{l.usuario?.nome}</p>
                      <p className="text-zinc-500 text-xs">{l.usuario?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${acaoColor[l.acao] || 'bg-zinc-700 text-zinc-300'}`}>{l.acao}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{l.tabela}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{l.registro_id || '—'}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{l.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
