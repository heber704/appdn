// src/app/api/bugs/[id]/imagens/[imgId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Download da imagem como base64
export async function GET(_: NextRequest, { params }: { params: { id: string; imgId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const img = await prisma.imagemBug.findUnique({
    where: { id: Number(params.imgId) },
  })

  if (!img) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const base64 = Buffer.from(img.imagem).toString('base64')
  // Tenta detectar tipo pela extensão
  const ext = img.nome.split('.').pop()?.toLowerCase() || 'png'
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`

  return NextResponse.json({ id: img.id, nome: img.nome, data: `data:${mime};base64,${base64}` })
}

// Excluir imagem
export async function DELETE(_: NextRequest, { params }: { params: { id: string; imgId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await prisma.imagemBug.delete({ where: { id: Number(params.imgId) } })
  return NextResponse.json({ success: true })
}
