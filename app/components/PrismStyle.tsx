'use client';
import { useEffect } from 'react';

export default function PrismStyle() {
  useEffect(() => {
    // 코드 블록이 포함된 페이지에서만 Prism CSS를 동적으로 로드하여
    // 초기 렌더링 차단 CSS 용량을 줄입니다.
    // @ts-ignore – CSS module for runtime usage only
    import(/* webpackMode: "eager" */ 'prismjs/themes/prism-tomorrow.css');
  }, []);
  return null;
}
