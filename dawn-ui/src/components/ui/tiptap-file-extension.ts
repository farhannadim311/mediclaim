import { Node, mergeAttributes } from '@tiptap/core';

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileAttachment: {
      /**
       * Add a file attachment
       */
      setFileAttachment: (options: {
        src: string;
        name: string;
        size: number;
        type: string;
      }) => ReturnType;
    };
  }
}

export const FileAttachment = Node.create<FileAttachmentOptions>({
  name: 'fileAttachment',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      name: {
        default: null,
      },
      size: {
        default: null,
      },
      type: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file-attachment"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'file-attachment',
          class: 'file-attachment',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        'div',
        { class: 'file-attachment-content' },
        [
          'div',
          { class: 'file-attachment-icon' },
          '📎',
        ],
        [
          'div',
          { class: 'file-attachment-info' },
          [
            'div',
            { class: 'file-attachment-name' },
            HTMLAttributes.name || 'Unknown file',
          ],
          [
            'div',
            { class: 'file-attachment-meta' },
            `${HTMLAttributes.type || 'Unknown type'} • ${formatFileSize(HTMLAttributes.size || 0)}`,
          ],
        ],
        [
          'a',
          {
            href: HTMLAttributes.src,
            download: HTMLAttributes.name,
            class: 'file-attachment-download',
            title: 'Download file',
          },
          '↓',
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setFileAttachment:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
