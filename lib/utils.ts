// =====================================================
// PizzaLanche Pro — lib/utils.ts
// Formatting helpers
// =====================================================

export function fmt(val: number): string {
  return `R$ ${(+val || 0).toFixed(2).replace('.', ',')}`;
}

export function fmtId(n: number): string {
  return `#${String(n).padStart(3, '0')}`;
}

export function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? diff % 60 + 'm' : ''}`;
}

export function getHourLabel(hoursAgo: number): string {
  const d = new Date(Date.now() - hoursAgo * 3600000);
  return d.getHours() + 'h';
}

export function nowTimeStr(): string {
  const d = new Date();
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function elapsedMinutes(ms: number): number {
  return Math.floor((Date.now() - ms) / 60000);
}

export function timerClass(minutes: number): string {
  if (minutes < 10) return 'ok';
  if (minutes < 20) return 'warn';
  return 'danger';
}
