// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const situacao = searchParams.get('situacao')
  const cargo = searchParams.get('cargo')

  const usuarios = await prisma.usuario.findMany({
    where: {
      ...(situacao && { situacao }),
      ...(cargo && { cargo }),
      ...(q && {
        OR: [
          { nome: { contains: q } },
          { login: { contains: q } },
          { email: { contains: q } },
        ],
      }),
    },
    select: {
      id: true, nome: true, email: true, login: true,
      cargo: true, situacao: true, bloqueioTipo: true, criadoEm: true,
    },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.cargo !== 'Administrador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, email, login, senha, cargo } = body

  if (!nome?.trim() || !email?.trim() || !login?.trim() || !senha || !cargo) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
  }

  if (senha.length < 6) return NextResponse.json({ error: 'Senha muito curta' }, { status: 400 })

  const existe = await prisma.usuario.findFirst({ where: { OR: [{ login }, { email }] } })
  if (existe) return NextResponse.json({ error: existe.login === login ? 'Login já existe' : 'E-mail já existe' }, { status: 409 })

  const senhaHash = await hash(senha, 12)
  const usuario = await prisma.usuario.create({
    data: { nome, email, login, senha: senhaHash, cargo, situacao: 'Ativo' },
    select: { id: true, nome: true, login: true, cargo: true, situacao: true },
  })

  await prisma.auditoria.create({
    data: { usuarioId: Number(session.user.id), acao: 'CRIAR', entidade: 'usuarios', entidadeId: usuario.id, detalhes: `Usuário "${login}" criado pelo admin` },
  })

  return NextResponse.json(usuario, { status: 201 })
}
