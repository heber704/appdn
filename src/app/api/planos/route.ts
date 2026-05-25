import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const busca = searchParams.get('busca') || ''
  const status = searchParams.get('status') || 'TODOS'

  const where: any = {}
  if (busca) where.OR = [{ titulo: { contains: busca } }, { descricao: { contains: busca } }]
  if (status !== 'TODOS') where.status = status

  try {
    const planos = await prisma.planoTeste.findMany({
      where,
      include: {
        projeto: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: 'desc' },
    })
    return NextResponse.json({ planos })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ planos: [] })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const plano = await prisma.planoTeste.create({
    data: {
      titulo: body.titulo,
      objetivo: body.objetivo,
      escopo: body.escopo,
      estrategia: body.estrategia,
      projeto_id: body.projeto_id,
      status: 'Rascunho',
    },
  })
  return NextResponse.json({ plano }, { status: 201 })
}
