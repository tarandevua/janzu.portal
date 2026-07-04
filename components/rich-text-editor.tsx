"use client";

import { useEffect, useState } from "react";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BoldIcon, LinkIcon, UnderlineIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type RichTextEditorProps = {
  id: string;
  name: string;
  defaultValue?: string | null;
  label: string;
  dictionary: {
    bold: string;
    underline: string;
    link: string;
    linkPrompt: string;
  };
};

function normalizeLinkUrl(value: string) {
  const href = value.trim();

  if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) {
    return href;
  }

  return null;
}

export function RichTextEditor({
  id,
  name,
  defaultValue,
  label,
  dictionary,
}: RichTextEditorProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: defaultValue ?? "",
    editorProps: {
      attributes: {
        id,
        class:
          "min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setValue(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

  function addLink() {
    if (!editor) {
      return;
    }

    const href = window.prompt(dictionary.linkPrompt, editor.getAttributes("link").href ?? "");

    if (href === null) {
      return;
    }

    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setValue(editor.getHTML());
      return;
    }

    const normalizedHref = normalizeLinkUrl(href);

    if (!normalizedHref) {
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedHref }).run();
    setValue(editor.getHTML());
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant={editor?.isActive("bold") ? "default" : "outline"}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
          >
            <BoldIcon className="h-4 w-4" />
            <span className="sr-only">{dictionary.bold}</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant={editor?.isActive("underline") ? "default" : "outline"}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            disabled={!editor}
          >
            <UnderlineIcon className="h-4 w-4" />
            <span className="sr-only">{dictionary.underline}</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant={editor?.isActive("link") ? "default" : "outline"}
            onClick={addLink}
            disabled={!editor}
          >
            <LinkIcon className="h-4 w-4" />
            <span className="sr-only">{dictionary.link}</span>
          </Button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
