/**
 *  CLASSIFIEDS MUTATIONS - SSOT Write Model
 *
 *  Todas as operacoes de escrita para classificados.
 *  Criao, atualizao, excluso (soft delete).
 *
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { ClassifiedData, CreateClassifiedInput, UpdateClassifiedInput } from "./types";
import { CLASSIFIED_STATUS } from "../constants/statuses";
import { slugify } from "./ClassifiedUrlService";
import {
  CLASSIFIED_READ_SELECT,
  mapClassifiedReadModel,
  type ClassifiedReadRow,
} from "./classifieds.read-model";
import { toClassifiedInsert, toClassifiedUpdate } from "./classifieds.write-model";

//  ============================================================
//  HELPERS INTERNOS
//  ============================================================

/**
 *  Gera slug a partir do ttulo (importado dinamicamente do ClassifiedUrlService)
 */
async function generateSlug(title: string): Promise<string> {
  return slugify(title);
}

//  ============================================================
//  MUTATIONS - CRUD
//  ============================================================

/**
 *  Cria um novo classificado
 */
export async function createClassified(
  userId: string,
  input: CreateClassifiedInput,
): Promise<ClassifiedData> {
  try {
    //  Gera slug automaticamente a partir do ttulo
    const slug = await generateSlug(input.title);

    const { data, error } = await supabase
      .from("classifieds")
      .insert(toClassifiedInsert(userId, input, slug))
      .select(CLASSIFIED_READ_SELECT)
      .single();

    if (error) {
      logger.error("Error creating classified:", error);
      throw error;
    }

    return mapClassifiedReadModel(data as ClassifiedReadRow);
  } catch (error) {
    logger.error("Error in createClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "createClassified",
    });
    throw error;
  }
}

/**
 *  Atualiza um classificado
 */
export async function updateClassified(
  id: string,
  userId: string,
  input: UpdateClassifiedInput,
): Promise<ClassifiedData> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .update(toClassifiedUpdate(input))
      .eq("id", id)
      .eq("seller_id", userId) //  S o vendedor pode atualizar
      .select(CLASSIFIED_READ_SELECT)
      .single();

    if (error) {
      logger.error("Error updating classified:", error);
      throw error;
    }

    return mapClassifiedReadModel(data as ClassifiedReadRow);
  } catch (error) {
    logger.error("Error in updateClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "updateClassified",
    });
    throw error;
  }
}

/**
 *  Deleta um classificado (soft delete - marca como inativo)
 */
export async function deleteClassified(id: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("classifieds")
      .update({ status: CLASSIFIED_STATUS.INACTIVE }) //  Atualiza status ao invs de is_active (que computed)
      .eq("id", id)
      .eq("seller_id", userId); //  S o vendedor pode deletar

    if (error) {
      logger.error("Error deleting classified:", error);
      throw error;
    }

    return true;
  } catch (error) {
    logger.error("Error in deleteClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "deleteClassified",
    });
    throw error;
  }
}

//  ============================================================
//  MUTATIONS - STATUS MANAGEMENT
//  ============================================================

/**
 *  Marca um classificado como vendido
 */
export async function markAsSold(
  id: string,
  userId: string,
): Promise<ClassifiedData> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .update({ status: CLASSIFIED_STATUS.SOLD })
      .eq("id", id)
      .eq("seller_id", userId)
      .select(CLASSIFIED_READ_SELECT)
      .single();

    if (error) {
      logger.error("Error marking classified as sold:", error);
      throw error;
    }

    return mapClassifiedReadModel(data as ClassifiedReadRow);
  } catch (error) {
    logger.error("Error in markAsSold:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "markAsSold",
    });
    throw error;
  }
}

/**
 *  Reativa um classificado inativo
 */
export async function reactivateClassified(
  id: string,
  userId: string,
): Promise<ClassifiedData> {
  try {
    const { data, error } = await supabase
      .from("classifieds")
      .update({ status: CLASSIFIED_STATUS.ACTIVE })
      .eq("id", id)
      .eq("seller_id", userId)
      .select(CLASSIFIED_READ_SELECT)
      .single();

    if (error) {
      logger.error("Error reactivating classified:", error);
      throw error;
    }

    return mapClassifiedReadModel(data as ClassifiedReadRow);
  } catch (error) {
    logger.error("Error in reactivateClassified:", error);
    trackError(error as Error, {
      component: "ClassifiedsMutations",
      action: "reactivateClassified",
    });
    throw error;
  }
}
