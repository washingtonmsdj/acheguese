import type { Database } from "@/integrations/supabase";
import { CLASSIFIED_STATUS } from "../constants/statuses";
import type { CreateClassifiedInput, UpdateClassifiedInput } from "./types";

type ClassifiedInsert = Database["public"]["Tables"]["classifieds"]["Insert"];
type ClassifiedUpdate = Database["public"]["Tables"]["classifieds"]["Update"];

export function toClassifiedInsert(
  userId: string,
  input: CreateClassifiedInput,
  slug: string,
): ClassifiedInsert {
  return {
    title: input.title,
    description: input.description,
    price: input.price,
    category: input.category,
    condition: input.condition,
    photos: input.photos,
    location_id: input.location_id,
    category_id: input.category_id,
    subcategory_id: input.subcategory_id,
    slug,
    seller_id: userId,
    status: CLASSIFIED_STATUS.ACTIVE,
  };
}

export function toClassifiedUpdate(
  input: UpdateClassifiedInput,
): ClassifiedUpdate {
  const update: ClassifiedUpdate = {};

  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.price !== undefined) update.price = input.price;
  if (input.category !== undefined) update.category = input.category;
  if (input.condition !== undefined) update.condition = input.condition;
  if (input.photos !== undefined) update.photos = input.photos;
  if (input.location_id !== undefined) update.location_id = input.location_id;
  if (input.category_id !== undefined) update.category_id = input.category_id;
  if (input.subcategory_id !== undefined)
    update.subcategory_id = input.subcategory_id;
  if (input.status !== undefined) update.status = input.status;

  return update;
}
