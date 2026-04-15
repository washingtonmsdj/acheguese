/**
 * TouristPointCategoryCards — Atalhos visuais por tipo de ponto turístico
 *
 * Segue o padrão de GastronomyCategoryCards.
 */

import { motion } from 'framer-motion';
import { TOURIST_CATEGORY_SHORTCUTS } from '../__mocks__/touristPointMocks';
import type { TouristPointCategory } from '../types/categories';

interface Props {
  onCategorySelect: (category: string) => void;
  activeCategory?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export function TouristPointCategoryCards({ onCategorySelect, activeCategory }: Props) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
      variants={containerVariants}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {TOURIST_CATEGORY_SHORTCUTS.map((cat) => (
        <motion.button
          key={cat.id}
          variants={itemVariants}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            onCategorySelect(activeCategory === cat.categoryFilter ? '' : cat.categoryFilter)
          }
          className={`
            relative group rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer
            border-2 transition-colors duration-200
            ${activeCategory === cat.categoryFilter
              ? 'border-primary ring-2 ring-primary/30'
              : 'border-transparent hover:border-primary/40'
            }
          `}
        >
          <img
            src={cat.image}
            alt={cat.label}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{cat.emoji}</span>
              <h3 className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow-lg">
                {cat.label}
              </h3>
            </div>
            <span className="text-white/70 text-xs">{cat.count} locais</span>
          </div>
          {activeCategory === cat.categoryFilter && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}
