"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag } from "@/lib/types";

interface CategoriesProps {
  tags: Tag[];
}

export default function Categories({ tags }: CategoriesProps) {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-6">
      <CategoryLink href="/" currentPath={pathname}>
        모든 글
      </CategoryLink>
      {tags.map((tag) => (
        <CategoryLink key={tag.id} href={`/tag/${tag.slug}`} currentPath={pathname}>
          {tag.name}
        </CategoryLink>
      ))}
    </nav>
  );
}

function CategoryLink({ href, currentPath, children }: { href: string; currentPath: string; children: React.ReactNode }) {
  const isActive = currentPath === href || (href !== '/' && currentPath.startsWith(href));
  
  return (
    <Link 
      href={href} 
      className={`
        font-medium text-gray-700 dark:text-gray-300 
        hover:text-black dark:hover:text-white 
        transition-all duration-300 ease-in-out
        ${isActive ? 'text-black dark:text-white font-semibold relative' : ''}
      `}
    >
      <span className={`
        ${isActive ? 'box-decoration-clone bg-left-bottom bg-gradient-to-r from-black to-black dark:from-white dark:to-white bg-no-repeat pb-1 px-1' : ''}
      `} style={{ backgroundSize: isActive ? '100% 2px' : '0 2px' }}>
        {children}
      </span>
    </Link>
  );
}
