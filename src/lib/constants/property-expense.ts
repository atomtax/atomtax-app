/** 매매사업자 필요경비 비용명 드롭다운 옵션 */
export const EXPENSE_NAMES = [
  '취득가액',
  '취득세 등',
  '신탁말소비용',
  '중개수수료',
  '관리비정산',
  '기타비용',
] as const

export type ExpenseName = (typeof EXPENSE_NAMES)[number]
