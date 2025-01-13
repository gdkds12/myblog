import React, { useEffect, useState } from 'react';

interface TableOfContentsProps {
    toc: { id: string; text: string }[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ toc }) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const scrollOffset = window.innerHeight / 4; // 목차 클릭 시 스크롤 위치 조정
    const activeOffset = window.innerHeight / 2.2; // 스크롤 시 목차 활성화 기준선 조정

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const sections = toc.map(item => document.getElementById(item.id));
            let newActiveId: string | null = null;

            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                if (!section) continue;

                const { offsetTop, clientHeight } = section;
                const sectionTop = offsetTop - activeOffset;
                const sectionBottom = offsetTop + clientHeight - activeOffset;

                const nextSection = sections[i + 1];

                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    newActiveId = section.id;
                } else if (
                    nextSection &&
                    scrollPosition >= sectionTop &&
                    scrollPosition < nextSection.offsetTop - activeOffset
                ) {
                    newActiveId = section.id;
                    break;
                }
                  if (i === sections.length - 1 && scrollPosition >= sectionTop) {
                    newActiveId = section.id;
                }
            }

            setActiveId(newActiveId);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [toc, activeOffset]);

    if (toc.length === 0) return null;

    return (
        <aside className="w-full lg:w-[80%] mt-8 lg:mt-0 lg:sticky lg:top-20 lg:ml-8">
            <h3 className="text-xl font-bold mb-4">목차</h3>
            <ul className="space-y-2">
                {toc.map((item: { id: string; text: string }) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const targetElement = document.getElementById(item.id);
                                if (targetElement) {
                                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - scrollOffset;
                                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                                    setActiveId(item.id);
                                }
                            }}
                            className={`block transition-all duration-200 ${
                                activeId === item.id
                                    ? 'text-blue-600 text-lg font-semibold'
                                    : 'text-base text-gray-700'
                            }`}
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default TableOfContents;