'use client'
import { useState, useEffect } from 'react'
import { GitMerge, Loader2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface MatrizItem {
  requisito: { id: number; codigo: string; titulo: string; status: string }
  casosTeste: { id: number; titulo: string; status: string }[]
  bugs: { id: number; titulo: string; status: string; severidade: string }[]
}

interface Projeto {
  id: number
  nome: string
}

const statusReq: Record<string, string> = {
  'Aprovado': 'bg-green-500/20 text-green-400',
  'Pendente': 'bg-yellow-500/20 text-yellow-400',
  'Em revisão': 'bg-blue-500/20 text-blue-400',
  'Rejeitado': 'bg-red-500/20 text-red-400',
}
const statusCaso: Record<string, string> = {
  'Aprovado': 'text-green-400', 'Reprovado': 'text-red-400',
  'Pendente': 'text-yellow-400', 'Bloqueado': 'text-orange-400',
}
const sevBug: Record<string, string> = {
  'Crítico': 'text-red-500', 'Alto': 'text-red-400',
  'Médio': 'text-yellow-400', 'Baixo': 'text-zinc-400',
}

export default function RastreabilidadePage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [projetoId, setProjetoId] = useState<number | null>(null)
  const [matriz, setMatriz] = useState<MatrizItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/projetos').then(r => r.json()).then(d => {
      const lista = d.projetos || []
      setProjetos(lista)
      if (lista.length > 0) setProjetoId(lista[0].id)
    }).catch(() => toast.error('Erro ao carregar projetos'))
  }, [])

  useEffect(() => {
    if (!projetoId) return
    setLoading(true)
    fetch(`/api/rastreabilidade?projetoId=${projetoId}`)
      .then(r => r.json())
      .then(d => setMatriz(d.matriz || []))
      .catch(() => toast.error('Erro ao carregar matriz'))
      .finally(() => setLoading(false))
  }, [projetoId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><GitMerge size={22} /> Rastreabilidade</h1>
          <p className="text-zinc-400 text-sm mt-1">Matriz de cobertura: Requisitos → Casos de Teste → Bugs</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-400" />
          <select value={projetoId ?? ''} onChange={e => setProjetoId(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Com cobertura</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Sem cobertura</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Com bugs abertos</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : matriz.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">
          <GitMerge size={48} className="mx-auto mb-4 opacity-40" />
          <p>Nenhum dado de rastreabilidade para este projeto</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matriz.map(item => {
            const temCasos = item.casosTeste.length > 0
            const bugsAbertos = item.bugs.filter(b => !['Resolvido', 'Fechado', 'Cancelado'].includes(b.status))
            const indicador = bugsAbertos.length > 0 ? 'bg-yellow-500' : temCasos ? 'bg-green-500' : 'bg-red-500'
            return (
              <div key={item.requisito.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {/* Header requisito */}
                <div className="flex items-start gap-3 p-4 border-b border-zinc-800/50">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${indicador}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-blue-400 text-xs">{item.requisito.codigo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusReq[item.requisito.status] || 'bg-zinc-700 text-zinc-400'}`}>{item.requisito.status}</span>
                    </div>
                    <p className="text-white text-sm font-medium mt-0.5">{item.requisito.titulo}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-zinc-500 flex-shrink-0">
                    <span className={temCasos ? 'text-green-400 font-medium' : 'text-red-400'}>{item.casosTeste.length} caso(s)</span>
                    {item.bugs.length > 0 && <span className="text-yellow-400">{item.bugs.length} bug(s)</span>}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Casos de teste */}
                  <div>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2">Casos de Teste</p>
                    {item.casosTeste.length === 0 ? (
                      <p className="text-red-400 text-xs italic">Sem cobertura de testes</p>
                    ) : (
                      <div className="space-y-1">
                        {item.casosTeste.map(ct => (
                          <div key={ct.id} className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCaso[ct.status] ? 'bg-current' : 'bg-zinc-500'} ${statusCaso[ct.status] || 'text-zinc-500'}`} />
                            <span className="text-zinc-300 text-xs truncate">{ct.titulo}</span>
                            <span className={`text-xs ml-auto flex-shrink-0 ${statusCaso[ct.status] || 'text-zinc-500'}`}>{ct.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bugs */}
                  <div>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-2">Bugs Relacionados</p>
                    {item.bugs.length === 0 ? (
                      <p className="text-zinc-600 text-xs italic">Nenhum bug</p>
                    ) : (
                      <div className="space-y-1">
                        {item.bugs.map(b => (
                          <div key={b.id} className="flex items-center gap-2">
                            <span className={`text-xs font-mono flex-shrink-0 ${sevBug[b.severidade] || 'text-zinc-400'}`}>#{b.id}</span>
                            <span className="text-zinc-300 text-xs truncate">{b.titulo}</span>
                            <span className="text-xs text-zinc-500 ml-auto flex-shrink-0">{b.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
