"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import clsx from "clsx";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "laudo-prose min-h-[320px] px-4 py-3 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-slate-300 bg-white">
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Negrito"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Itálico"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            label="Sublinhado"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>

          <Divider />

          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === "p") {
                editor.chain().focus().setParagraph().run();
              } else {
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: Number(value) as 1 | 2 | 3 })
                  .run();
              }
            }}
            value={
              editor.isActive("heading", { level: 1 })
                ? "1"
                : editor.isActive("heading", { level: 2 })
                  ? "2"
                  : editor.isActive("heading", { level: 3 })
                    ? "3"
                    : "p"
            }
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            <option value="p">Parágrafo</option>
            <option value="1">Título 1</option>
            <option value="2">Título 2</option>
            <option value="3">Título 3</option>
          </select>

          <Divider />

          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Lista"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="Lista numerada"
          >
            <ListOrdered size={16} />
          </ToolbarButton>

          <Divider />

          <ToolbarButton
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            label="Alinhar à esquerda"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            label="Centralizar"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            label="Alinhar à direita"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() =>
              editor.chain().focus().setTextAlign("justify").run()
            }
            label="Justificar"
          >
            <AlignJustify size={16} />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-slate-200" />;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={clsx(
        "rounded-md p-1.5 hover:bg-slate-200",
        active && "bg-slate-200",
      )}
    >
      {children}
    </button>
  );
}
