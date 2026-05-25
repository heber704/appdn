'use client'
// src/components/layout/sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bug, TestTube2, FolderKanban, BookOpen,
  RotateCcw, ClipboardList, Server, BarChart3, Bell,
  Users, ShieldCheck, Settings, ChevronRight, PlayCircle, GitMerge
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',       icon: LayoutDashboard },
  { label: 'Projetos',        href: '/projetos',        icon: FolderKanban },
  { label: 'Bugs',            href: '/bugs',            icon: Bug },
  { label: 'Casos de Teste',  href: '/casos-teste',     icon: TestTube2 },
  { label: 'Execução',        href: '/execucoes',       icon: PlayCircle },
  { label: 'Ciclos',          href: '/ciclos',          icon: RotateCcw },
  { label: 'Requisitos',      href: '/requisitos',      icon: BookOpen },
  { label: 'Rastreabilidade', href: '/rastreabilidade', icon: GitMerge },
  { label: 'Planos',          href: '/planos',          icon: ClipboardList },
  { label: 'Ambientes',       href: '/ambientes',       icon: Server },
  { label: 'Relatórios',      href: '/relatorios',      icon: BarChart3 },
  { label: 'Solicitações',    href: '/solicitacoes',    icon: Bell },
]

const NAV_ADMIN: NavItem[] = [
  { label: 'Usuários',   href: '/usuarios',  icon: Users,       adminOnly: true },
  { label: 'Auditoria',  href: '/auditoria', icon: ShieldCheck, adminOnly: true },
]

interface SidebarProps {
  cargo: string
}

export function Sidebar({ cargo }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = cargo === 'Administrador'

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-bg-subtle border-r border-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-bold text-sm text-text-primary leading-tight">
            App DN
          </span>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <NavSection items={NAV} pathname={pathname} />

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-2">
              <p className="text-text-muted text-[10px] font-mono uppercase tracking-widest">Admin</p>
            </div>
            <NavSection items={NAV_ADMIN} pathname={pathname} />
          </>
        )}
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-border">
        <NavLink item={{ label: 'Configurações', href: '/conta', icon: Settings }} active={pathname === '/conta'} />
      </div>
    </aside>
  )
}

function NavSection({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <>
      {items.map(item => (
        <NavLink
          key={item.href}
          item={item}
          active={pathname === item.href || pathname.startsWith(item.href + '/')}
        />
      ))}
    </>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
        active
          ? 'bg-accent/15 text-accent border border-accent/20'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary')} />
      <span className="flex-1 font-medium">{item.label}</span>
      {active && <ChevronRight className="w-3 h-3 text-accent/60" />}
    </Link>
  )
}
