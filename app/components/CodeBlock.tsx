import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import { Button } from "@/components/ui/button";
import { Copy, Check } from 'lucide-react'; // Check 아이콘 추가

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false); // 복사 상태 추가

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  const copyToClipboard = async () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      console.error('클립보드 API를 사용할 수 없습니다.');
      // 사용자에게 알림 추가 (예: alert 또는 토스트 메시지)
      alert('클립보드 복사 기능을 사용할 수 없는 환경입니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      // 사용자에게 알림 추가
      alert('클립보드 복사에 실패했습니다.');
      setCopied(false); // 실패 시 copied 상태 초기화
    }
  };

  return (
    <div className="relative">
      <pre className={`language-${language} rounded-lg p-4 bg-gray-800`}>
        <code ref={codeRef} className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />} {/* 아이콘 변경 */}
      </Button>
    </div>
  );
};

export default CodeBlock;
