import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '아톰랩',
}

export default function AtomLabPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold tracking-wider font-mono">
          EXPERIMENT
        </div>
        <span className="text-xs text-gray-500">베타 기능 실험실</span>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">아톰랩</h1>
      <p className="text-gray-600 mb-8 leading-relaxed">
        새로운 기능을 실험하는 공간입니다. 정식 배포 전 베타 도구, AI 기반 분석,
        프로토타입이 여기에 모입니다.
      </p>
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400 bg-white">
        <div className="text-2xl mb-2">🧪</div>
        <div className="text-sm">아직 준비된 실험이 없습니다</div>
        <div className="text-xs mt-1 text-gray-300">곧 다양한 도구가 추가될 예정입니다</div>
      </div>
    </div>
  )
}
