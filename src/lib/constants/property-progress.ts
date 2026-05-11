import type { TraderProgressStatus } from '@/types/database'

export const PROGRESS_OPTIONS: TraderProgressStatus[] = [
  '미확인',
  '확인',
  '위하고입력',
  '고객안내',
  '신고완료',
]

/** 진행단계별 배지 색상 (Tailwind 클래스) */
export const PROGRESS_STYLES: Record<
  TraderProgressStatus,
  { bg: string; text: string; border: string }
> = {
  미확인: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  확인: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  위하고입력: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  고객안내: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  신고완료: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
}
