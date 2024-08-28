// components/TableOfContents.tsx

import { useEffect, useState } from 'react';

interface TableOfContentsProps {
    toc: { id: string; text: string }[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ toc }) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const sections = toc.map(item => document.getElementById(item.id));
            const activeSection = sections.find(section => {
                if (section) {
                    const { offsetTop, clientHeight } = section;
                    return scrollPosition >= offsetTop - 10 && scrollPosition < offsetTop + clientHeight;
                }
                return false;
            });
            setActiveId(activeSection?.id || null);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [toc]);

    if (toc.length === 0) return null;

    return (
        <aside className="w-full lg:w-[20%] mt-8 lg:mt-0 lg:sticky lg:top-20 lg:ml-8">
            <h3 className="text-xl font-bold mb-4">목차</h3>
            <ul className="space-y-2">
                {toc.map((item) => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            className={`block transition-all duration-200 ${
                                activeId === item.id 
                                    ? 'text-blue-600 text-lg font-semibold' 
                                    : 'text-base text-gray-700 hover:text-blue-500'
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
