# Greedient 블로그

기술 트렌드와 인사이트를 제공하는 Next.js 14 기반 블로그입니다.

## 주요 기능

- 📱 모바일 최적화된 반응형 디자인
- 🌙 다크/라이트 모드 지원
- 🚀 ISR(Incremental Static Regeneration)을 통한 성능 최적화
- 📝 마크다운 기반 콘텐츠 관리
- 🔄 GitHub Actions를 통한 자동 배포
- 📊 Google Analytics 4 통합
- 🔍 Google Search Console 최적화
- 📡 RSS 피드 지원
- 🏷️ 태그 및 카테고리 시스템

## SEO 최적화

### Google Search Console 설정

1. [Google Search Console](https://search.google.com/search-console)에 접속
2. 속성 추가 → URL 접두사로 `https://greedient.kr` 입력
3. HTML 파일 다운로드 방법 선택 후 파일명을 확인
4. `/app/googleXXXXXXXX.html/route.ts` 파일의 파일명을 실제 검증 파일명으로 수정
5. `.env.local`의 `GOOGLE_SITE_VERIFICATION` 값을 실제 검증 코드로 수정

### Google Analytics 설정

1. [Google Analytics](https://analytics.google.com)에서 GA4 속성 생성
2. 측정 ID(G-XXXXXXXXXX) 복사
3. `.env.local`의 `NEXT_PUBLIC_GA_ID` 값을 실제 측정 ID로 수정

### 환경 변수 설정

```bash
# Google Analytics ID (GA4)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Google Search Console 소유권 확인
GOOGLE_SITE_VERIFICATION=your-google-verification-code
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
