export const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage,
  country,
  city,
  accommodation{
    name,
    type,
    address,
    link,
    notes
  },
  body,
  gallery
}`;

export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage,
  country,
  city,
  accommodation{
    name,
    type,
    address,
    link,
    notes
  },
  body,
  gallery
}`;
