import { useParams } from "react-router-dom";
import { useCatalogBySlug } from "@/lib/use-catalog";
import { RestaurantClient } from "@/pages/restaurant-client";

export default function RestaurantPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const restaurant = useCatalogBySlug(slug) ?? null;

  return <RestaurantClient restaurant={restaurant} slug={slug} />;
}
