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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true); // 복사 상태를 true로 설정
    setTimeout(() => setCopied(false), 2000); // 2초 후에 다시 false로 설정
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
