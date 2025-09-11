'use client';

import React from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

// Simple Rich Text Editor Component (without TipTap for now)
// This can be enhanced with TipTap later if needed
export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Enter your content here...",
  className = "" 
}: RichTextEditorProps) {
  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            const selection = window.getSelection();
            if (selection && selection.toString()) {
              document.execCommand('bold', false);
            }
          }}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200 font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => {
            const selection = window.getSelection();
            if (selection && selection.toString()) {
              document.execCommand('italic', false);
            }
          }}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200 italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => {
            const selection = window.getSelection();
            if (selection && selection.toString()) {
              document.execCommand('underline', false);
            }
          }}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200 underline"
          title="Underline"
        >
          U
        </button>
        <div className="border-l mx-2"></div>
        <button
          type="button"
          onClick={() => document.execCommand('justifyLeft', false)}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 110-2zM3 8h8a1 1 0 010 2H3a1 1 0 110-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2zM3 16h8a1 1 0 010 2H3a1 1 0 010-2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyCenter', false)}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 110-2zM5 8h10a1 1 0 010 2H5a1 1 0 110-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2zM5 16h10a1 1 0 010 2H5a1 1 0 010-2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('justifyRight', false)}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 110-2zM7 8h10a1 1 0 010 2H7a1 1 0 110-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2zM7 16h10a1 1 0 010 2H7a1 1 0 010-2z" />
          </svg>
        </button>
      </div>
      
      {/* Content Editable Area */}
      <div
        contentEditable
        dangerouslySetInnerHTML={{ __html: content }}
        onInput={(e) => {
          const target = e.target as HTMLDivElement;
          onChange(target.innerHTML);
        }}
        onBlur={(e) => {
          const target = e.target as HTMLDivElement;
          onChange(target.innerHTML);
        }}
        className="p-4 min-h-[400px] focus:outline-none"
        style={{
          fontFamily: 'Times New Roman, serif',
          fontSize: '12pt',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}

// Alternative: Enhanced textarea with formatting buttons
export function EnhancedTextEditor({ 
  content, 
  onChange, 
  placeholder = "Enter your content here...",
  className = "" 
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = React.useState(false);

  const insertText = (beforeText: string, afterText: string = '') => {
    const textarea = document.getElementById('enhanced-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      beforeText + 
      selectedText + 
      afterText + 
      content.substring(end);
    
    onChange(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + beforeText.length,
        end + beforeText.length
      );
    }, 0);
  };

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex gap-2 flex-wrap items-center">
        <button
          type="button"
          onClick={() => insertText('**', '**')}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200 font-bold"
          title="Bold (**text**)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertText('*', '*')}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200 italic"
          title="Italic (*text*)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertText('__', '__')}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200 underline"
          title="Underline (__text__)"
        >
          U
        </button>
        <div className="border-l mx-2 h-6"></div>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 text-sm border rounded hover:bg-gray-200 ${isPreview ? 'bg-blue-100' : ''}`}
          title="Toggle Preview"
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
        <div className="text-xs text-gray-500 ml-auto">
          Use **bold**, *italic*, __underline__ for formatting
        </div>
      </div>
      
      {/* Content Area */}
      {isPreview ? (
        <div
          className="p-4 min-h-[400px] bg-white"
          style={{
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: formatContent(content) }}
        />
      ) : (
        <textarea
          id="enhanced-textarea"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 min-h-[400px] focus:outline-none resize-none"
          style={{
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: '1.6'
          }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
