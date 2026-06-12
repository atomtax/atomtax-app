/**
 * 위하고 검증용 픽스처 Request URL 상수 (Phase 7 / 1단계, 부록 A)
 * 실제 캡처 — "비더에그" gisu=3. 파서 검증 + 수동 수집 테스트용.
 */

export const FIXTURE_URLS = {
  sabc0102:
    'https://api.wehago.com/smarta/sabc0102/companyinfo/?timestamp=1781252722&cno_taxnum=5495377&cno=10959837&ccode=biz202511270023469&user_id=atomtax&gisu=3&ym_insa=2025&oldview=0&locale=ko',
  sacl0106:
    'https://api.wehago.com/smarta/sacl0106/0/?ty_year=0&acc_start_date=20250101&acc_end_date=20251231&end_date=202512&ty_private=1&ty_stop=2&ty_call=20&ty_lang=1&gisu=3&ty_semok=0&rate_option=0&timestamp=1781252889&cno=10959837&ccode=biz202511270023469&user_id=atomtax&ym_insa=2025&cno_taxnum=5495377&oldview=0&locale=ko',
  swsa0105:
    'https://api.wehago.com/smarta/swsa0105/total/?dm_fndbegin=202501&dm_fndend=202512&code_type=0&search_type=0&order_by=0&ty_retire=0&timestamp=1781253027&cno_taxnum=5495377&cno=10959837&ccode=biz202511270023469&user_id=atomtax&gisu=3&ym_insa=2025&oldview=0&locale=ko',
  saas0106:
    'https://api.wehago.com/smarta/saas0106/tab1/?gisu=3&da_date=202512&env_acc=0&pass_sanggak=1&sanggak=1&ty_cost=0&da_beginacc=20250101&da_endacc=20251231&is_magam=1&search_option=word_search&timestamp=1781253151&cno_taxnum=5495377&cno=10959837&ccode=biz202511270023469&user_id=atomtax&ym_insa=2025&oldview=0&locale=ko',
  swbu0111:
    'https://api.wehago.com/smarta/swbu0111/?from=202501&to=202512&SelectField=1&timestamp=1781253111&cno_taxnum=5495377&cno=10959837&ccode=biz202511270023469&user_id=atomtax&gisu=3&ym_insa=2025&oldview=0&locale=ko',
} as const
