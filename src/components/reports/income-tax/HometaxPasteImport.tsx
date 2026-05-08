'use client'

import { useState } from 'react'
import { Clipboard, CheckCircle2, AlertCircle } from 'lucide-react'
import { parseIncomeTaxTable, IncomeTaxParseError } from '@/lib/calculators/income-tax-parser'
import type { ParsedIncomeTaxData } from '@/lib/calculators/income-tax-parser'

interface Props {
  onParsed: (data: ParsedIncomeTaxData) => void
}

export function HometaxPasteImport({ onParsed }: Props) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  function handleApply() {
    if (!text.trim()) {
      setStatus('error')
      setMessage('텍스트를 붙여넣어 주세요.')
      return
    }

    try {
      const parsed = parseIncomeTaxTable(text)
      const count = Object.keys(parsed).length
      onParsed(parsed)
      setStatus('success')
      setMessage(`${count}개 항목이 자동 입력되었습니다.`)
    } catch (e) {
      setStatus('error')
      setMessage(
        e instanceof IncomeTaxParseError ? e.message : '파싱 중 오류가 발생했습니다.'
      )
    }
  }

  function handleClear() {
    setText('')
    setStatus('idle')
    setMessage('')
  }

  return (
    <section className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-3">
        <Clipboard size={20} className="text-blue-600" />
        <h3 className="font-bold text-blue-900">홈택스 표 붙여넣기</h3>
      </div>

      <p className="text-sm text-blue-800 mb-3">
        홈택스 종합소득세 신고 화면에서 <strong>&ldquo;세액의 계산&rdquo;</strong> 표를 마우스로 드래그해서 복사 →
        아래 영역에 붙여넣기 (Ctrl+V) → 자동 입력 클릭.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`여기에 홈택스 표를 Ctrl+V로 붙여넣으세요...
예시:
구 분
종합소득세
농어촌특별세
종 합 소 득 금 액
28,813,761
0
소 득 공 제 계
20,941,370
0
...`}
        rows={6}
        className="w-full px-3 py-2 border border-blue-200 rounded text-sm font-mono bg-white focus:border-blue-500 focus:outline-none"
      />

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          onClick={handleApply}
          disabled={!text.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          자동 입력
        </button>
        {text && (
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            지우기
          </button>
        )}
        {status === 'success' && (
          <p className="text-sm text-green-700 flex items-center gap-1 ml-auto">
            <CheckCircle2 size={16} /> {message}
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-700 flex items-center gap-1 ml-auto">
            <AlertCircle size={16} /> {message}
          </p>
        )}
      </div>
    </section>
  )
}
