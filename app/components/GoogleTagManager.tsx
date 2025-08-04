'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function GoogleTagManager() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  useEffect(() => {
    if (gtmId) {
      // GTM DataLayer 초기화
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
    }
  }, [gtmId]);

  if (!gtmId) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager - Head Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      
      {/* Google Tag Manager - NoScript */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

// GTM 이벤트 추적 헬퍼 함수들
export const gtmEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  }
};

export const gtmPageView = (url: string) => {
  gtmEvent('page_view', {
    page_location: url,
    page_title: document.title,
  });
};

// TypeScript 타입 선언
declare global {
  interface Window {
    dataLayer: any[];
  }
}
