import { defineField, defineType } from "sanity";

export const trip = defineType({
  name: "trip",
  title: "Trip",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "startDate", title: "Start date", type: "date" }),
    defineField({ name: "endDate", title: "End date", type: "date" }),
    defineField({ name: "description", title: "Description", type: "text" }),
    defineField({ name: "heroImage", title: "Hero image", type: "image", options: { hotspot: true } }),
  ],
});
