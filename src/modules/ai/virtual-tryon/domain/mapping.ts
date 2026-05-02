import { BodyTarget, TryOnCategory } from './types';

export function categoryToBodyTarget(c: TryOnCategory): BodyTarget {
  switch (c) {
    case TryOnCategory.CLOTHING_UPPER: return BodyTarget.UPPER_BODY;
    case TryOnCategory.CLOTHING_LOWER: return BodyTarget.LOWER_BODY;
    case TryOnCategory.CLOTHING_FULL: return BodyTarget.FULL_BODY;
    case TryOnCategory.SWIMWEAR: return BodyTarget.FULL_BODY;
    case TryOnCategory.FOOTWEAR: return BodyTarget.FEET;
    case TryOnCategory.ACCESSORY_EYEWEAR: return BodyTarget.EYES;
    case TryOnCategory.ACCESSORY_HEADWEAR: return BodyTarget.HEAD;
    case TryOnCategory.ACCESSORY_OTHER: return BodyTarget.HAND;
  }
}
