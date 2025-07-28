# 마크다운 블로그 작성 가이드

이 가이드는 마크다운 기반 블로그에서 포스트를 작성하는 방법을 설명합니다.

## 파일 구조

모든 마크다운 파일은 `content/posts/` 디렉토리에 저장해야 합니다.

```
content/
  posts/
    example-post.md
    another-post.md
    ...
```

## Frontmatter 설정

각 마크다운 파일의 상단에는 YAML 형식의 frontmatter가 필요합니다:

```yaml
---
title: "포스트 제목"
slug: "post-slug"  # URL에 사용될 슬러그
excerpt: "포스트 요약 (선택사항)"
feature_image: "https://storage.googleapis.com/your-bucket/images/feature.jpg"
published_at: "2024-01-20T10:00:00.000Z"
tags: ["tag1", "tag2", "tag3"]
author: "작성자 이름"
draft: false  # true로 설정하면 production에서 숨김
---
```

### 필수 필드
- `title`: 포스트 제목
- `slug`: URL 슬러그 (고유해야 함)
- `published_at`: 발행 날짜 (ISO 8601 형식)
- `tags`: 태그 배열
- `author`: 작성자 이름

### 선택 필드
- `excerpt`: 포스트 요약 (없으면 자동 생성)
- `feature_image`: 대표 이미지 URL
- `draft`: 초안 여부 (기본값: false)

## 특수 태그

### 블로그 포스트
- `blog`: 일반 블로그 포스트
- `main`: 메인 페이지에 피처드로 표시될 포스트

### 기사
- `article`: 기사/아티클 페이지에 표시될 포스트

## 이미지 사용법

### GCS 이미지 URL 형식
```markdown
![이미지 설명](https://storage.googleapis.com/your-bucket/images/image-name.jpg)
```

### 대표 이미지 설정
frontmatter에서 `feature_image` 필드에 GCS URL을 설정하세요:
```yaml
feature_image: "https://storage.googleapis.com/your-bucket/images/hero-image.jpg"
```

## 마크다운 문법

### 헤딩
```markdown
# H1 제목
## H2 제목
### H3 제목
```

### 강조
```markdown
**굵은 글씨**
*기울임 글씨*
```

### 링크
```markdown
[링크 텍스트](https://example.com)
```

### 코드
````markdown
인라인 코드: `console.log('hello')`

코드 블록:
```javascript
function hello() {
  console.log("Hello, World!");
}
```
````

### 리스트
```markdown
- 순서 없는 리스트
- 항목 2

1. 순서 있는 리스트
2. 항목 2
```

## 예제 포스트

```markdown
---
title: "새로운 블로그 포스트"
slug: "new-blog-post"
excerpt: "이것은 새로운 블로그 포스트의 예제입니다."
feature_image: "https://storage.googleapis.com/your-bucket/images/new-post.jpg"
published_at: "2024-01-20T15:30:00.000Z"
tags: ["blog", "example", "tutorial"]
author: "작성자"
draft: false
---

# 새로운 블로그 포스트

이것은 마크다운으로 작성된 블로그 포스트입니다.

## 주요 내용

### 소제목
내용을 작성합니다.

![샘플 이미지](https://storage.googleapis.com/your-bucket/images/sample.jpg)

### 코드 예제
```javascript
const greeting = "Hello, World!";
console.log(greeting);
```

이렇게 마크다운으로 쉽게 블로그 포스트를 작성할 수 있습니다.
```

## 주의사항

1. **슬러그 중복**: 각 포스트의 `slug`는 고유해야 합니다.
2. **이미지 URL**: GCS에 업로드한 이미지의 정확한 URL을 사용하세요.
3. **날짜 형식**: `published_at`은 ISO 8601 형식을 사용하세요.
4. **태그 일관성**: 태그명은 일관되게 사용하세요 (대소문자 구분).

## 파일 관리

- 파일명은 의미있는 이름으로 설정하세요 (예: `my-awesome-post.md`)
- 파일명과 슬러그가 일치할 필요는 없지만, 관리의 편의를 위해 유사하게 설정하는 것을 권장합니다.
- 이미지나 기타 에셋은 GCS에 업로드하고 URL을 사용하세요.
