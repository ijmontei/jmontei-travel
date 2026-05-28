import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity.image";

const components = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset) return null;

      const url = urlForImage(value)
        .width(1400)
        .auto("format")
        .fit("max")
        .url();

      return (
        <div className="my-8 overflow-hidden rounded-2xl border bg-zinc-50">
  <div className="relative aspect-[16/10]">
    <Image
      src={url}
      alt={value?.alt || ""}
      fill
      className="object-cover"
      sizes="100vw"
    />
  </div>

  {value?.caption && (
    <div className="px-4 py-2 text-sm text-zinc-500">
      {value.caption}
    </div>
  )}
</div>
      );
    },
  },

  block: {
    h2: ({ children }: any) => (
      <h2 className="mt-12 mb-4 text-2xl font-semibold tracking-tight">
        {children}
      </h2>
    ),

    normal: ({ children }: any) => (
      <p className="my-5 leading-relaxed text-zinc-800 text-[1.05rem]">
        {children}
      </p>
    ),
  },

  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value?.href}
        className="underline underline-offset-4 hover:text-zinc-900"
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    ),
  },
};

export function PortableTextRenderer({ value }: { value: any }) {
  return <PortableText value={value} components={components} />;
}
