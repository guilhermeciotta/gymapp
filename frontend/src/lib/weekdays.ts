export const WEEKDAYS = [
  { value: 'domingo', label: 'Domingo' },
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
] as const

export type Weekday = (typeof WEEKDAYS)[number]['value']

const WEEKDAY_BY_INDEX: Weekday[] = WEEKDAYS.map((w) => w.value)

export function todayWeekday(): Weekday {
  return WEEKDAY_BY_INDEX[new Date().getDay()]
}

export function weekdayLabel(value: string | null): string | null {
  return WEEKDAYS.find((w) => w.value === value)?.label ?? null
}
