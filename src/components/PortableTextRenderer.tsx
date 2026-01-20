import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity.image";

const components = {
  types: {
    image: ({ value }: any) => {
      const url = urlForImage(value).width(1600).fit("max").auto("format").url();
      return (
        <div className="my-6 overflow-hidden rounded-2xl border bg-zinc-50">
          <div className="relative aspect-[16/10]">
            <Image src={url} alt={value?.alt || ""} fill className="object-cover" sizes="100vw" />
          </div>
        </div>
      );
    },
  },
  block: {
    h2: ({ children }: any) => <h2 className="mt-10 mb-3 text-2xl font-semibold tracking-tight">{children}</h2>,
    normal: ({ children }: any) => <p className="my-4 leading-relaxed text-zinc-800">{children}</p>,
  },
  marks: {
    link: ({ children, value }: any) => (
      <a href={value?.href} className="underline underline-offset-4" target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  },
};

export function PortableTextRenderer({ value }: { value: any }) {
  return <PortableText value={value} components={components} />;
}
