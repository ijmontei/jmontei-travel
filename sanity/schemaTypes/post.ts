import { defineField, defineType } from "sanity";
import { GalleryInput } from "../components/GalleryInput";

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

    // ✅ NEW: City (required, since itinerary depends on it)
    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (r) => r.required(),
    }),

    // ✅ NEW: Accommodation (object)
    defineField({
      name: "accommodation",
      title: "Accommodation",
      type: "object",
      fields: [
        defineField({
          name: "name",
          title: "Name",
          type: "string",
        }),
        defineField({
          name: "type",
          title: "Type",
          type: "string",
          options: {
            list: [
              { title: "Hostel", value: "Hostel" },
              { title: "Hotel", value: "Hotel" },
              { title: "Airbnb", value: "Airbnb" },
              { title: "Guesthouse", value: "Guesthouse" },
              { title: "Friend/Family", value: "Friend/Family" },
              { title: "Other", value: "Other" },
            ],
          },
        }),
        defineField({
          name: "address",
          title: "Address",
          type: "string",
        }),
        defineField({
          name: "link",
          title: "Link",
          type: "url",
        }),
        defineField({
          name: "notes",
          title: "Notes",
          type: "text",
          rows: 2,
        }),
      ],
      options: { collapsible: true, collapsed: true },
    }),

    // ✅ NEW: Activities (array of objects)
    defineField({
      name: "activities",
      title: "Activities",
      type: "array",
      of: [
        {
          type: "object",
          name: "activity",
          fields: [
            defineField({
              name: "title",
              title: "Activity",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "timeOfDay",
              title: "Time of day",
              type: "string",
              options: {
                list: [
                  { title: "Morning", value: "Morning" },
                  { title: "Afternoon", value: "Afternoon" },
                  { title: "Evening", value: "Evening" },
                  { title: "All Day", value: "All Day" },
                ],
                layout: "radio",
              },
            }),
            defineField({
              name: "category",
              title: "Category",
              type: "string",
            }),
            defineField({
              name: "link",
              title: "Link",
              type: "url",
            }),
            defineField({
              name: "notes",
              title: "Notes",
              type: "string",
            }),
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "timeOfDay",
            },
          },
        },
      ],
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
