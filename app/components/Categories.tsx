"use client";
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { Tag } from "@/lib/types";

interface CategoriesProps {
  tags: Tag[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export default function Categories({ tags, selectedSlug, onSelect }: CategoriesProps) {
  const underlineRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 위치 업데이트 함수
  useEffect(() => {
    const active = containerRef.current?.querySelector<HTMLButtonElement>(
      selectedSlug === null ? '[data-slug="all"]' : `[data-slug="${selectedSlug}"]`
    );
    if (active && underlineRef.current && containerRef.current) {
      const rect = active.getBoundingClientRect();
      const parentRect = containerRef.current.getBoundingClientRect();
      underlineRef.current.style.width = `${rect.width}px`;
      underlineRef.current.style.transform = `translateX(${rect.left - parentRect.left}px)`;
    }
  }, [selectedSlug]);

  return (
    <nav ref={containerRef} className="relative flex space-x-6">
      {/* animated underline */}
      <span
        ref={underlineRef}
        className="absolute -bottom-0.5 h-0.5 bg-black dark:bg-white transition-all duration-300 ease-in-out"
        style={{ transform: 'translateX(0)', width: 0 }}
      />
      <CategoryButton
        active={selectedSlug === null}
        onClick={() => onSelect(null)}
        dataSlug="all">
        모든 글
      </CategoryButton>
      {tags.map((tag) => (
        <CategoryButton
          key={tag.id}
          active={selectedSlug === tag.slug}
          onClick={() => onSelect(tag.slug!)}
          dataSlug={tag.slug || ''}
        >
          {tag.name}
        </CategoryButton>
      ))}
    </nav>
  );
}

function CategoryButton({ active, onClick, children, dataSlug }: { active: boolean; onClick: () => void; children: React.ReactNode; dataSlug: string }) {
  return (
    <button
      type="button" data-slug={dataSlug}
      onClick={onClick}
      className={clsx(
        'font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-300 ease-in-out',
        active && 'text-black dark:text-white font-semibold relative'
      )}
    >
      <span className="pb-0.5">{children}</span>
    </button>
  );
}
