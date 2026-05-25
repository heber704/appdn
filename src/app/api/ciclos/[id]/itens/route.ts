import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { casoTesteIds } = await req.json()
  if (!casoTesteIds?.length) return NextResponse.json({ error: 'Nenhum caso selecionado' }, { status: 400 })

  const creates = casoTesteIds.map((cid: number) => ({
    cicloId: Number(params.id),
    casoTesteId: cid,
  }))

  // Upsert - skip duplicates
  await prisma.$transaction(
    creates.map((d: any) =>
      prisma.cicloItem.upsert({
        where: { cicloId_casoTesteId: { cicloId: d.cicloId, casoTesteId: d.casoTesteId } },
        create: d,
        update: {},
      })
    )
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { casoTesteId } = await req.json()
  await prisma.cicloItem.delete({
    where: { cicloId_casoTesteId: { cicloId: Number(params.id), casoTesteId: Number(casoTesteId) } },
  })

  return NextResponse.json({ ok: true })
}
