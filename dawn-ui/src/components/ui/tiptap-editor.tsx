import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  minHeight?: string;
  singleLine?: boolean;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  maxHeight = '200px',
  minHeight = '60px',
  singleLine = false,
}) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: singleLine ? 'single-line' : '',
        },
      }),
      Text,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // For single line, extract text content only
      if (singleLine) {
        const textContent = editor.getText();
        onChange(textContent);
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'text-white placeholder:text-gray-400',
          'px-3 py-2 resize-none',
          'prose-p:text-white prose-p:my-1',
          'prose-headings:text-white',
          'prose-strong:text-white',
          'prose-em:text-gray-300',
          singleLine ? 'single-line-editor' : '',
          className
        ),
        style: `min-height: ${minHeight}; max-height: ${maxHeight}; overflow-y: auto;`,
        'data-placeholder': placeholder,
      },
      handleKeyDown: singleLine ? (view, event) => {
        // Prevent Enter key in single line mode
        if (event.key === 'Enter') {
          event.preventDefault();
          return true;
        }
        return false;
      } : undefined,
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          'bg-gray-700/50 border border-gray-600/30 text-gray-400',
          'rounded-md px-3 py-2 animate-pulse',
          className
        )}
        style={{ minHeight, maxHeight }}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div className="tiptap-editor-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
};
