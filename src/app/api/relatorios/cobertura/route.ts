import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const projetos = await prisma.projeto.findMany({
    include: {
      requisitos: { select: { id: true, codigo: true, titulo: true, status: true, casosTeste: { select: { id: true } } } },
      casosTeste: { select: { id: true, status: true } },
    },
  })

  const rows = projetos.flatMap(p => {
    const totalReqs = p.requisitos.length
    const reqsComCasos = p.requisitos.filter(r => r.casosTeste.length > 0).length
    const totalCasos = p.casosTeste.length
    const aprovados = p.casosTeste.filter(c => c.status === 'Aprovado').length
    return [{
      Projeto: p.nome,
      'Total Requisitos': totalReqs,
      'Req com Cobertura': reqsComCasos,
      '% Cobertura Req': totalReqs ? `${Math.round(reqsComCasos / totalReqs * 100)}%` : '0%',
      'Total Casos': totalCasos,
      'Casos Aprovados': aprovados,
      '% Aprovação': totalCasos ? `${Math.round(aprovados / totalCasos * 100)}%` : '0%',
    }]
  })

  return NextResponse.json({ rows, titulo: 'Relatório de Cobertura', total: projetos.length })
}
