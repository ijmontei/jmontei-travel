export type Accommodation = {
  name?: string;
  type?: string; // Hostel / Hotel / Airbnb / etc.
  address?: string;
  link?: string;
  notes?: string;
};

export type Activity = {
  title?: string;
  timeOfDay?: "Morning" | "Afternoon" | "Evening" | "All Day";
  category?: string; // Hike / Food / Museum / Travel / etc.
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
};
