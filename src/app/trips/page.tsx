import Image from "next/image";
import { sanityClient } from "@/lib/sanity.client";
import { TRIPS_QUERY } from "@/lib/sanity.queries";
import { urlForImage } from "@/lib/sanity.image";

export default async function TripsPage() {
  const trips = await sanityClient.fetch(TRIPS_QUERY);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Trips</h1>
      <p className="mt-2 text-zinc-600">Browse posts by trip.</p>

      <div className="mt-8 grid gap-6">
        {trips?.map((t: any) => {
          const hero = t.heroImage ? urlForImage(t.heroImage).width(1600).height(900).fit("crop").url() : null;
          return (
            <a key={t._id} href={`/trips/${t.slug}`} className="block group">
              <div className="rounded-2xl border overflow-hidden bg-zinc-50">
                {hero && (
                  <div className="relative aspect-[16/8]">
                    <Image src={hero} alt={t.title} fill className="object-cover group-hover:scale-[1.01] transition" sizes="100vw" />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-lg font-semibold tracking-tight">{t.title}</h2>
                  {t.description && <p className="mt-2 text-sm text-zinc-600">{t.description}</p>}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
