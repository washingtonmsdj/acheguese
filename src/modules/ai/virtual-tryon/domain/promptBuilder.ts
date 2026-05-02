import { BodyTarget, TryOnCategory, TryOnGender, TryOnStyle } from './types';

interface Args {
  category: TryOnCategory;
  bodyTarget: BodyTarget;
  gender: TryOnGender;
  style: TryOnStyle;
}

const genderText: Record<TryOnGender, string> = {
  male: 'a young adult male model',
  female: 'a young adult female model',
  neutral: 'a young adult androgynous model',
};

const targetInstruction: Record<BodyTarget, string> = {
  upper_body: 'wearing the exact garment from the reference image on the upper body',
  lower_body: 'wearing the exact garment from the reference image on the lower body',
  full_body: 'wearing the exact outfit from the reference image, full body visible',
  feet: 'wearing the exact footwear from the reference image, feet clearly visible',
  head: 'wearing the exact headwear from the reference image, face and head visible',
  eyes: 'wearing the exact eyewear from the reference image on the face',
  hand: 'using the exact accessory from the reference image, hands visible',
};

export function buildTryOnPrompt({ category, bodyTarget, gender, style }: Args): string {
  const subject = genderText[gender];
  const target = targetInstruction[bodyTarget];
  const ctx = category === TryOnCategory.SWIMWEAR
    ? 'beach photoshoot, tasteful fashion editorial, fully appropriate'
    : `${style} fashion photoshoot, studio quality lighting`;

  return [
    `Photorealistic editorial photograph of ${subject}, ${target}.`,
    'Preserve the product color, texture, pattern and shape with high fidelity.',
    'Realistic body proportions, natural pose, coherent shadows and scale.',
    `Scene: ${ctx}.`,
    'Sharp focus, high resolution, professional fashion photography, 85mm lens, soft natural light.',
    'The generated person must be a synthetic model (not a real identifiable person).',
  ].join(' ');
}
