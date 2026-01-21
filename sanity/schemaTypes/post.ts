import { defineField, defineType } from "sanity";
import { GalleryInput } from "../components/GalleryInput"

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),

    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      validation: (r) => r.required(),
    }),

    defineField({
      name: "country",
      title: "Country",
      type: "string",
      validation: (r) => r.required(),
    }),

    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),

    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
    }),

    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      components: { input: GalleryInput },
    }),
  ],
});
