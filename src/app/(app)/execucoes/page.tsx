'use client'
import { useState, useEffect, useCallback } from 'react'
import { PlayCircle, Search, Loader2, X, CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp, ListChecks, History } from 'lucide-react'
import toast from 'react-hot-toast'

interface PassoTeste { id: number; ordem: number; descricao: string; resultadoEsperado: string }
interface CasoTeste {
  id: number; titulo: string; descricao: string | null
  prioridade: string; tipo: string; projeto: { nome: string }; passos: PassoTeste[]
}
interface Execucao {
  id: number; resultado: string; observacoes: string | null; iniciadoEm: string
  casoTeste: { titulo: string }; executor: { nome: string }; ciclo?: { nome: string } | null
}
interface ResultadoPasso { passoId: number; resultado: string; observacao: string }

const RESULTADO_OPTS = ['Não executado', 'Aprovado', 'Reprovado', 'Bloqueado']
const RESULTADO_COLORS: Record<string, string> = {
  'Aprovado':       'bg-green-500/20 text-green-400 border border-green-500/30',
  'Reprovado':      'bg-red-500/20 text-red-400 border border-red-500/30',
  'Bloqueado':      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'Não executado':  'bg-zinc-700/40 text-zinc-400 border border-zinc-600/40',
}

export default function ExecucoesPage() {
  const [aba, setAba] = useState<'executar' | 'historico'>('executar')
  const [casos, setCasos] = useState<CasoTeste[]>([])
  const [historico, setHistorico] = useState<Execucao[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [casoSelecionado, setCasoSelecionado] = useState<CasoTeste | null>(null)
  const [expandido, setExpandido] = useState(false)
  const [resultados, setResultados] = useState<ResultadoPasso[]>([])
  const [resultadoGeral, setResultadoGeral] = useState('Aprovado')
  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [executando, setExecutando] = useState(false)

  const carregarCasos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.set('q', busca)
      const res = await fetch(`/api/casos-teste?${params}`)
      const data = await res.json()
      setCasos(Array.isArray(data) ? data : (data.casos || []))
    } catch { toast.error('Erro ao carregar casos') }
    finally { setLoading(false) }
  }, [busca])

  const carregarHistorico = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/execucoes')
      const data = await res.json()
      setHistorico(data.execucoes || [])
    } catch { toast.error('Erro ao carregar histórico') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (aba === 'executar') carregarCasos()
    else carregarHistorico()
  }, [aba, carregarCasos, carregarHistorico])

  const selecionarCaso = async (caso: CasoTeste) => {
    try {
      const res = await fetch(`/api/casos-teste/${caso.id}`)
      if (res.ok) {
        const data = await res.json()
        const c = data.caso || caso
        setCasoSelecionado(c)
        setResultados((c.passos || []).map((p: PassoTeste) => ({ passoId: p.id, resultado: 'Não executado', observacao: '' })))
      } else {
        setCasoSelecionado(caso)
        setResultados((caso.passos || []).map(p => ({ passoId: p.id, resultado: 'Não executado', observacao: '' })))
      }
    } catch {
      setCasoSelecionado(caso)
      setResultados((caso.passos || []).map(p => ({ passoId: p.id, resultado: 'Não executado', observacao: '' })))
    }
    setResultadoGeral('Aprovado'); setObservacaoGeral(''); setExpandido(true)
  }

  const atualizarPasso = (passoId: number, campo: 'resultado' | 'observacao', valor: string) => {
    setResultados(r => r.map(x => x.passoId === passoId ? { ...x, [campo]: valor } : x))
  }

  const executar = async () => {
    if (!casoSelecionado) return
    setExecutando(true)
    try {
      const res = await fetch('/api/execucoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casoTesteId: casoSelecionado.id, resultado: resultadoGeral, observacoes: observacaoGeral, resultadosPassos: resultados }),
      })
      if (!res.ok) throw new Error()
      toast.success('Execução registrada!')
      setCasoSelecionado(null); setExpandido(false); carregarCasos()
    } catch { toast.error('Erro ao registrar execução') }
    finally { setExecutando(false) }
  }

  const prioridadeBadge: Record<string, string> = {
    'Alta': 'bg-red-500/20 text-red-400', 'Média': 'bg-yellow-500/20 text-yellow-400', 'Baixa': 'bg-green-500/20 text-green-400',
  }
  const resultadoBadge: Record<string, string> = {
    'Aprovado': 'bg-green-500/20 text-green-400', 'Reprovado': 'bg-red-500/20 text-red-400',
    'Bloqueado': 'bg-yellow-500/20 text-yellow-400', 'Não executado': 'bg-zinc-700 text-zinc-400',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><PlayCircle size={22} /> Execução de Testes</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {[{ id: 'executar', label: 'Executar', icon: PlayCircle }, { id: 'historico', label: 'Histórico', icon: History }].map(t => (
          <button key={t.id} onClick={() => setAba(t.id as any)}
            className={`flex items-center gap-2 py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${aba === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {aba === 'executar' ? (
        <>
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar casos de teste..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"><X size={14} /></button>}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista casos */}
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
              ) : casos.length === 0 ? (
                <div className="text-center py-16 text-zinc-500"><ListChecks size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhum caso encontrado</p></div>
              ) : casos.map(c => (
                <button key={c.id} onClick={() => selecionarCaso(c)}
                  className={`w-full text-left bg-zinc-900 border rounded-xl p-4 hover:border-blue-500/50 transition-all ${casoSelecionado?.id === c.id ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{c.titulo}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{c.projeto?.nome} · {c.tipo}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${prioridadeBadge[c.prioridade] || 'bg-zinc-700 text-zinc-400'}`}>{c.prioridade}</span>
                  </div>
                </button>
              ))}
            </div>
            {/* Painel execução */}
            <div>
              {!casoSelecionado ? (
                <div className="flex items-center justify-center h-64 bg-zinc-900 border border-dashed border-zinc-800 rounded-xl">
                  <div className="text-center text-zinc-500"><PlayCircle size={40} className="mx-auto mb-3 opacity-40" /><p className="text-sm">Selecione um caso ao lado</p></div>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm">{casoSelecionado.titulo}</h3>
                      {casoSelecionado.descricao && <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{casoSelecionado.descricao}</p>}
                    </div>
                    <button onClick={() => setExpandido(e => !e)} className="text-zinc-400 hover:text-white flex-shrink-0">
                      {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {expandido && (
                    <div className="p-4 space-y-5">
                      {casoSelecionado.passos?.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Passos</p>
                          {casoSelecionado.passos.sort((a, b) => a.ordem - b.ordem).map((passo, idx) => {
                            const res = resultados.find(r => r.passoId === passo.id)
                            return (
                              <div key={passo.id} className="bg-zinc-800/50 rounded-lg p-3 space-y-2 border border-zinc-700/40">
                                <div className="flex items-start gap-2">
                                  <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-1.5 py-0.5 rounded flex-shrink-0">{idx + 1}</span>
                                  <div className="flex-1"><p className="text-white text-xs">{passo.descricao}</p><p className="text-zinc-500 text-xs mt-1 italic">Esperado: {passo.resultadoEsperado}</p></div>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {RESULTADO_OPTS.map(opt => (
                                    <button key={opt} onClick={() => atualizarPasso(passo.id, 'resultado', opt)}
                                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${res?.resultado === opt ? RESULTADO_COLORS[opt] : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-500'}`}>
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                                {res?.resultado && !['Aprovado', 'Não executado'].includes(res.resultado) && (
                                  <input value={res.observacao} onChange={e => atualizarPasso(passo.id, 'observacao', e.target.value)}
                                    placeholder="Observação..."
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-blue-500" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">Resultado Geral</p>
                        <div className="flex gap-2">
                          {['Aprovado', 'Reprovado', 'Bloqueado'].map(opt => (
                            <button key={opt} onClick={() => setResultadoGeral(opt)}
                              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${resultadoGeral === opt ? RESULTADO_COLORS[opt] : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                        <textarea value={observacaoGeral} onChange={e => setObservacaoGeral(e.target.value)}
                          placeholder="Observações gerais..." rows={2}
                          className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-blue-500 resize-none" />
                      </div>
                      <button onClick={executar} disabled={executando}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                        {executando ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                        Registrar Execução
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Histórico */
        <div>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
          ) : historico.length === 0 ? (
            <div className="text-center py-20 text-zinc-500"><History size={48} className="mx-auto mb-4 opacity-50" /><p>Nenhuma execução registrada</p></div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-800/50">
                  <tr>
                    <th className="text-left text-zinc-400 font-medium px-4 py-3 text-xs uppercase">Caso de Teste</th>
                    <th className="text-left text-zinc-400 font-medium px-4 py-3 text-xs uppercase">Resultado</th>
                    <th className="text-left text-zinc-400 font-medium px-4 py-3 text-xs uppercase">Executor</th>
                    <th className="text-left text-zinc-400 font-medium px-4 py-3 text-xs uppercase">Ciclo</th>
                    <th className="text-left text-zinc-400 font-medium px-4 py-3 text-xs uppercase">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map(e => (
                    <tr key={e.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-white text-sm">{e.casoTeste?.titulo}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${resultadoBadge[e.resultado] || 'bg-zinc-700 text-zinc-400'}`}>{e.resultado}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{e.executor?.nome}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{e.ciclo?.nome || '—'}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(e.iniciadoEm).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
