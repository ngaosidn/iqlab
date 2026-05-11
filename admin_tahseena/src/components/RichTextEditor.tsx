"use client";

import React from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(
  async () => {
    // Import secara dinamis untuk menghindari masalah SSR di Next.js
    const { CKEditor } = await import("@ckeditor/ckeditor5-react");
    const ClassicEditor = await import("@ckeditor/ckeditor5-build-classic");
    
    return (props: any) => (
      <CKEditor 
        editor={ClassicEditor.default || ClassicEditor} 
        {...props} 
      />
    );
  },
  {
    ssr: false,
    loading: () => <div className="h-[250px] w-full animate-pulse bg-slate-100 rounded-xl border border-slate-200" />,
  }
);

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  return (
    <div className="ckeditor-wrapper">
      <style jsx global>{`
        .ck-editor__editable {
          min-height: 200px;
          border-bottom-left-radius: 0.75rem !important;
          border-bottom-right-radius: 0.75rem !important;
          font-size: 0.875rem;
        }
        .ck-toolbar {
          border-top-left-radius: 0.75rem !important;
          border-top-right-radius: 0.75rem !important;
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        .ck-editor__main > .ck-editor__editable_inline {
          border-color: #e2e8f0 !important;
          transition: all 0.2s;
        }
        .ck-editor__main > .ck-editor__editable_inline.ck-focused {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
        }
        .ck-placeholder {
          color: #94a3b8 !important;
        }
      `}</style>
      <Editor
        data={value || ""}
        onChange={(_event: any, editor: any) => {
          const data = editor.getData();
          if (data !== value) {
            onChange(data);
          }
        }}
        config={{
          placeholder: placeholder || "Tulis isi pengumuman di sini...",
          toolbar: {
            items: [
              'heading',
              '|',
              'bold',
              'italic',
              'link',
              'bulletedList',
              'numberedList',
              '|',
              'outdent',
              'indent',
              '|',
              'blockQuote',
              'insertTable',
              'mediaEmbed',
              'undo',
              'redo'
            ]
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells'
            ]
          }
        }}
      />
    </div>
  );
};

export default React.memo(RichTextEditor);
