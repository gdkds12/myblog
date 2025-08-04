// app/googlec5e8d2b9a8d4f7e3.html/route.ts
// Google Search Console HTML 파일 검증을 위한 라우트
// 실제 검증 코드는 Google Search Console에서 생성된 파일명과 내용으로 교체해야 합니다.

export async function GET() {
  const verificationContent = `google-site-verification: googlec5e8d2b9a8d4f7e3.html`;
  
  return new Response(verificationContent, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
