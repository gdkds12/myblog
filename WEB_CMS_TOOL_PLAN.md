# 블로그 CMS 웹 도구 계획

## 🎯 프로젝트 개요

옵시디언과 GitHub Mobile을 연결하는 **웹 기반 CMS 도구**를 개발하여, 이미지 업로드와 메타데이터 템플릿 생성을 GUI로 처리한 후 옵시디언으로 복사-붙여넣기 하는 워크플로우를 구축합니다.

### 🔄 핵심 아이디어
- **웹 도구**: 이미지 업로드 + 템플릿 생성
- **옵시디언**: 순수 마크다운 편집기로만 사용
- **GitHub Mobile**: 기존 업로드 방식 유지
- **최종 결과**: 기존 파이프라인 완전 보존

---

## 🏗️ 새로운 워크플로우 아키텍처

### 🔄 전체 워크플로우
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   웹 CMS 도구   │────│    옵시디언      │────│  GitHub Mobile  │
│ (이미지+템플릿)  │    │   (마크다운)     │    │   (업로드)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         ▼                        ▼                       ▼
   🖼️ 이미지 처리             📝 콘텐츠 작성           📤 Git 커밋
   📋 메타데이터 생성         🎨 서식 적용             ↓
         │                        │               🔄 기존 파이프라인
         │                        │                     ↓
         └────────┬───────────────┘               🚀 자동 배포
                  │
                  ▼
           📋 완성된 마크다운
           (복사 → 붙여넣기)
```

### 📱 실제 사용 시나리오
```
1. 📱/💻 웹 CMS 도구 접속
2. 🖼️ 이미지 드래그앤드롭 업로드
   ↓ (자동 처리)
3. ☁️ GCS 업로드 + WebP 변환 대기
4. 🔗 CDN URL 자동 생성 + 미리보기
5. 📋 템플릿 GUI에서 메타데이터 입력
6. 📝 완성된 마크다운 전체 복사
7. 📱 옵시디언에 붙여넣기
8. ✍️ 본문 작성 + 서식 적용
9. 📤 GitHub Mobile로 업로드
10. 🚀 기존 파이프라인 자동 실행
```

---

## 🖥️ 웹 CMS 도구 설계

### 🎨 UI/UX 구성
```
┌─────────────────────────────────────────────────────────┐
│                    📝 greedient 블로그 CMS               │
├─────────────────────────────────────────────────────────┤
│  🖼️ 이미지 업로드 섹션                                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │     드래그앤드롭 또는 클릭해서 이미지 업로드         │ │
│  │                                                     │ │
│  │     📁 지원 형식: JPG, PNG, GIF, WebP               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📋 업로드된 이미지 목록                                │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [🖼️ 썸네일] image1.jpg ✅ 변환완료                  │ │
│  │ 📋 CDN URL: https://img.greedient.kr/...             │ │
│  │ [📋 복사] [🔗 새창열기] [❌ 삭제]                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📝 메타데이터 템플릿 생성                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 제목: [                                    ]         │ │
│  │ 슬러그: [                                  ]         │ │
│  │ 요약: [                                    ]         │ │
│  │ 대표이미지: [선택 ▼] 또는 [직접입력        ]         │ │
│  │ 태그: [tag1] [tag2] [+ 추가]                        │ │
│  │ 작성자: [                                  ]         │ │
│  │ 발행일시: [📅 2025-07-30] [🕐 10:00]                │ │
│  │ 드래프트: [☐ 체크시 비공개]                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  🎯 최종 결과물                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ---                                                 │ │
│  │ title: "포스트 제목"                                │ │
│  │ slug: "post-slug"                                   │ │
│  │ excerpt: "포스트 요약"                              │ │
│  │ feature_image: "https://img.greedient.kr/..."       │ │
│  │ published_at: "2025-07-30T10:00:00.000Z"           │ │
│  │ tags: ["tag1", "tag2"]                              │ │
│  │ author: "작성자"                                    │ │
│  │ draft: false                                        │ │
│  │ ---                                                 │ │
│  │                                                     │ │
│  │ 여기에 본문을 작성하세요...                         │ │
│  │                                                     │ │
│  │ ![이미지](https://img.greedient.kr/image1.webp)     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [📋 전체 복사] [🔄 초기화] [💾 템플릿 저장]               │
└─────────────────────────────────────────────────────────┘
```

### 🔧 핵심 기능 명세

#### 1. 🖼️ **이미지 업로드 시스템**
```typescript
interface ImageUploadFeature {
  // 드래그앤드롭 지원
  dragAndDrop: boolean;
  
  // 지원 파일 형식
  supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  // 업로드 프로세스
  uploadProcess: {
    step1: '파일 선택/드롭';
    step2: 'GCS 원본 업로드';
    step3: 'Cloud Functions WebP 변환 트리거';
    step4: '변환 완료 폴링';
    step5: 'CDN URL 생성 및 표시';
  };
  
  // 실시간 상태 표시
  statusDisplay: {
    uploading: '업로드 중... (진행률 표시)';
    converting: 'WebP 변환 중... (⏳ 대기)';
    completed: '✅ 완료 (CDN URL 표시)';
    error: '❌ 실패 (재시도 버튼)';
  };
}
```

#### 2. 📋 **메타데이터 템플릿 생성기**
```typescript
interface TemplateGenerator {
  fields: {
    title: {
      type: 'text';
      required: true;
      placeholder: '포스트 제목을 입력하세요';
      autoSlug: true; // 제목 입력시 슬러그 자동 생성
    };
    
    slug: {
      type: 'text';
      required: true;
      pattern: '^[a-z0-9-]+$';
      validation: '영문, 숫자, 하이픈만 사용 가능';
    };
    
    excerpt: {
      type: 'textarea';
      maxLength: 200;
      placeholder: '포스트 요약 (SEO에 중요)';
    };
    
    feature_image: {
      type: 'select | text';
      options: '업로드된 이미지 목록';
      allowCustom: true;
    };
    
    published_at: {
      type: 'datetime';
      default: 'now';
      timezone: 'Asia/Seoul';
    };
    
    tags: {
      type: 'tags';
      predefined: ['tech', 'blog', 'tutorial', 'review'];
      allowCustom: true;
    };
    
    author: {
      type: 'text';
      default: '관리자';
      saved: true; // 이전 입력값 기억
    };
    
    draft: {
      type: 'checkbox';
      default: false;
      description: '체크시 비공개 포스트';
    };
  };
}
```

#### 3. 🔄 **실시간 미리보기**
```typescript
interface PreviewSystem {
  // 실시간 YAML 생성
  realtimeYaml: {
    trigger: 'onChange';
    validation: 'yaml-syntax-check';
    formatting: 'auto-indent';
  };
  
  // 마크다운 템플릿 생성
  markdownTemplate: {
    frontmatter: 'yaml-block';
    bodyPlaceholder: '여기에 본문을 작성하세요...';
    imageInsertions: 'uploaded-images-as-markdown';
  };
  
  // 복사 기능
  copyFeature: {
    oneClick: '전체 선택 후 클립보드 복사';
    notification: '클립보드에 복사되었습니다!';
    format: 'markdown-with-frontmatter';
  };
}
```

---

## 🛠️ 기술 스택 및 구현

### 🖥️ **프론트엔드**
```typescript
// Next.js 14 (App Router)
// 기존 블로그와 동일한 기술 스택 사용

tech_stack: {
  framework: 'Next.js 14.2.30';
  language: 'TypeScript';
  styling: 'Tailwind CSS';
  ui_components: 'shadcn/ui';
  icons: 'Lucide React';
  drag_drop: 'react-dropzone';
  form_handling: 'react-hook-form';
  state_management: 'zustand' | 'useState';
}
```

### 🔧 **백엔드 API (서버리스)**
```typescript
// Netlify Edge Functions + Static Export

// 이미지 업로드 API
'POST /.netlify/functions/upload-image': {
  input: 'FormData (이미지 파일)';
  runtime: 'Netlify Edge Functions';
  process: [
    'Service Account로 GCS 인증',
    'GCS 원본 업로드 (버킷: /original/)',
    'Cloud Functions 트리거 (WebP 변환)',
    '업로드 완료 응답'
  ];
  output: {
    uploadId: 'unique-id-for-polling';
    originalUrl: 'GCS 원본 URL';
    status: 'uploading';
  };
};

// 변환 상태 확인 API
'GET /.netlify/functions/check-status/[id]': {
  runtime: 'Netlify Edge Functions';
  polling: '클라이언트에서 1초 간격';
  timeout: '30초';
  process: [
    'GCS에서 /optimized/ 경로 확인',
    'Cloud Functions 처리 상태 체크'
  ];
  response: {
    status: 'converting' | 'completed' | 'error';
    cdnUrl?: 'https://img.greedient.kr/optimized/...';
    progress?: number;
  };
};

// 클라이언트 사이드 기능
client_side: {
  storage: 'localStorage (업로드 히스토리)';
  state: 'React useState (실시간 상태)';
  templates: 'localStorage (사용자 템플릿)';
  preferences: 'localStorage (작성자명 등)';
}
```

### 🗄️ **데이터 저장 (서버리스 최적화)**
```typescript
// 완전 클라이언트 사이드 저장
storage_strategy: {
  // 업로드된 이미지 목록 (세션 유지)
  uploadedImages: {
    location: 'localStorage';
    structure: {
      id: 'unique-upload-id';
      filename: 'original-filename.jpg';
      originalUrl: 'GCS URL';
      cdnUrl: 'CDN URL';
      uploadedAt: 'timestamp';
      size: 'file-size-bytes';
    };
    retention: '브라우저 캐시 의존';
  };
  
  // 사용자 설정 (영구 저장)
  userPreferences: {
    location: 'localStorage';
    data: {
      defaultAuthor: 'string';
      frequentTags: 'string[]';
      defaultTemplate: 'object';
    };
  };
  
  // 템플릿 히스토리 (최근 10개)
  templateHistory: {
    location: 'localStorage';
    maxItems: 10;
    autoCleanup: true;
  };
}

// 서버 사이드 저장 불필요
server_storage: 'None - Completely Stateless';
```

---

## 🚀 배포 및 호스팅 (서버리스)

### 🌐 **Netlify 서버리스 호스팅** (권장)
```yaml
# 별도 도메인 또는 서브도메인
hosting_options:
  recommended: 'cms.greedient.kr'
  alternative1: 'greedient.kr/cms'
  alternative2: 'blog-cms.greedient.kr'

netlify_deployment:
  platform: 'Netlify'
  build_command: 'npm run build'
  publish_directory: 'out'
  build_settings:
    - 'Next.js Static Export'
    - 'Edge Functions for API Routes'
    - 'Form Handling (built-in)'
  
  advantages:
    - '✅ 완전 무료 (개인 사용)'
    - '✅ 자동 HTTPS/SSL'
    - '✅ 글로벌 CDN 내장'
    - '✅ Git 기반 자동 배포'
    - '✅ 도메인 연결 간편'
    - '✅ 서버 관리 부담 제로'
    
  netlify_features:
    edge_functions: 'API Routes → Netlify Edge Functions'
    forms: '폼 처리 내장 (이미지 업로드용)'
    analytics: '기본 방문자 통계'
    branch_deploys: '브랜치별 미리보기'
```

### 🔄 **대안 서버리스 플랫폼**
```yaml
backup_options:
  vercel:
    pros: 'Next.js 최적화, Edge Functions'
    cons: '무료 플랜 제한 (대역폭)'
    
  github_pages:
    pros: '완전 무료, GitHub 통합'
    cons: 'Static Only (API 제한)'
    
  cloudflare_pages:
    pros: '빠른 CDN, Workers 지원'
    cons: '설정 복잡도'
    
  firebase_hosting:
    pros: 'Google 생태계, Functions 지원'
    cons: 'GCP 과금 가능성'
```

### 🔒 **보안 고려사항 (서버리스)**
```typescript
serverless_security: {
  // 환경 변수 (Netlify)
  environment_variables: {
    storage: 'Netlify Environment Variables';
    gcs_service_account: 'JSON 키를 환경변수로 저장';
    secrets: 'Build 시에만 접근 가능';
  };
  
  // GCS 업로드 권한
  gcs_access: {
    method: 'Service Account Key (환경변수)';
    scope: 'Storage Object Creator';
    bucket: '기존 버킷 재사용';
    cors: 'CORS 설정으로 도메인 제한';
  };
  
  // API 제한 (Netlify Edge Functions)
  rate_limiting: {
    upload: '분당 10개 파일 (IP 기반)';
    size_limit: '파일당 10MB (Netlify 제한)';
    bandwidth: '월 100GB (Netlify 무료 플랜)';
  };
  
  // 클라이언트 사이드 검증
  file_validation: {
    mime_type: '브라우저에서 image/* 만 허용';
    size_check: '업로드 전 크기 검증';
    format_check: '지원 형식만 허용';
  };
  
  // 도메인 보안
  domain_security: {
    https_only: 'Netlify 자동 HTTPS';
    cors_policy: '특정 도메인만 허용';
    referrer_check: '리퍼러 헤더 검증';
  };
}
```

### ⚡ **Netlify 최적화 설정**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  directory = "netlify/functions"

# 이미지 최적화
[[headers]]
  for = "*.jpg"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
    
[[headers]]
  for = "*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

# 보안 헤더
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```
```

---

## 📱 모바일 친화적 설계

### 🎨 **반응형 UI**
```css
/* 모바일 최적화 */
mobile_features: {
  touch_friendly: '버튼 크기 44px 이상';
  drag_drop: '모바일에서도 파일 선택 지원';
  keyboard: '가상 키보드 대응';
  orientation: '세로/가로 모드 지원';
}

/* 특별한 모바일 기능 */
mobile_specific: {
  camera_access: '카메라 직접 촬영 버튼';
  gallery_access: '갤러리에서 다중 선택';
  share_api: 'Web Share API로 URL 공유';
  pwa: 'PWA 지원으로 앱처럼 사용';
}
```

### 📱 **모바일 워크플로우**
```
📱 스마트폰에서:
1. 🌐 cms.greedient.kr 접속
2. 📸 카메라로 직접 촬영 또는 갤러리 선택
3. ⏳ 업로드 + 변환 대기
4. 📋 템플릿 폼 터치로 입력
5. 📝 완성된 마크다운 복사
6. 📱 옵시디언 앱으로 전환
7. 📝 붙여넣기 + 본문 작성
8. 📱 GitHub Mobile로 업로드
```

---

## 🎯 개발 로드맵 (서버리스)

### 📅 **Phase 1: 서버리스 MVP 개발 (1주)**
- [ ] Next.js 프로젝트 생성 (Static Export 설정)
- [ ] Netlify 계정 생성 및 도메인 연결
- [ ] 기본 UI 구조 (반응형 디자인)
- [ ] 드래그앤드롭 이미지 업로드 UI
- [ ] 메타데이터 폼 기본 구조

### 📅 **Phase 2: Netlify Functions 구현 (1주)**
- [ ] GCS Service Account 키 환경변수 설정
- [ ] `/.netlify/functions/upload-image` 구현
- [ ] `/.netlify/functions/check-status` 구현
- [ ] Cloud Functions WebP 변환 연동
- [ ] 에러 처리 및 재시도 로직

### 📅 **Phase 3: 클라이언트 기능 완성 (1주)**
- [ ] 실시간 업로드 상태 표시
- [ ] CDN URL 자동 변환
- [ ] 실시간 마크다운 템플릿 생성
- [ ] 클립보드 복사 기능
- [ ] localStorage 기반 히스토리

### 📅 **Phase 4: 최적화 및 배포 (3일)**
- [ ] 모바일 UI 최적화
- [ ] PWA 설정 (오프라인 지원)
- [ ] 성능 최적화 (이미지 압축, 번들 크기)
- [ ] 도메인 연결 및 SSL 설정
- [ ] 사용자 테스트 및 피드백

### 🎯 **서버리스 우선순위 기능**
```
1순위 (핵심):
✅ 이미지 업로드 → GCS → CDN URL 변환
✅ 메타데이터 GUI 폼
✅ 마크다운 템플릿 생성
✅ 클립보드 복사

2순위 (편의):
⏳ localStorage 기반 히스토리
⏳ 템플릿 프리셋
⏳ 자동완성 기능

3순위 (고급):
🔄 PWA 지원
🔄 다크모드
🔄 키보드 단축키
```

### 💰 **비용 분석 (Netlify 무료 플랜)**
```yaml
netlify_free_limits:
  bandwidth: '월 100GB'
  build_minutes: '월 300분'
  functions: '월 125,000회 실행'
  forms: '월 100회 제출'
  
estimated_usage:
  bandwidth: '< 1GB (정적 사이트)'
  functions: '< 1,000회 (이미지 업로드)'
  builds: '< 10회 (코드 변경시만)'
  
cost_conclusion: '완전 무료로 운영 가능 ✅'
```

---

## 💡 추가 아이디어

### 🔧 **편의 기능들**
```typescript
convenience_features: {
  // 템플릿 프리셋
  template_presets: {
    tech_review: '기술 리뷰용 템플릿';
    tutorial: '튜토리얼용 템플릿';
    news: '뉴스/소식 템플릿';
    personal: '개인 일기 템플릿';
  };
  
  // 자동 완성
  auto_complete: {
    tags: '기존 사용한 태그 자동완성';
    authors: '작성자명 기억';
    urls: '자주 사용하는 URL 패턴';
  };
  
  // 단축키
  shortcuts: {
    copy: 'Ctrl+C (전체 복사)';
    reset: 'Ctrl+R (폼 초기화)';
    upload: 'Ctrl+U (파일 업로드)';
  };
  
  // 배치 작업
  batch_operations: {
    multi_upload: '여러 이미지 동시 업로드';
    bulk_resize: '일괄 리사이징';
    watermark: '워터마크 자동 추가 (옵션)';
  };
}
```

### 🎨 **UI/UX 개선**
```typescript
ux_improvements: {
  // 다크모드
  theme: 'auto | light | dark';
  
  // 진행률 표시
  progress: {
    upload: '업로드 진행률 바';
    conversion: '변환 상태 애니메이션';
    success: '완료 체크 애니메이션';
  };
  
  // 알림 시스템
  notifications: {
    toast: '우측 상단 토스트 알림';
    sound: '완료시 알림음 (옵션)';
    vibration: '모바일 진동 피드백';
  };
  
  // 미리보기
  preview: {
    image: '업로드된 이미지 썸네일';
    markdown: '생성된 마크다운 하이라이팅';
    live_edit: '실시간 템플릿 업데이트';
  };
}
```

---

## 🎉 기대 효과

### 📈 **생산성 극대화**
- **🎯 특화된 도구**: 각 단계별 최적화된 도구 사용
- **🔄 단순한 워크플로우**: 복잡한 설정 없이 바로 사용
- **📱 모바일 퍼스트**: 언제 어디서나 콘텐츠 준비 가능
- **⚡ 빠른 이미지 처리**: 드래그앤드롭 → CDN URL 자동 생성

### 🛠️ **유지보수성 (서버리스)**
- **🌐 인프라 제로**: 서버 관리, 패치, 모니터링 불필요
- **⚡ 자동 스케일링**: 트래픽 증가시 Netlify가 자동 처리
- **🔄 Git 기반 배포**: 코드 푸시 → 자동 빌드 → 즉시 배포
- **🐛 디버깅 간편**: Netlify Functions 로그 웹에서 확인
- **📈 확장성**: 필요시 유료 플랜으로 쉽게 업그레이드
- **💾 백업 자동**: Git 저장소가 전체 백업 역할

### 🌟 **사용자 경험 (서버리스 최적화)**
- **⚡ 빠른 로딩**: Netlify 글로벌 CDN으로 초고속 로딩
- **📱 모바일 최적화**: PWA 지원으로 앱처럼 사용 가능
- **🔗 간편한 접근**: cms.greedient.kr 도메인으로 즉시 접근
- **� 오프라인 지원**: 기본 기능은 네트워크 없이도 동작
- **🎨 반응형 디자인**: 모든 기기에서 완벽한 UI

---

*문서 작성일: 2025년 7월 30일*
*상태: 서버리스 웹 CMS 도구 기획 완료, Netlify 배포 준비 🚀*
*핵심: 완전 무료 서버리스 솔루션으로 관리 부담 제로*
