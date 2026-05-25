import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projetoId = searchParams.get('projetoId')
  if (!projetoId) return NextResponse.json({ error: 'projetoId obrigatório' }, { status: 400 })

  const requisitos = await prisma.requisito.findMany({
    where: { projetoId: Number(projetoId) },
    include: {
      casosTeste: {
        select: { id: true, titulo: true, status: true },
      },
      bugs: {
        select: { id: true, titulo: true, status: true, severidade: true },
      },
    },
    orderBy: { codigo: 'asc' },
  })

  const matriz = requisitos.map(r => ({
    requisito: { id: r.id, codigo: r.codigo, titulo: r.titulo, status: r.status },
    casosTeste: r.casosTeste,
    bugs: r.bugs,
  }))

  return NextResponse.json({ matriz })
}
