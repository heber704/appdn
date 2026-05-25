// src/app/api/bugs/[id]/imagens/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Upload de imagem
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('imagem') as File | null

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  // Valida tipo
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 })
  }

  // Limite de 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Imagem muito grande (máx. 5MB)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const imagem = await prisma.imagemBug.create({
    data: {
      bugId: Number(params.id),
      imagem: buffer,
      nome: file.name,
    },
    select: { id: true, nome: true, criadoEm: true },
  })

  return NextResponse.json(imagem, { status: 201 })
}

// Listar imagens (metadados)
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const imagens = await prisma.imagemBug.findMany({
    where: { bugId: Number(params.id) },
    select: { id: true, nome: true, criadoEm: true },
    orderBy: { criadoEm: 'asc' },
  })

  return NextResponse.json(imagens)
}
