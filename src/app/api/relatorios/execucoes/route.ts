import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')

  const execucoes = await prisma.execucaoTeste.findMany({
    where: {
      ...(dataInicio && dataFim && {
        iniciadoEm: { gte: new Date(dataInicio), lte: new Date(dataFim + 'T23:59:59') },
      }),
    },
    include: {
      casoTeste: { select: { titulo: true, tipo: true, prioridade: true } },
      executor: { select: { nome: true } },
      ciclo: { select: { nome: true } },
    },
    orderBy: { iniciadoEm: 'desc' },
  })

  const rows = execucoes.map(e => ({
    ID: e.id,
    'Caso de Teste': e.casoTeste?.titulo || '',
    Tipo: e.casoTeste?.tipo || '',
    Resultado: e.resultado,
    Executor: e.executor?.nome || '',
    Ciclo: e.ciclo?.nome || '',
    'Data de Execução': new Date(e.iniciadoEm).toLocaleDateString('pt-BR'),
    Observações: e.observacoes || '',
  }))

  return NextResponse.json({ rows, titulo: 'Relatório de Execuções', total: execucoes.length })
}
