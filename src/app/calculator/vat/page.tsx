import { Building2 } from 'lucide-react'
import { OpenCalculatorButton } from './OpenCalculatorButton'

const FEATURES: { label: string; description: string; available: boolean }[] = [
  {
    label: '자동 주소 검색',
    description: 'Daum 주소검색 API로 정확한 도로명·지번 주소를 입력합니다.',
    available: true,
  },
  {
    label: '정확한 수식 적용',
    description: '엑셀 기준 부가가치세 안분 산식을 그대로 구현했습니다.',
    available: true,
  },
  {
    label: '건물기준시가 자동 계산',
    description:
      '2025년 국세청 고시 기준 (구조·용도·위치·잔가율)으로 자동 계산합니다.',
    available: true,
  },
  {
    label: '토지공시지가 자동 조회',
    description:
      'VWorld API로 주소 → 개별공시지가 자동 매핑 (실패 시 직접 입력 폴백).',
    available: true,
  },
  {
    label: 'OCR 자동 추출',
    description: '등기부등본 사진에서 면적·소재지 자동 추출 (2단계 예정).',
    available: false,
  },
  {
    label: 'PDF 다운로드',
    description: '계산 결과를 PDF로 저장 (선택 기능, 추후).',
    available: false,
  },
]

export default function VatCalculatorLanding() {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 text-white"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Building2 size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🏢 건물분 부가가치세 계산기
        </h1>
        <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
          매매사업자용 부가가치세를 자동으로 계산합니다. 주소 검색과 안분 산식 적용까지
          간편하게 처리하세요.
        </p>
        <div className="mt-6">
          <OpenCalculatorButton />
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-3">주요 기능</h2>
        <FeatureGroup
          title="✅ 현재 사용 가능"
          features={FEATURES.filter((f) => f.available)}
          available
        />
        <div className="mt-5 pt-5 border-t border-gray-100">
          <FeatureGroup
            title="🔜 2단계 예정"
            features={FEATURES.filter((f) => !f.available)}
            available={false}
          />
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-blue-900 mb-2">ℹ️ 사용 안내</h3>
        <ul className="text-xs text-blue-800 space-y-1.5 leading-relaxed">
          <li>· 계산기는 새 창으로 열립니다.</li>
          <li>· 로그인 없이 링크를 공유해 다른 사람도 사용할 수 있습니다.</li>
          <li>· 각 계산은 독립적으로 동작하며 결과는 저장되지 않습니다.</li>
          <li>· 새로고침 시 입력값과 결과가 모두 초기화됩니다.</li>
        </ul>
      </section>

      <p className="text-center text-xs text-gray-400">
        © 아톰세무회계 — 부가가치세 자동 계산기
      </p>
    </div>
  )
}

function FeatureGroup({
  title,
  features,
  available,
}: {
  title: string
  features: { label: string; description: string }[]
  available: boolean
}) {
  return (
    <div>
      <p
        className={`text-xs font-semibold mb-2 ${
          available ? 'text-green-700' : 'text-gray-500'
        }`}
      >
        {title}
      </p>
      <ul className="space-y-2">
        {features.map((f) => (
          <li
            key={f.label}
            className={`flex items-start gap-3 ${available ? '' : 'opacity-70'}`}
          >
            <span
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {available ? '✓' : '·'}
            </span>
            <div className="text-sm">
              <p
                className={`font-medium ${
                  available ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {f.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
