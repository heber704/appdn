// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, pattern = 'dd/MM/yyyy') {
  return format(new Date(date), pattern, { locale: ptBR })
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  return name.length <= 2
    ? `${name[0]}***@${domain}`
    : `${name[0]}***@${domain}`
}

// Feriados nacionais fixos do Brasil
const feriadosFixos: [number, number][] = [
  [1, 1], [21, 4], [1, 5], [7, 9],
  [12, 10], [2, 11], [15, 11], [20, 11], [25, 12],
]

function calcularPascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

export function isFeriado(data: Date): boolean {
  const dia = data.getDate()
  const mes = data.getMonth() + 1
  if (feriadosFixos.some(([d, m]) => d === dia && m === mes)) return true

  const pascoa = calcularPascoa(data.getFullYear())
  const checks = [
    new Date(pascoa.getTime() - 2 * 86400000),  // Sexta Santa
    new Date(pascoa.getTime() - 47 * 86400000), // Segunda Carnaval
    new Date(pascoa.getTime() - 48 * 86400000), // Terça Carnaval
    new Date(pascoa.getTime() + 60 * 86400000), // Corpus Christi
    pascoa,
  ]
  return checks.some(d => d.toDateString() === data.toDateString())
}

export function isDiaDescanso(data: Date): boolean {
  const dow = data.getDay()
  return dow === 0 || dow === 6 || isFeriado(data)
}

export function saudacao(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}
