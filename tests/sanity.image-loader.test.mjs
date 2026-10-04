import assert from "node:assert/strict";
import test from "node:test";
import sanityImageLoader from "../src/lib/sanity.image-loader.ts";
import nextImage from "next/image.js";

const src = "https://cdn.sanity.io/images/example/production/photo-2400x1600.jpg";

test("responsive variants preserve the cover crop and aspect ratio", () => {
  const url = new URL(sanityImageLoader({ src: `${src}?rect=100,200,1600,900&w=1600&h=900&fit=crop`, width: 640 }));
  assert.equal(url.searchParams.get("w"), "640");
  assert.equal(url.searchParams.get("h"), "360");
  assert.equal(url.searchParams.get("rect"), "100,200,1600,900");
  assert.equal(url.searchParams.get("fit"), "crop");
});

test("uncropped photos use modern formats and avoid upscaling", () => {
  const url = new URL(sanityImageLoader({ src, width: 828, quality: 80 }));
  assert.equal(url.searchParams.get("w"), "828");
  assert.equal(url.searchParams.get("q"), "80");
  assert.equal(url.searchParams.get("auto"), "format");
  assert.equal(url.searchParams.get("fit"), "max");
  assert.equal(url.searchParams.has("h"), false);
});

test("Next Image emits lazy responsive Sanity URLs without the Vercel proxy", () => {
  const { props } = nextImage.getImageProps({ src, alt: "Travel photo", fill: true, sizes: "50vw", loader: sanityImageLoader });
  assert.ok(props.src.startsWith("https://cdn.sanity.io/images/"));
  assert.ok(props.srcSet.includes("w=640"));
  assert.ok(!props.srcSet.includes("/_next/image"));
  assert.equal(props.loading, "lazy");
});

test("unsupported origins fail explicitly", () => {
  for (const unsupported of ["/photo.jpg", "https://example.com/photo.jpg", "https://cdn.sanity.io/files/example/file.pdf"]) {
    assert.throws(() => sanityImageLoader({ src: unsupported, width: 640 }));
  }
});
