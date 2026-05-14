export default function ShareNotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: '24px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '40px 32px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          maxWidth: '420px',
        }}
      >
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔒</div>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#1f2937',
            margin: '0 0 8px',
          }}
        >
          링크가 만료되었습니다
        </h1>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 4px' }}>
          공유 링크는 발급 후 30일간 유효합니다.
        </p>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
          담당 세무사에게 새 링크를 요청해 주세요.
        </p>
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#9ca3af' }}>
          아톰세무회계
        </p>
      </div>
    </div>
  )
}
