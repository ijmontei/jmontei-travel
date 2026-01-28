export type Accommodation = {
  name?: string;
  type?: string; // Hostel / Hotel / Airbnb / etc.
  address?: string;
  link?: string;
  notes?: string;
};


export type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  coverImage?: any;
  country?: string;

  // NEW
  city?: string;
  accommodation?: Accommodation;
  bodyText?: string;
};
