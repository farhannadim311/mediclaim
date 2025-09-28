import React from 'react';
import { cn } from '@/lib/utils';

interface HtmlContentProps {
  content: string;
  className?: string;
  maxLines?: number;
  asPlainText?: boolean;
}

/**
 * Component to safely render HTML content from Tiptap editors
 * with proper styling and optional truncation
 */
export const HtmlContent: React.FC<HtmlContentProps> = ({
  content,
  className,
  maxLines,
  asPlainText = false,
}) => {
  // Extract plain text from HTML for preview/truncation
  const getPlainText = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // If we want plain text only (e.g., for previews)
  if (asPlainText) {
    const plainText = getPlainText(content);
    return (
      <div
        className={cn(
          'text-gray-400',
          maxLines && `line-clamp-${maxLines}`,
          className
        )}
      >
        {plainText}
      </div>
    );
  }

  // Render full HTML content with styling
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none',
        'prose-p:text-gray-300 prose-p:my-2 prose-p:leading-relaxed',
        'prose-headings:text-white prose-headings:font-bold prose-headings:mb-2',
        'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
        'prose-strong:text-white prose-strong:font-bold',
        'prose-em:text-gray-300 prose-em:italic',
        'prose-code:text-orange-300 prose-code:bg-gray-700/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
        'prose-a:text-orange-400 prose-a:underline hover:prose-a:text-orange-300 prose-a:transition-colors',
        'prose-blockquote:border-l-orange-500/50 prose-blockquote:text-gray-300 prose-blockquote:italic prose-blockquote:pl-4',
        'prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300',
        'prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6',
        'prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-600/30 prose-pre:rounded-lg prose-pre:text-gray-300',
        'prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:border prose-img:border-gray-600/30 prose-img:shadow-lg',
        maxLines && `line-clamp-${maxLines}`,
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
