import catRestaurantes from '@/assets/gastronomy/cat-restaurantes.jpg';
import catLanchonetes from '@/assets/gastronomy/cat-lanchonetes.jpg';
import catPizzarias from '@/assets/gastronomy/cat-pizzarias.jpg';
import catHamburgueria from '@/assets/gastronomy/cat-hamburgueria.jpg';
import catAcai from '@/assets/gastronomy/cat-acai.jpg';
import catCafes from '@/assets/gastronomy/cat-cafes.jpg';
import catBares from '@/assets/gastronomy/cat-bares.jpg';
import catMarmitas from '@/assets/gastronomy/cat-marmitas.jpg';
import catSushi from '@/assets/gastronomy/cat-sushi.jpg';

export interface GastronomyCategoryShortcut {
  id: string;
  label: string;
  cuisineFilter: string;
  image: string;
}

export const GASTRONOMY_CATEGORY_SHORTCUTS: GastronomyCategoryShortcut[] = [
  { id: 'restaurantes', label: 'Restaurantes', cuisineFilter: 'brasileira', image: catRestaurantes },
  { id: 'lanchonetes', label: 'Lanchonetes', cuisineFilter: 'lanchonete', image: catLanchonetes },
  { id: 'pizzarias', label: 'Pizzarias', cuisineFilter: 'pizzaria', image: catPizzarias },
  { id: 'hamburgueria', label: 'Hamburguer', cuisineFilter: 'hamburgueria', image: catHamburgueria },
  { id: 'acai', label: 'Acai', cuisineFilter: 'sorveteria', image: catAcai },
  { id: 'cafes', label: 'Cafes e Doces', cuisineFilter: 'cafeteria', image: catCafes },
  { id: 'bares', label: 'Bares e Pubs', cuisineFilter: 'bar', image: catBares },
  { id: 'marmitas', label: 'Marmitas / PF', cuisineFilter: 'regional', image: catMarmitas },
  { id: 'sushi', label: 'Sushi / Japones', cuisineFilter: 'japonesa', image: catSushi },
];
