import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const formato = searchParams.get('formato') || 'json'
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')

  const bugs = await prisma.bug.findMany({
    where: {
      ...(dataInicio && dataFim && {
        criadoEm: { gte: new Date(dataInicio), lte: new Date(dataFim + 'T23:59:59') },
      }),
    },
    include: {
      projeto: { select: { nome: true } },
      responsavel: { select: { nome: true } },
      reportadoPor: { select: { nome: true } },
    },
    orderBy: { criadoEm: 'desc' },
  })

  const rows = bugs.map(b => ({
    ID: b.id,
    Título: b.titulo,
    Status: b.status,
    Severidade: b.severidade,
    Prioridade: b.prioridade,
    Projeto: b.projeto?.nome || '',
    Responsável: b.responsavel?.nome || '',
    Reportado: b.reportadoPor?.nome || '',
    'Criado em': new Date(b.criadoEm).toLocaleDateString('pt-BR'),
  }))

  if (formato === 'json') return NextResponse.json({ rows })

  // Return data for client-side Excel/PDF generation
  return NextResponse.json({ rows, titulo: 'Relatório de Bugs', total: bugs.length })
}
