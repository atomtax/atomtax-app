'use client'

import { useEffect } from 'react'

type Props = {
  onComplete: (data: { postalCode: string; address: string }) => void
  children: (open: () => void) => React.ReactNode
}

export default function PostalCodeSearch({ onComplete, children }: Props) {
  useEffect(() => {
    if (document.querySelector('script[src*="postcode"]')) return
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  const open = () => {
    if (!window.daum?.Postcode) {
      alert('우편번호 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        onComplete({
          postalCode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
        })
      },
    }).open()
  }

  return <>{children(open)}</>
}
