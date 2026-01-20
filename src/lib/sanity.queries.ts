export const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage,
  trip->{
    title,
    "slug": slug.current
  }
}`;

export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage,
  trip->{
    title,
    "slug": slug.current
  },
  body,
  gallery
}`;

export const TRIPS_QUERY = `*[_type == "trip" && defined(slug.current)] | order(startDate desc){
  _id,
  title,
  "slug": slug.current,
  startDate,
  endDate,
  description,
  heroImage
}`;

export const POSTS_BY_TRIP_QUERY = `*[_type == "post" && trip->slug.current == $tripSlug] | order(publishedAt desc){
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage
}`;
