'use client'
// src/app/(app)/bugs/modal-novo-bug.tsx
import { useState } from 'react'
import { X, Plus, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SEVERIDADES = ['Crítico', 'Alto', 'Médio', 'Baixo']
const PRIORIDADES = ['Urgente', 'Alta', 'Média', 'Baixa']

interface Props {
  projetos: any[]
  onClose: () => void
  onCriado: () => void
}

export function ModalNovoBug({ projetos, onClose, onCriado }: Props) {
  const [form, setForm] = useState({
    titulo: '', descricao: '', passosReproducao: '',
    resultadoEsperado: '', resultadoObtido: '',
    severidade: 'Médio', prioridade: 'Média',
    projetoId: '', ambiente: '', versaoSistema: '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<'basico' | 'detalhes'>('basico')

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const salvar = async () => {
    if (!form.titulo.trim()) { setErro('Título obrigatório'); setAba('basico'); return }
    if (!form.descricao.trim()) { setErro('Descrição obrigatória'); setAba('basico'); return }
    if (!form.projetoId) { setErro('Selecione um projeto'); setAba('basico'); return }

    setLoading(true); setErro('')
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projetoId: Number(form.projetoId) }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao criar bug'); return }
      toast.success('Bug registrado!')
      onCriado()
    } catch { setErro('Erro de conexão') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl card-elevated animate-fade-up opacity-0 max-h-[90vh] flex flex-col"
        style={{ animationFillMode: 'forwards' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="font-display font-bold text-lg text-text-primary">Registrar bug</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-4 bg-bg-surface rounded-lg p-1 flex-shrink-0">
          {(['basico', 'detalhes'] as const).map(a => (
            <button key={a} onClick={() => setAba(a)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                aba === a ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}>
              {a === 'basico' ? 'Informações básicas' : 'Detalhes técnicos'}
            </button>
          ))}
        </div>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1">
          {aba === 'basico' ? (
            <div className="space-y-4">
              <div>
                <label className="label">Título *</label>
                <input type="text" value={form.titulo} onChange={set('titulo')}
                  placeholder="Descreva o bug resumidamente" className="input-base" autoFocus />
              </div>
              <div>
                <label className="label">Descrição *</label>
                <textarea value={form.descricao} onChange={set('descricao')}
                  placeholder="Descreva o bug em detalhes..." rows={4}
                  className="input-base resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Projeto *</label>
                  <select value={form.projetoId} onChange={set('projetoId')}
                    className="input-base appearance-none cursor-pointer">
                    <option value="">Selecione...</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Severidade</label>
                  <select value={form.severidade} onChange={set('severidade')}
                    className="input-base appearance-none cursor-pointer">
                    {SEVERIDADES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Prioridade</label>
                  <select value={form.prioridade} onChange={set('prioridade')}
                    className="input-base appearance-none cursor-pointer">
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Passos para reproduzir</label>
                <textarea value={form.passosReproducao} onChange={set('passosReproducao')}
                  placeholder="1. Acesse a tela X&#10;2. Clique em Y&#10;3. Observe o erro"
                  rows={4} className="input-base resize-none font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Resultado esperado</label>
                  <textarea value={form.resultadoEsperado} onChange={set('resultadoEsperado')}
                    placeholder="O que deveria acontecer..." rows={3}
                    className="input-base resize-none" />
                </div>
                <div>
                  <label className="label">Resultado obtido</label>
                  <textarea value={form.resultadoObtido} onChange={set('resultadoObtido')}
                    placeholder="O que aconteceu de fato..." rows={3}
                    className="input-base resize-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ambiente</label>
                  <input type="text" value={form.ambiente} onChange={set('ambiente')}
                    placeholder="ex: Chrome 125 / Windows 11" className="input-base" />
                </div>
                <div>
                  <label className="label">Versão do sistema</label>
                  <input type="text" value={form.versaoSistema} onChange={set('versaoSistema')}
                    placeholder="ex: v2.1.0" className="input-base" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t border-border mt-4">
          {erro && (
            <div className="flex items-center gap-2 bg-status-danger/10 border border-status-danger/20 rounded-lg px-3 py-2 text-sm text-status-danger mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" />{erro}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={salvar} disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Registrando...</> : <><Plus className="w-4 h-4" />Registrar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
