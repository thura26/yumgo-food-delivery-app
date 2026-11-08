import type { HomeCategory, Restaurant } from "@/lib/types";

export const homeCategories: HomeCategory[] = [
  { id: "all", name: "All", tag: "All" },
  { id: "rice", name: "Rice", tag: "Rice" },
  { id: "noodles", name: "Noodles", tag: "Noodles" },
  { id: "chicken", name: "Chicken", tag: "Chicken" },
  { id: "burgers", name: "Burgers", tag: "Burgers" },
  { id: "drinks", name: "Drinks", tag: "Drinks" },
  { id: "desserts", name: "Desserts", tag: "Desserts" },
];

export function filterRestaurants(
  list: Restaurant[],
  query: string,
  category = "All",
) {
  const q = query.trim().toLowerCase();
  return list.filter((restaurant) => {
    const matchesCategory =
      category === "All" ||
      restaurant.tags.some(
        (tag) => tag.toLowerCase() === category.toLowerCase(),
      ) ||
      restaurant.cuisine.toLowerCase().includes(category.toLowerCase());
    const matchesQuery =
      !q ||
      restaurant.name.toLowerCase().includes(q) ||
      restaurant.cuisine.toLowerCase().includes(q) ||
      restaurant.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      restaurant.categories.some((c) =>
        c.items.some((item) => item.name.toLowerCase().includes(q)),
      );
    return matchesCategory && matchesQuery;
  });
}
