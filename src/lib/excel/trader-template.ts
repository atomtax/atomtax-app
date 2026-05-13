import { EXPENSE_NAMES } from '@/lib/constants/property-expense'
import { TRADER_EXPENSE_CATEGORY_OPTIONS } from '@/types/database'

const PROPERTY_TYPES = ['아파트', '빌라', '오피스텔', '단독주택', '기타']

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
]

const EXPENSE_HEADERS = [
  '사업자등록번호',
  '물건명',
  '순번',
  '비용명',
  '금액',
  '예정신고비용인정',
  '종합소득세비용인정',
  '카테고리',
]

const SAMPLE_PROPERTY_NAME =
  '화성 송산그린시티이지더원레이크뷰아파트 210동 1503호'

const SAMPLE_EXPENSES: Array<{
  row_no: number
  expense_name: string
  amount: number
  predeclaration: 'O' | 'X'
  income_tax: 'O' | 'X'
  category: string
}> = [
  { row_no: 1, expense_name: '취득가액', amount: 492_260_000, predeclaration: 'O', income_tax: 'O', category: '취득가액' },
  { row_no: 2, expense_name: '취득세 등', amount: 7_093_032, predeclaration: 'O', income_tax: 'O', category: '취득가액' },
  { row_no: 3, expense_name: '중개수수료', amount: 0, predeclaration: 'O', income_tax: 'O', category: '기타필요경비' },
  { row_no: 4, expense_name: '중개수수료', amount: 2_494_800, predeclaration: 'O', income_tax: 'O', category: '기타필요경비' },
  { row_no: 5, expense_name: '신탁말소비용', amount: 300_000, predeclaration: 'O', income_tax: 'O', category: '기타필요경비' },
  { row_no: 6, expense_name: '관리비정산', amount: 3_449_560, predeclaration: 'X', income_tax: 'O', category: '기타필요경비' },
  { row_no: 7, expense_name: '기타비용', amount: 364_090, predeclaration: 'X', income_tax: 'O', category: '기타필요경비' },
]

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E7FF' },
} as const

const VALIDATION_ROW_COUNT = 1000

/**
 * 매매사업자 업로드 양식 생성 — 드롭다운(data validation) 포함.
 * exceljs 사용 (data validation 쓰기 지원). 호출 측에서 dynamic import.
 */
export async function generateTraderTemplate(): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()

  // ===== 시트 1: 재고자산정리 =====
  const ws1 = wb.addWorksheet('재고자산정리')
  ws1.columns = [
    { header: PROPERTY_HEADERS[0], key: 'biz_num', width: 18 },
    { header: PROPERTY_HEADERS[1], key: 'property_name', width: 50 },
    { header: PROPERTY_HEADERS[2], key: 'location', width: 40 },
    { header: PROPERTY_HEADERS[3], key: 'property_type', width: 10 },
    { header: PROPERTY_HEADERS[4], key: 'acquisition_date', width: 12 },
    { header: PROPERTY_HEADERS[5], key: 'transfer_date', width: 12 },
    { header: PROPERTY_HEADERS[6], key: 'transfer_amount', width: 14 },
    { header: PROPERTY_HEADERS[7], key: 'prepaid_income_tax', width: 14 },
    { header: PROPERTY_HEADERS[8], key: 'prepaid_local_tax', width: 14 },
  ]
  const ws1Header = ws1.getRow(1)
  ws1Header.font = { bold: true }
  ws1Header.fill = HEADER_FILL

  ws1.addRow({
    biz_num: '207-12-99830',
    property_name: SAMPLE_PROPERTY_NAME,
    location: '경기도 화성시 수노을1로 191, 210동 15층1503호',
    property_type: '아파트',
    acquisition_date: '2025-02-12',
    transfer_date: '2025-07-21',
    transfer_amount: 567_000_000,
    prepaid_income_tax: 20_624_540,
    prepaid_local_tax: 2_062_450,
  })

  // 시트1 — 물건종류 (D열) 드롭다운
  for (let row = 2; row <= VALIDATION_ROW_COUNT; row++) {
    ws1.getCell(`D${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${PROPERTY_TYPES.join(',')}"`],
    }
  }

  // ===== 시트 2: 필요경비상세 =====
  const ws2 = wb.addWorksheet('필요경비상세')
  ws2.columns = [
    { header: EXPENSE_HEADERS[0], key: 'biz_num', width: 18 },
    { header: EXPENSE_HEADERS[1], key: 'property_name', width: 50 },
    { header: EXPENSE_HEADERS[2], key: 'row_no', width: 6 },
    { header: EXPENSE_HEADERS[3], key: 'expense_name', width: 16 },
    { header: EXPENSE_HEADERS[4], key: 'amount', width: 14 },
    { header: EXPENSE_HEADERS[5], key: 'predeclaration', width: 16 },
    { header: EXPENSE_HEADERS[6], key: 'income_tax', width: 18 },
    { header: EXPENSE_HEADERS[7], key: 'category', width: 14 },
  ]
  const ws2Header = ws2.getRow(1)
  ws2Header.font = { bold: true }
  ws2Header.fill = HEADER_FILL

  for (const e of SAMPLE_EXPENSES) {
    ws2.addRow({
      biz_num: '207-12-99830',
      property_name: SAMPLE_PROPERTY_NAME,
      row_no: e.row_no,
      expense_name: e.expense_name,
      amount: e.amount,
      predeclaration: e.predeclaration,
      income_tax: e.income_tax,
      category: e.category,
    })
  }

  // 시트2 드롭다운
  const expenseNamesFormula = `"${EXPENSE_NAMES.join(',')}"`
  const categoryFormula = `"${TRADER_EXPENSE_CATEGORY_OPTIONS.join(',')}"`
  for (let row = 2; row <= VALIDATION_ROW_COUNT; row++) {
    ws2.getCell(`D${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [expenseNamesFormula],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: '유효하지 않은 비용명',
      error: '드롭다운에서 선택하세요 (자유 입력 시 업로드 시 자동 매핑됨).',
    }
    ws2.getCell(`F${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"O,X"'],
    }
    ws2.getCell(`G${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"O,X"'],
    }
    ws2.getCell(`H${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [categoryFormula],
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
