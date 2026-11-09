import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity.image";

const components = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset) return null;

      // Body photos show the complete asset, including any areas cropped in Studio.
      const url = urlForImage(value.asset)
        .width(1400)
        .auto("format")
        .fit("max")
        .url();

      const dimensions = new URL(url).pathname.match(/-(\d+)x(\d+)\.[a-z]+$/i);
      const width = dimensions ? Number(dimensions[1]) : 1400;
      const height = dimensions ? Number(dimensions[2]) : 1400;
      const sizes = `(max-width: 896px) min(100vw, ${75 * width / height}vh), min(896px, ${75 * width / height}vh)`;

      return (
        <div className="mx-auto my-8 w-fit max-w-full overflow-hidden rounded-2xl border bg-zinc-50">
          <div className="relative isolate flex justify-center overflow-hidden bg-zinc-100">
            {/* Reuse the foreground's responsive URL, avoiding a second image download. */}
            <Image
              src={url}
              alt=""
              aria-hidden="true"
              fill
              sizes={sizes}
              className="pointer-events-none scale-110 object-cover opacity-45 blur-lg"
            />
            <Image
              src={url}
              alt={value?.alt || ""}
              width={width}
              height={height}
              className="relative z-10 h-auto max-h-[75vh] w-auto max-w-full object-contain"
              sizes={sizes}
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
