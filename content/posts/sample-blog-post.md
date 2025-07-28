---
title: "샘플 블로그 포스트"
slug: "sample-blog-post"
excerpt: "이것은 마크다운 파일로 작성된 샘플 블로그 포스트입니다."
feature_image: "https://storage.googleapis.com/your-bucket/images/sample-hero.jpg"
published_at: "2024-01-15T10:00:00.000Z"
tags: ["blog"]
author: "작성자 이름"
draft: false
---

# 마크다운으로 작성된 블로그 포스트

이것은 **마크다운** 파일로 작성된 샘플 블로그 포스트입니다. Strapi 대신 마크다운 파일을 직접 파싱하여 사용합니다.

## 주요 특징

- 마크다운 문법 지원
- Frontmatter를 통한 메타데이터 관리
- GCS에 업로드된 이미지 URL 사용
- 태그 기반 분류

### 이미지 삽입

![샘플 이미지](https://storage.googleapis.com/your-bucket/images/sample-image.jpg)

### 코드 블록

```javascript
function hello() {
  console.log("Hello, World!");
}
```

이제 Strapi 없이도 블로그가 정상적으로 작동합니다!
