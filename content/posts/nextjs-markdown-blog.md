---
title: "Next.js와 마크다운으로 블로그 만들기"
slug: "nextjs-markdown-blog"
excerpt: "Next.js와 마크다운을 사용해서 정적 블로그를 만드는 방법을 알아봅시다."
feature_image: "https://storage.googleapis.com/your-bucket/images/nextjs-blog.jpg"
published_at: "2024-01-10T08:30:00.000Z"
tags: ["article"]
author: "개발자"
draft: false
---

# Next.js와 마크다운으로 블로그 만들기

Next.js의 강력한 기능들과 마크다운의 단순함을 결합하여 효율적인 블로그 시스템을 구축할 수 있습니다.

## 왜 마크다운인가?

마크다운은 다음과 같은 장점이 있습니다:

1. **단순함**: 복잡한 CMS 없이도 쉽게 콘텐츠 작성 가능
2. **버전 관리**: Git으로 콘텐츠 변경사항 추적 가능
3. **이식성**: 다른 플랫폼으로 쉽게 이전 가능
4. **성능**: 정적 파일로 빠른 로딩 속도

## 구현 방법

### 1. 마크다운 파싱

```typescript
import matter from 'gray-matter';
import { marked } from 'marked';

function parseMarkdown(content: string) {
  const { data, content: markdown } = matter(content);
  const html = marked.parse(markdown);
  return { frontmatter: data, html };
}
```

### 2. 정적 생성

Next.js의 `getStaticProps`와 `getStaticPaths`를 활용하여 빌드 시점에 모든 페이지를 미리 생성합니다.

이제 CMS 없이도 강력한 블로그를 운영할 수 있습니다!
