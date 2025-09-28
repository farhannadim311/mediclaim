import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import Link from '@tiptap/extension-link';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import HardBreak from '@tiptap/extension-hard-break';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';
import Heading from '@tiptap/extension-heading';
import CodeBlock from '@tiptap/extension-code-block';
import Image from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { FileAttachment } from './tiptap-file-extension';
import { fileToFileInfo, isImageFile, isFileSizeValid, formatFileSize } from '../../utils/file-utils';
import { cn } from '@/lib/utils';
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Image as ImageIcon,
  Paperclip,
  Upload
} from 'lucide-react';
import { Button } from './button';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  minHeight?: string;
  singleLine?: boolean;
  showToolbar?: boolean;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}> = ({ onClick, isActive, children, title }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={title}
    className={cn(
      "h-8 w-8 p-0 hover:bg-gray-600/30 transition-colors",
      isActive ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30" : "text-gray-400 hover:text-white"
    )}
  >
    {children}
  </Button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  maxHeight = '400px',
  minHeight = '120px',
  singleLine = false,
  showToolbar = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: singleLine ? 'single-line' : '',
        },
      }),
      Text,
      Bold,
      Italic,
      Underline,
      Strike,
      Code.configure({
        HTMLAttributes: {
          class: 'bg-gray-700/50 px-1 py-0.5 rounded text-orange-300',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-orange-400 underline hover:text-orange-300',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-inside space-y-1',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-inside space-y-1',
        },
      }),
      ListItem,
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-orange-500/50 pl-4 italic text-gray-300',
        },
      }),
      HardBreak,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      History,
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'font-bold text-white',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-800/70 p-3 rounded-lg text-gray-300 font-mono text-sm border border-gray-600/30',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg border border-gray-600/30',
        },
        allowBase64: true,
      }),
      FileAttachment,
      Dropcursor.configure({
        color: 'rgb(251, 146, 60)',
        width: 2,
      }),
      Gapcursor,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
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
          'prose prose-sm max-w-none focus:outline-none rich-text-editor',
          'text-white',
          'prose-p:text-white prose-p:my-2',
          'prose-headings:text-white prose-headings:font-bold',
          'prose-h1:text-xl prose-h1:mb-2',
          'prose-h2:text-lg prose-h2:mb-2',
          'prose-h3:text-base prose-h3:mb-2',
          'prose-strong:text-white prose-strong:font-bold',
          'prose-em:text-gray-300 prose-em:italic',
          'prose-code:text-orange-300 prose-code:bg-gray-700/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-a:text-orange-400 prose-a:underline hover:prose-a:text-orange-300',
          'prose-blockquote:border-l-orange-500/50 prose-blockquote:text-gray-300 prose-blockquote:italic',
          'prose-ul:text-white prose-ol:text-white prose-li:text-white',
          'resize-y',
          singleLine ? 'single-line-editor' : '',
          className
        ),
        style: `min-height: ${minHeight}; max-height: ${maxHeight}; overflow-y: auto; padding: 12px;`,
      },
      handleKeyDown: singleLine ? (view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          return true;
        }
        return false;
      } : undefined,
    },
  });

  const addLink = () => {
    if (!editor) return;

    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Validate file
    if (!isImageFile(file)) {
      alert('Please select an image file');
      return;
    }

    if (!isFileSizeValid(file, 5)) { // 5MB limit for images
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      const fileInfo = await fileToFileInfo(file);
      editor.chain().focus().setImage({ src: fileInfo.base64 }).run();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    // Validate file size
    if (!isFileSizeValid(file, 10)) { // 10MB limit for files
      alert('File size must be less than 10MB');
      return;
    }

    try {
      const fileInfo = await fileToFileInfo(file);
      editor.chain().focus().setFileAttachment({
        src: fileInfo.base64,
        name: fileInfo.name,
        size: fileInfo.size,
        type: fileInfo.type,
      }).run();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

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
    <div className="rich-text-editor-wrapper">
      {showToolbar && !singleLine && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-600/30 bg-gray-800/30">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Paragraph"
          >
            <Type size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-600/30 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <BoldIcon size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <ItalicIcon size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <CodeIcon size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-600/30 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-600/30 mx-1" />

          <ToolbarButton
            onClick={editor.isActive('link') ? removeLink : addLink}
            isActive={editor.isActive('link')}
            title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
          >
            <LinkIcon size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-600/30 mx-1" />

          <ToolbarButton
            onClick={triggerImageUpload}
            title="Upload Image"
          >
            <ImageIcon size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={triggerFileUpload}
            title="Upload File"
          >
            <Paperclip size={16} />
          </ToolbarButton>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <div className="rich-text-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};


import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bulletList: {
      toggleBulletList: () => ReturnType;
    };
    orderedList: {
      toggleOrderedList: () => ReturnType;
    };
  }
}
