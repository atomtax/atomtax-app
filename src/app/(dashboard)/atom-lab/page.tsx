import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Database } from 'lucide-react'

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

      <Link
        href="/atom-lab/wehago"
        className="group block bg-white border border-gray-200 rounded-xl p-6 hover:border-brand hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 bg-brand/10 rounded-lg text-brand">
            <Database size={24} />
          </div>
          <ArrowRight
            size={18}
            className="text-gray-400 group-hover:text-brand transition-colors"
          />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mt-4">위하고 데이터 수집</h2>
        <p className="text-sm text-gray-500 mt-1">
          더존 위하고T 화면 데이터를 붙여넣어 인건비·감가상각 자동 검산 (수동 수집 1단계)
        </p>
      </Link>
    </div>
  )
}
