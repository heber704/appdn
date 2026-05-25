// src/app/api/ambientes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const ambientes = await prisma.ambiente.findMany({ orderBy: { id: 'desc' } })
  return NextResponse.json(ambientes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { nome, sistemaOperacional, navegador, versao, status } = await req.json()
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  const ambiente = await prisma.ambiente.create({
    data: { nome, sistemaOperacional: sistemaOperacional || null, navegador: navegador || null, versao: versao || null, status: status || 'Disponível' },
  })
  return NextResponse.json(ambiente, { status: 201 })
}
