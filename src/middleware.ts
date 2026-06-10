import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 공개 경로는 인증 검사 완전 통과 (Supabase 호출 자체를 안 함)
  // /api/calculator/* 도 포함 — 계산기 페이지의 자동조회 API는 비로그인 호출이라
  // 누락 시 미들웨어가 /login 으로 307 redirect → POST → 405 (PR #101).
  if (
    pathname.startsWith('/calculator') ||
    pathname.startsWith('/api/calculator/') ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/api/cron/')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  // PR #130 진단: getUser() 1회는 보호 라우트 보안에 필요하므로 유지.
  // matcher에서 정적 자원/봇 메타파일을 추가 제외 (인증 영향 없음, 미들웨어 오버헤드만 제거).
  //  - _next/static, _next/image : Next.js 빌드 자산
  //  - robots.txt, sitemap.xml, manifest.json|webmanifest : 검색엔진/PWA 메타
  //  - 이미지: svg/png/jpg/jpeg/gif/webp/avif/ico (favicon.ico 포함)
  //  - 폰트: woff/woff2/ttf/otf (자체 호스팅 추가 대비)
  matcher: [
    '/((?!_next/static|_next/image|robots\\.txt|sitemap\\.xml|manifest\\.(?:json|webmanifest)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf)$).*)',
  ],
}
