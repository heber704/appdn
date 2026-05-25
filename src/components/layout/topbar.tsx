'use client'
// src/components/layout/topbar.tsx
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { cn, saudacao } from '@/lib/utils'

interface TopbarProps {
  user: {
    name?: string | null
    email?: string | null
    cargo: string
    situacao: string
  }
}

export function Topbar({ user }: TopbarProps) {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-bg-subtle flex-shrink-0">
      {/* Saudação */}
      <div>
        <p className="text-text-primary font-display font-semibold text-sm">
          {saudacao()}, {user.name?.split(' ')[0]}!
        </p>
        <p className="text-text-muted text-xs font-mono">{user.cargo}</p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {/* Notificações */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        {/* Status */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-elevated border border-border">
          <span className={cn('w-1.5 h-1.5 rounded-full',
            user.situacao === 'Ativo' ? 'bg-status-success' : 'bg-text-muted'
          )} />
          <span className="text-xs text-text-secondary font-mono">{user.situacao}</span>
        </div>

        {/* Menu usuário */}
        <div className="relative">
          <button
            onClick={() => setMenuAberto(v => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-bg-elevated transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-accent" />
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-text-muted transition-transform', menuAberto && 'rotate-180')} />
          </button>

          {menuAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-bg-elevated border border-border rounded-xl shadow-card z-20 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-text-primary text-sm font-medium truncate">{user.name}</p>
                  <p className="text-text-muted text-xs truncate">{user.email}</p>
                </div>
                <div className="p-1">
                  <a href="/conta"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-all"
                    onClick={() => setMenuAberto(false)}>
                    <User className="w-4 h-4" /> Minha conta
                  </a>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-status-danger hover:bg-status-danger/10 transition-all">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
