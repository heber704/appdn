'use client'
import { useState } from 'react'
import { FileText, Download, BarChart2, Bug, CheckSquare, Users, Loader2, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'

interface RelatorioCard {
  id: string
  titulo: string
  descricao: string
  icon: React.ElementType
  formatos: string[]
  cor: string
  endpoint: string
}

const relatorios: RelatorioCard[] = [
  { id: 'bugs', titulo: 'Relatório de Bugs', descricao: 'Lista completa de bugs com status, prioridade e responsável', icon: Bug, formatos: ['PDF', 'Excel'], cor: 'text-red-400', endpoint: '/api/relatorios/bugs' },
  { id: 'execucoes', titulo: 'Execuções de Teste', descricao: 'Resultados das execuções por ciclo e caso de teste', icon: CheckSquare, formatos: ['PDF', 'Excel'], cor: 'text-green-400', endpoint: '/api/relatorios/execucoes' },
  { id: 'cobertura', titulo: 'Cobertura de Testes', descricao: 'Percentual de cobertura de requisitos e aprovação por projeto', icon: BarChart2, formatos: ['PDF', 'Excel'], cor: 'text-blue-400', endpoint: '/api/relatorios/cobertura' },
  { id: 'usuarios', titulo: 'Atividade de Usuários', descricao: 'Logs de atividade e métricas por usuário (admin)', icon: Users, formatos: ['PDF', 'Excel'], cor: 'text-purple-400', endpoint: '/api/relatorios/usuarios' },
]

export default function RelatoriosPage() {
  const [gerandoId, setGerandoId] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [moduloPersonalizado, setModuloPersonalizado] = useState('bugs')

  const gerarExcel = async (rows: Record<string, any>[], titulo: string) => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')
    XLSX.writeFile(wb, `${titulo.toLowerCase().replace(/\s+/g, '-')}.xlsx`)
  }

  const gerarPDF = async (rows: Record<string, any>[], titulo: string) => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(16)
    doc.text(titulo, 14, 20)
    doc.setFontSize(9)
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28)

    if (rows.length === 0) {
      doc.setFontSize(11)
      doc.text('Nenhum dado encontrado.', 14, 45)
      doc.save(`${titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`)
      return
    }

    const headers = Object.keys(rows[0])
    const colWidth = Math.min(35, Math.floor(270 / headers.length))
    let y = 40

    // Header
    doc.setFillColor(30, 30, 46)
    doc.rect(14, y - 5, 270, 8, 'F')
    doc.setTextColor(150, 150, 180)
    headers.forEach((h, i) => {
      doc.text(h.substring(0, 12), 16 + i * colWidth, y)
    })
    y += 8
    doc.setTextColor(220, 220, 220)

    rows.forEach((row, ri) => {
      if (y > 185) { doc.addPage(); y = 20 }
      if (ri % 2 === 0) {
        doc.setFillColor(20, 20, 30)
        doc.rect(14, y - 5, 270, 7, 'F')
      }
      headers.forEach((h, i) => {
        const val = String(row[h] ?? '').substring(0, 14)
        doc.text(val, 16 + i * colWidth, y)
      })
      y += 7
    })

    doc.save(`${titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`)
  }

  const gerar = async (r: RelatorioCard, formato: string) => {
    const key = `${r.id}-${formato}`
    setGerandoId(key)
    try {
      const params = new URLSearchParams()
      if (dataInicio) params.set('dataInicio', dataInicio)
      if (dataFim) params.set('dataFim', dataFim)

      const res = await fetch(`${r.endpoint}?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao buscar dados')
      }
      const { rows, titulo } = await res.json()

      if (formato === 'Excel') {
        await gerarExcel(rows, titulo)
      } else {
        await gerarPDF(rows, titulo)
      }
      toast.success(`${titulo} exportado em ${formato}!`)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar relatório')
    } finally {
      setGerandoId(null)
    }
  }

  const gerarPersonalizado = async (formato: string) => {
    const r = relatorios.find(x => x.id === moduloPersonalizado)
    if (r) await gerar(r, formato)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText size={22} /> Relatórios</h1>
        <p className="text-zinc-400 text-sm mt-1">Exporte dados do sistema em PDF ou Excel</p>
      </div>

      {/* Filtro de datas global */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-3">Filtro de período (opcional)</p>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-zinc-400 text-xs">De:</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-zinc-400 text-xs">Até:</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
          {(dataInicio || dataFim) && (
            <button onClick={() => { setDataInicio(''); setDataFim('') }}
              className="text-zinc-400 hover:text-white text-xs transition-colors">Limpar filtro</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatorios.map(r => {
          const Icon = r.icon
          return (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 bg-zinc-800 rounded-lg ${r.cor}`}><Icon size={20} /></div>
                <div>
                  <h3 className="text-white font-semibold">{r.titulo}</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">{r.descricao}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {r.formatos.map(f => {
                  const key = `${r.id}-${f}`
                  const carregando = gerandoId === key
                  const isExcel = f === 'Excel'
                  return (
                    <button key={f} onClick={() => gerar(r, f)} disabled={!!gerandoId}
                      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                      {carregando ? <Loader2 size={12} className="animate-spin" /> : isExcel ? <FileSpreadsheet size={12} /> : <Download size={12} />}
                      {f}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-1">Relatório Personalizado</h3>
        <p className="text-zinc-400 text-sm mb-4">Combine filtro de período + módulo e exporte</p>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={moduloPersonalizado} onChange={e => setModuloPersonalizado(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500">
            {relatorios.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}
          </select>
          <button onClick={() => gerarPersonalizado('Excel')} disabled={!!gerandoId}
            className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {gerandoId?.includes('Excel') ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
          </button>
          <button onClick={() => gerarPersonalizado('PDF')} disabled={!!gerandoId}
            className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {gerandoId?.includes('PDF') ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PDF
          </button>
        </div>
      </div>
    </div>
  )
}
