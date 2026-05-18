/**
 * 건축물 용도별 지수 (시행령 별표 - 부가가치세 계산용)
 *
 * 구분 Ⅰ 주거용 (용도번호 1~2)
 * 구분 Ⅱ 상업용·업무용 (용도번호 3~45)
 *
 * 보류: 구분 Ⅲ 산업용·기타 (46~60), 구분 Ⅳ 기계식주차전용빌딩 (61) — 별도 PR
 */

export type BuildingUseCategory = '주거용' | '상업용';

export type BuildingUseSubCategory =
  | '주거시설'
  | '숙박시설'
  | '판매시설'
  | '운수시설'
  | '위락시설'
  | '문화및집회시설'
  | '종교시설'
  | '운동시설'
  | '의료시설'
  | '업무시설'
  | '방송통신시설'
  | '관광휴게시설'
  | '교육연구시설'
  | '노유자시설'
  | '수련시설'
  | '근린생활시설'
  | '묘지관련시설'
  | '장례식장';

export interface BuildingUse {
  /** 시행령 용도번호 (1~45) */
  code: number;
  /** 1차 분기 */
  category: BuildingUseCategory;
  /** 2차 분류 (상업용 내부 그룹화용) */
  subCategory: BuildingUseSubCategory;
  /** UI 드롭다운 표시용 짧은 이름 */
  name: string;
  /** 시행령 원문 설명 (툴팁/도움말용) */
  description: string;
  /** 용도지수 */
  index: number;
}

export const BUILDING_USES: BuildingUse[] = [
  // ─────────────────────────── Ⅰ 주거용 ───────────────────────────
  {
    code: 1, category: '주거용', subCategory: '주거시설',
    name: '아파트',
    description: '아파트',
    index: 110,
  },
  {
    code: 2, category: '주거용', subCategory: '주거시설',
    name: '단독·다세대·연립·기숙사 등',
    description:
      '단독주택(노인복지주택 제외), 다중주택, 다가구주택, 연립주택, 다세대주택, 기숙사(학생복지주택 및 공공매입임대주택 중 독립된 주거의 형태를 갖추지 않은 것 포함), 도시형 생활주택 등 기타 주거용건물',
    index: 100,
  },
  {
    // 시행령 외 편의 항목 (PR #98): 오피스텔은 시행령상 업무시설(코드 28)이지만
    // 주거용 임대 케이스 편의를 위해 주거용 카테고리에도 노출.
    // 지수 140은 시행령 코드 28과 동일 → 어느 쪽으로 선택해도 부가세 결과 동일.
    code: 100, category: '주거용', subCategory: '주거시설',
    name: '오피스텔 (주거용 임대)',
    description:
      '오피스텔 — 시행령상 업무시설(코드 28)로 분류되나, 주거용 임대 케이스 편의를 위해 주거용 카테고리에 추가. 지수는 동일(140).',
    index: 140,
  },

  // ────────────────────── Ⅱ 상업용·업무용 — 숙박시설 ──────────────────────
  {
    code: 3, category: '상업용', subCategory: '숙박시설',
    name: '관광호텔 5/4성급',
    description: '관광호텔(5성급·4성급): 관광진흥법상 관광숙박시설',
    index: 140,
  },
  {
    code: 4, category: '상업용', subCategory: '숙박시설',
    name: '호텔·콘도·펜션 등',
    description:
      '호텔(공중위생법상 일반숙박시설), 관광호텔(3성급 이하), 수상관광호텔, 한국전통호텔, 가족호텔, 호스텔, 소형호텔, 의료관광호텔 및 휴양 콘도미니엄, 펜션(관광진흥법상 관광편의시설)',
    index: 130,
  },
  {
    code: 5, category: '상업용', subCategory: '숙박시설',
    name: '도시민박·한옥체험시설',
    description:
      '외국인관광 도시민박(홈스테이, 게스트하우스 포함), 한옥체험시설(관광진흥법상 관광편의시설)',
    index: 120,
  },
  {
    code: 6, category: '상업용', subCategory: '숙박시설',
    name: '여관(모텔 포함)',
    description: '여관(모텔 포함)',
    index: 115,
  },
  {
    code: 7, category: '상업용', subCategory: '숙박시설',
    name: '다중생활시설',
    description: '다중생활시설(제2종 근린생활시설에 해당되는 것은 제외)',
    index: 105,
  },
  {
    code: 8, category: '상업용', subCategory: '숙박시설',
    name: '여인숙',
    description: '여인숙',
    index: 100,
  },

  // ────────────────────── 판매시설 ──────────────────────
  {
    code: 9, category: '상업용', subCategory: '판매시설',
    name: '백화점',
    description: '백화점',
    index: 135,
  },
  {
    code: 10, category: '상업용', subCategory: '판매시설',
    name: '대형점·쇼핑센터·복합쇼핑몰',
    description:
      '소매점 중 대형점(대형마트, 전문점 등으로서 매장 면적 3,000㎡ 이상), 쇼핑센터, 복합쇼핑몰, 기타 대규모점포',
    index: 125,
  },
  {
    code: 11, category: '상업용', subCategory: '판매시설',
    name: '일반상점·기타 판매시설',
    description:
      '일반상점(슈퍼마켓 등 일용품 소매점으로서 바닥면적 합계 1,000㎡ 이상 ~ 3,000㎡ 미만), 기타 판매 및 영업시설',
    index: 100,
  },
  {
    code: 12, category: '상업용', subCategory: '판매시설',
    name: '도매시장·전통시장·공판장',
    description:
      '도매시장(도매위주 매장면적 3,000㎡ 이상), 전통(재래)시장, 농수축화훼공판장, 경매장',
    index: 85,
  },

  // ────────────────────── 운수시설 ──────────────────────
  {
    code: 13, category: '상업용', subCategory: '운수시설',
    name: '여객터미널·철도·공항·항만',
    description: '여객자동차터미널, 철도시설, 공항시설, 항만시설',
    index: 120,
  },

  // ────────────────────── 위락시설 ──────────────────────
  {
    code: 14, category: '상업용', subCategory: '위락시설',
    name: '무도장',
    description: '무도장',
    index: 140,
  },
  {
    code: 15, category: '상업용', subCategory: '위락시설',
    name: '유흥주점·카지노',
    description: '유흥주점 및 이와 유사한 것, 카지노영업소',
    index: 135,
  },
  {
    code: 16, category: '상업용', subCategory: '위락시설',
    name: '유원시설업 시설',
    description:
      '관광진흥법에 의한 유원시설업의 시설 기타 이와 유사한 것(제2종 근린생활시설, 운동시설에 해당되는 것은 제외)',
    index: 120,
  },
  {
    code: 17, category: '상업용', subCategory: '위락시설',
    name: '단란주점',
    description: '단란주점(풍속영업시설에 해당되는 것은 제외)',
    index: 115,
  },
  {
    code: 18, category: '상업용', subCategory: '위락시설',
    name: '무도학원',
    description: '무도학원',
    index: 90,
  },

  // ────────────────────── 문화 및 집회시설 ──────────────────────
  {
    code: 19, category: '상업용', subCategory: '문화및집회시설',
    name: '집회장(장외발매소 등)',
    description:
      '집회장(경마·경륜·경정 장외발매소 및 전화투표소)으로서 제2종 근린생활시설에 해당하지 아니하는 것',
    index: 130,
  },
  {
    code: 20, category: '상업용', subCategory: '문화및집회시설',
    name: '예식장·공연장·공회당',
    description:
      '예식장, 공연장(극장, 영화관, 연예장, 음악당, 서커스장, 비디오물 소극장 등), 집회장(공회당, 회의장 등)',
    index: 120,
  },
  {
    code: 21, category: '상업용', subCategory: '문화및집회시설',
    name: '동물원·식물원·전시장',
    description:
      '동물원, 식물원, 수족관, 전시장(박물관, 미술관, 과학관, 문화관, 체험관, 기념관, 산업전시장, 박람회장 등)',
    index: 110,
  },
  {
    code: 22, category: '상업용', subCategory: '문화및집회시설',
    name: '관람장·체육관·운동장',
    description:
      '관람장(경마장, 경륜장, 경정장, 자동차경기장, 기타 이와 유사한 것), 체육관·운동장으로서 관람석의 바닥면적의 합계가 1,000㎡ 이상인 것',
    index: 105,
  },

  // ────────────────────── 종교시설 ──────────────────────
  {
    code: 23, category: '상업용', subCategory: '종교시설',
    name: '교회·성당·사찰 등',
    description:
      '교회·성당·사찰·기도원·수도원·수녀원·제실·사당 등 종교집회장과 종교집회장 내 설치하는 봉안당으로서 제2종 근린생활시설에 해당하지 아니하는 것',
    index: 100,
  },

  // ────────────────────── 운동시설 ──────────────────────
  {
    code: 24, category: '상업용', subCategory: '운동시설',
    name: '골프장·스키장·종합체육시설',
    description:
      '골프장, 스키장, 자동차경주장, 승마장, 수영장, 볼링장, 스케이트장, 종합체육시설업',
    index: 125,
  },
  {
    code: 25, category: '상업용', subCategory: '운동시설',
    name: '기타 체육시설',
    description: '체육시설의설치및이용에관한법률에 따른 시설 중 용도번호 24에 속하지 아니하는 것',
    index: 105,
  },

  // ────────────────────── 의료시설 ──────────────────────
  {
    code: 26, category: '상업용', subCategory: '의료시설',
    name: '종합병원',
    description: '종합병원',
    index: 125,
  },
  {
    code: 27, category: '상업용', subCategory: '의료시설',
    name: '일반·치과·한방·요양 등 병원',
    description:
      '일반병원, 치과병원, 한방병원, 정신병원, 요양병원, 격리병원(전염병원, 마약진료소 등)',
    index: 110,
  },

  // ────────────────────── 업무시설 ──────────────────────
  {
    code: 28, category: '상업용', subCategory: '업무시설',
    name: '오피스텔',
    description: '오피스텔(주거용, 사무용)',
    index: 140,
  },
  {
    code: 29, category: '상업용', subCategory: '업무시설',
    name: '사무소·금융업소·출판사 등',
    description:
      '사무소, 금융업소, 결혼상담소 등 소개업소, 출판사, 신문사 등으로서 제2종 근린생활시설에 해당하지 아니하는 것',
    index: 115,
  },

  // ────────────────────── 방송통신시설 ──────────────────────
  {
    code: 30, category: '상업용', subCategory: '방송통신시설',
    name: '방송국·통신용시설',
    description:
      '방송국(방송프로그램제작시설 및 송신·수신·중계 시설을 포함), 촬영소, 전신전화국, 통신용시설',
    index: 110,
  },

  // ────────────────────── 관광휴게시설 ──────────────────────
  {
    code: 31, category: '상업용', subCategory: '관광휴게시설',
    name: '야외음악당·관광지 부수 시설',
    description:
      '야외음악당, 야외극장, 어린이회관, 관망탑, 휴게소, 공원·유원지, 관광지에 부수되는 시설',
    index: 110,
  },

  // ────────────────────── 교육연구시설 ──────────────────────
  {
    code: 32, category: '상업용', subCategory: '교육연구시설',
    name: '학원·교습소',
    description:
      '학원(자동차학원·무도학원 및 정보통신기술을 활용하여 원격으로 교습하는 것은 제외), 교습소(자동차교습·무도교습 및 정보통신기술을 활용하여 원격으로 교습하는 것은 제외)으로서 제2종 근린생활시설에 해당하지 않는 것',
    index: 107,
  },
  {
    code: 33, category: '상업용', subCategory: '교육연구시설',
    name: '학교·교육원·연구소·도서관',
    description:
      '학교, 교육원(연수원 포함), 직업훈련소(운전 및 정비관련 직업훈련소는 제외), 연구소, 도서관으로 제2종 근린생활시설에 해당하지 않는 것',
    index: 100,
  },

  // ────────────────────── 노유자시설 ──────────────────────
  {
    code: 34, category: '상업용', subCategory: '노유자시설',
    name: '아동·노인·사회복지시설',
    description:
      '아동관련시설(제1종 근린생활시설에 해당하는 것은 제외) 및 노인복지시설(단독주택 및 공동주택에 해당하는 것은 제외), 기타 사회복지시설 및 근로복지시설',
    index: 107,
  },
  {
    code: 35, category: '상업용', subCategory: '노유자시설',
    name: '고아원·경로당 등',
    description:
      '고아원, 노인주거복지시설(양로원 등) 및 경로당, 용도번호 34번을 제외한 기타 이와 유사한 시설',
    index: 80,
  },

  // ────────────────────── 수련시설 ──────────────────────
  {
    code: 36, category: '상업용', subCategory: '수련시설',
    name: '청소년수련시설',
    description:
      '청소년수련관, 청소년문화의집, 청소년특화시설, 유스호스텔, 청소년수련원, 청소년야영장, 기타 이와 유사한 것',
    index: 110,
  },

  // ────────────────────── 근린생활시설 ──────────────────────
  {
    code: 37, category: '상업용', subCategory: '근린생활시설',
    name: '목욕장 3,000㎡ 이상',
    description: '목욕장으로서 바닥면적의 합계가 3,000㎡ 이상인 것',
    index: 130,
  },
  {
    code: 38, category: '상업용', subCategory: '근린생활시설',
    name: '목욕장 1,000~3,000㎡',
    description: '목욕장으로서 바닥면적의 합계가 1,000㎡ 이상 ~ 3,000㎡ 미만인 것',
    index: 115,
  },
  {
    code: 39, category: '상업용', subCategory: '근린생활시설',
    name: '목욕장 1,000㎡ 미만',
    description: '목욕장으로서 바닥면적의 합계가 1,000㎡ 미만인 것',
    index: 110,
  },
  {
    code: 40, category: '상업용', subCategory: '근린생활시설',
    name: '풍속영업시설(노래방·게임장 등)',
    description:
      '풍속영업시설 — 단란주점(150㎡ 미만), 인터넷컴퓨터게임시설제공업(500㎡ 이상), 청소년·일반·복합 게임제공업, 사행성게임물제공업, 사행행위영업, 비디오물감상실, 안마시술소, 노래연습장',
    index: 105,
  },
  {
    code: 41, category: '상업용', subCategory: '근린생활시설',
    name: '일반 근린생활시설(음식점·미용원·소형 학원 등)',
    description:
      '제1종·제2종 근린생활시설 — 슈퍼마켓(1,000㎡ 미만), 일반음식점, 휴게음식점, 제과점, 기원, 서점, 이용원, 미용원, 세탁소, 의원·치과·한의원·산후조리원·안마원, 체육시설(500㎡ 미만), 사무소·금융업소(500㎡ 미만), 학원·교습소(500㎡ 미만), 사진관, 동물병원, 독서실 등 기타',
    index: 100,
  },

  // ────────────────────── 묘지관련시설 ──────────────────────
  {
    code: 42, category: '상업용', subCategory: '묘지관련시설',
    name: '화장시설·봉안당',
    description:
      '화장시설, 봉안당(종교시설에 해당하는 것 제외), 묘지와 자연장지에 부수되는 건축물',
    index: 130,
  },
  {
    code: 43, category: '상업용', subCategory: '묘지관련시설',
    name: '동물 화장·납골시설',
    description: '동물화장시설, 동물건조장 시설 및 동물 전용의 납골시설',
    index: 105,
  },

  // ────────────────────── 장례식장 ──────────────────────
  {
    code: 44, category: '상업용', subCategory: '장례식장',
    name: '장례식장',
    description: '장례식장(종합병원 부속 장례식장 포함)',
    index: 115,
  },
  {
    code: 45, category: '상업용', subCategory: '장례식장',
    name: '동물 전용 장례식장',
    description: '동물 전용 장례식장',
    index: 105,
  },
];

// ─────────────────────────── 헬퍼 ───────────────────────────

/** 카테고리별 용도 목록 조회 */
export function getBuildingUsesByCategory(
  category: BuildingUseCategory,
): BuildingUse[] {
  return BUILDING_USES.filter((u) => u.category === category);
}

/** 용도번호로 단일 조회 */
export function getBuildingUseByCode(code: number): BuildingUse | undefined {
  return BUILDING_USES.find((u) => u.code === code);
}

/** 카테고리별 + 서브카테고리별 그룹화 (UI optgroup용) */
export function groupBuildingUsesBySubCategory(
  category: BuildingUseCategory,
): Record<string, BuildingUse[]> {
  const filtered = getBuildingUsesByCategory(category);
  return filtered.reduce(
    (acc, use) => {
      const key = use.subCategory;
      if (!acc[key]) acc[key] = [];
      acc[key].push(use);
      return acc;
    },
    {} as Record<string, BuildingUse[]>,
  );
}

/** 서브카테고리 표시 순서 (사용자 UX용) */
export const SUB_CATEGORY_ORDER: BuildingUseSubCategory[] = [
  '주거시설',
  '숙박시설',
  '판매시설',
  '운수시설',
  '위락시설',
  '문화및집회시설',
  '종교시설',
  '운동시설',
  '의료시설',
  '업무시설',
  '방송통신시설',
  '관광휴게시설',
  '교육연구시설',
  '노유자시설',
  '수련시설',
  '근린생활시설',
  '묘지관련시설',
  '장례식장',
];
