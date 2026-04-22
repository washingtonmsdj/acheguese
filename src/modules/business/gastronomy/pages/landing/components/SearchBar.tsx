/**
 * Componente de barra de pesquisa para gastronomia
 * UI/UX melhorada com animações e feedback visual
 */

import { useState } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TRENDING_SEARCHES = [
  'Pizza',
  'Hambúrguer',
  'Sushi',
  'Açaí',
  'Marmita',
  'Pastel',
];

export function SearchBar(props: SearchBarProps) {
  const {
    value,
    onChange,
    placeholder = 'Buscar lojas, pratos, bebidas...',
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const handleTrendingClick = (term: string) => {
    onChange(term);
  };

  return (
    <div className="w-full space-y-3">
      {/* Barra de pesquisa principal */}
      <motion.div
        initial={false}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="relative w-full"
      >
        {/* Ícone de busca - FIXO com display inline-flex */}
        <div className="pointer-events-none absolute inset-y-0 left-3 sm:left-4 inline-flex items-center justify-center z-10">
          <motion.div
            initial={false}
            animate={{
              scale: isFocused ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="text-primary"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.div>
        </div>

        {/* Input */}
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="h-12 sm:h-14 pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm sm:text-base rounded-xl sm:rounded-2xl border-2 border-border/50 bg-card/90 backdrop-blur-md shadow-sm hover:shadow-md focus:shadow-lg focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground/60"
        />

        {/* Botão limpar - FIXO com display inline-flex */}
        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-y-0 right-2 sm:right-3 inline-flex items-center justify-center"
            >
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-full p-1.5 sm:p-2 transition-all duration-200"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de foco */}
        <AnimatePresence>
          {isFocused && !value && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Buscas em alta - apenas quando não está pesquisando */}
      <AnimatePresence>
        {!value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Em alta:</span>
            </div>
            {TRENDING_SEARCHES.map((term, index) => (
              <motion.div
                key={term}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium"
                  onClick={() => handleTrendingClick(term)}
                >
                  {term}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback de busca ativa */}
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
          >
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            <span className="truncate">
              Buscando por <span className="font-semibold text-foreground">&quot;{value}&quot;</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
