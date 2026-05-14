'use client'

import { useEffect, useState } from 'react'
import { Copy, Link as LinkIcon } from 'lucide-react'
import { createShareLinkAction } from '@/app/actions/share-links'

const CUSTOMER_MESSAGE = `안녕하세요. 아톰세무회계 김경태 세무사 입니다. 종합소득세 계산이 완료되어 종합소득세 보고서 보내드립니다. 보고서 확인해주시면 신고서 및 납부서 전달드릴 예정입니다. 신고기한까지는 언제든 수정이 가능하니 확인 후 말씀해주시면 됩니다. 감사합니다😊`

interface Props {
  reportType: 'income_tax'
  reportId: string
  clientId: string
}

export function ShareLinkTopButton({ reportType, reportId, clientId }: Props) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    setCopying(true)
    try {
      const link = await createShareLinkAction(reportType, reportId, clientId)
      const url = `${window.location.origin}/share/${link.token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('[share-link-copy]', e)
      alert(`링크 복사 실패: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCopying(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={copying}
      className="no-print"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        fontSize: '13px',
        fontWeight: 500,
        color: 'white',
        background: copied ? '#10b981' : '#4f46e5',
        border: 'none',
        borderRadius: '6px',
        cursor: copying ? 'wait' : 'pointer',
        opacity: copying ? 0.7 : 1,
      }}
    >
      <LinkIcon size={14} />
      {copied ? '복사됨 ✓' : copying ? '복사 중...' : '링크 복사'}
    </button>
  )
}

export function ShareCustomerMessageBox({
  reportType,
  reportId,
  clientId,
}: Props) {
  const [url, setUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const link = await createShareLinkAction(reportType, reportId, clientId)
        if (alive) setUrl(`${window.location.origin}/share/${link.token}`)
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      alive = false
    }
  }, [reportType, reportId, clientId])

  const fullText = url ? `${url}\n\n${CUSTOMER_MESSAGE}` : CUSTOMER_MESSAGE

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      alert(`복사 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div
      className="no-print"
      style={{
        margin: '32px auto',
        maxWidth: '960px',
        background: '#eff6ff',
        border: '2px solid #bfdbfe',
        borderRadius: '12px',
        padding: '20px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e3a8a' }}>
          📋 고객 전달용 메시지
        </h3>
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={!url}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'white',
            background: copied ? '#10b981' : '#2563eb',
            border: 'none',
            borderRadius: '6px',
            cursor: url ? 'pointer' : 'not-allowed',
            opacity: url ? 1 : 0.5,
          }}
        >
          <Copy size={13} />
          {copied ? '복사됨 ✓' : '전체 복사'}
        </button>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #bfdbfe', margin: '0 0 12px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#1f2937', lineHeight: 1.7 }}>
        {error ? (
          <p style={{ color: '#dc2626', margin: 0 }}>
            ⚠️ 링크 생성 실패: {error}
          </p>
        ) : url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb', wordBreak: 'break-all', textDecoration: 'underline' }}
          >
            {url}
          </a>
        ) : (
          <p style={{ color: '#94a3b8', margin: 0 }}>링크 생성 중...</p>
        )}
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{CUSTOMER_MESSAGE}</p>
      </div>
    </div>
  )
}
