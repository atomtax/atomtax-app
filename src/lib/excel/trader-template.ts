import * as XLSX from 'xlsx'

const PROPERTY_HEADERS = [
  '사업자등록번호',
  '물건명',
  '주소',
  '물건종류',
  '취득일',
  '양도일',
  '양도가액',
  '기납부종소세',
  '기납부지방세',
] as const

const EXPENSE_HEADERS = [
  '사업자등록번호',
  '물건명',
  '순번',
  '비용명',
  '금액',
  '예정신고비용인정',
  '종합소득세비용인정',
  '카테고리',
] as const

const SAMPLE_PROPERTY: ReadonlyArray<string | number> = [
  '207-12-99830',
  '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호',
  '경기도 화성시 수노을1로 191, 210동 15층1503호',
  '아파트',
  '2025-02-12',
  '2025-07-21',
  567_000_000,
  20_624_540,
  2_062_450,
]

const SAMPLE_EXPENSES: ReadonlyArray<ReadonlyArray<string | number>> = [
  ['207-12-99830', '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호', 1, '취득가액', 492_260_000, 'O', 'O', '취득가액'],
  ['207-12-99830', '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호', 2, '등기비용, 취득세', 7_093_032, 'O', 'O', '취득가액'],
  ['207-12-99830', '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호', 3, '취득중개수수료', 0, 'O', 'O', '기타필요경비'],
  ['207-12-99830', '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호', 4, '매도중개수수료', 2_494_800, 'O', 'O', '기타필요경비'],
  ['207-12-99830', '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호', 5, '신탁해지비용', 300_000, 'O', 'O', '기타필요경비'],
  ['207-12-99830', '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호', 6, '중간관리비&관리비 납부', 3_449_560, 'X', 'O', '기타필요경비'],
  ['207-12-99830', '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호', 7, '재산세 납부', 364_090, 'X', 'O', '기타필요경비'],
]

export function generateTraderTemplate(): Blob {
  const wb = XLSX.utils.book_new()

  const propertySheet = XLSX.utils.aoa_to_sheet([
    [...PROPERTY_HEADERS],
    [...SAMPLE_PROPERTY],
  ])
  propertySheet['!cols'] = [
    { wch: 14 },
    { wch: 50 },
    { wch: 40 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, propertySheet, '재고자산정리')

  const expenseSheet = XLSX.utils.aoa_to_sheet([
    [...EXPENSE_HEADERS],
    ...SAMPLE_EXPENSES.map((row) => [...row]),
  ])
  expenseSheet['!cols'] = [
    { wch: 14 },
    { wch: 50 },
    { wch: 6 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, expenseSheet, '필요경비상세')

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
