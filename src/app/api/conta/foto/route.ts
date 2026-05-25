// src/app/api/conta/foto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('foto') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Apenas imagens' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Máximo 2MB' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  await prisma.usuario.update({
    where: { id: Number(session.user.id) },
    data: { fotoPerfil: buffer },
  })
  return NextResponse.json({ success: true })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(session.user.id) },
    select: { fotoPerfil: true },
  })
  if (!usuario?.fotoPerfil) return NextResponse.json({ error: 'Sem foto' }, { status: 404 })

  const base64 = Buffer.from(usuario.fotoPerfil).toString('base64')
  return NextResponse.json({ data: `data:image/jpeg;base64,${base64}` })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.usuario.update({
    where: { id: Number(session.user.id) },
    data: { fotoPerfil: null },
  })
  return NextResponse.json({ success: true })
}
