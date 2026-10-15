// Order lifecycle statuses and presentation constants

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'on-hold',
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

export const STATUS_CONFIG = {
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  processing: {
    label: 'Processing',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
    dot: 'bg-sky-400',
  },
  'on-hold': {
    label: 'On Hold',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    dot: 'bg-slate-400',
  },
  refunded: {
    label: 'Refunded',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    dot: 'bg-purple-400',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
    dot: 'bg-zinc-400',
  },
  failed: {
    label: 'Failed',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    dot: 'bg-rose-400',
  },
};
