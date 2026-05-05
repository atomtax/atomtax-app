export const OFFICE = {
  name: '아톰세무회계',
  representative: '김경태',
  representativeTitle: '대표세무사',
  phone: '010-3137-9338',
  address: '서울특별시 광진구 동일로 112, 5층 (화양동)',
  bank: '하나은행',
  account: '146-910369-94207',
  accountHolder: '김경태(아톰세무회계)',
  stampImage: '/stamp.png',
} as const

export const formatAccount = () =>
  `${OFFICE.bank} ${OFFICE.account} (예금주: ${OFFICE.accountHolder})`
