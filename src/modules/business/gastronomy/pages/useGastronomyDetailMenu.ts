import { useEffect, useMemo, useState } from "react";

import type {
  MenuItemWithRelations,
  MenuWithCategories,
} from "../types";

export type GastronomyMenuViewMode = "list" | "grid";
export type GastronomyMenuSortMode =
  | "relevance"
  | "popular"
  | "price-asc"
  | "price-desc";
export type GastronomyPriceFilter =
  | "all"
  | "under-20"
  | "20-to-35"
  | "over-35";

const ALL_CATEGORY_ID = "__all__";
const EMPTY_MENU_ITEMS: MenuItemWithRelations[] = [];

function itemOrdersCount(item: MenuItemWithRelations) {
  if (
    !item.metadata ||
    typeof item.metadata !== "object" ||
    Array.isArray(item.metadata)
  ) {
    return 0;
  }

  const ordersCount = (item.metadata as Record<string, unknown>).orders_count;
  return typeof ordersCount === "number" ? ordersCount : 0;
}

function matchesPriceFilter(
  item: MenuItemWithRelations,
  filter: GastronomyPriceFilter,
) {
  if (filter === "under-20") return item.base_price < 20;
  if (filter === "20-to-35") {
    return item.base_price >= 20 && item.base_price <= 35;
  }
  if (filter === "over-35") return item.base_price > 35;
  return true;
}

function sortMenuItems(
  items: MenuItemWithRelations[],
  sortMode: GastronomyMenuSortMode,
) {
  return [...items].sort((first, second) => {
    if (sortMode === "popular") {
      return itemOrdersCount(second) - itemOrdersCount(first);
    }
    if (sortMode === "price-asc") return first.base_price - second.base_price;
    if (sortMode === "price-desc") return second.base_price - first.base_price;
    return first.display_order - second.display_order;
  });
}

export function useGastronomyDetailMenu(menu: MenuWithCategories | null) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [priceFilter, setPriceFilter] =
    useState<GastronomyPriceFilter>("all");
  const [sortMode, setSortMode] =
    useState<GastronomyMenuSortMode>("relevance");
  const [viewMode, setViewMode] =
    useState<GastronomyMenuViewMode>("list");

  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    return [...menu.categories].sort(
      (a, b) => a.display_order - b.display_order,
    );
  }, [menu]);

  const allMenuItems = useMemo(
    () =>
      sortedCategories.flatMap((category) =>
        [...(category.items ?? [])].sort(
          (a, b) => a.display_order - b.display_order,
        ),
      ),
    [sortedCategories],
  );

  const categoriesWithAll = useMemo(() => {
    if (sortedCategories.length === 0) return sortedCategories;

    return [
      {
        ...sortedCategories[0],
        id: ALL_CATEGORY_ID,
        name: "Todas",
        display_order: -1,
        items: allMenuItems,
      },
      ...sortedCategories,
    ];
  }, [allMenuItems, sortedCategories]);

  const itemCounts = useMemo(
    () =>
      categoriesWithAll.reduce<Record<string, number>>((counts, category) => {
        counts[category.id] = category.items?.length ?? 0;
        return counts;
      }, {}),
    [categoriesWithAll],
  );

  useEffect(() => {
    if (categoriesWithAll.length === 0) {
      if (activeCategory !== null) setActiveCategory(null);
      return;
    }

    const activeCategoryStillExists = categoriesWithAll.some(
      (category) => category.id === activeCategory,
    );
    if (!activeCategory || !activeCategoryStillExists) {
      setActiveCategory(categoriesWithAll[0].id);
    }
  }, [categoriesWithAll, activeCategory]);

  const activeCategoryData = categoriesWithAll.find(
    (category) => category.id === activeCategory,
  );
  const activeItems = activeCategoryData?.items ?? EMPTY_MENU_ITEMS;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const items = activeItems.filter((item) => {
      const searchableText =
        `${item.name} ${item.description ?? ""}`.toLocaleLowerCase();
      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        matchesPriceFilter(item, priceFilter)
      );
    });

    return sortMenuItems(items, sortMode);
  }, [activeItems, priceFilter, query, sortMode]);

  useEffect(() => {
    setQuery("");
    setPriceFilter("all");
    setSortMode("relevance");
  }, [activeCategory]);

  const clearFilters = () => {
    setQuery("");
    setPriceFilter("all");
    setSortMode("relevance");
  };

  return {
    activeCategory,
    activeCategoryData,
    categoriesWithAll,
    itemCounts,
    filteredItems,
    query,
    setQuery,
    priceFilter,
    setPriceFilter,
    sortMode,
    setSortMode,
    viewMode,
    setViewMode,
    clearFilters,
  };
}

export type GastronomyDetailMenuView = ReturnType<
  typeof useGastronomyDetailMenu
>;
