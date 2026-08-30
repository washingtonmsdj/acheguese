import { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Users, ChevronRight } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { formatBrl } from '@/shared/utils/currency';
import type { EducationProgram } from '@/core/education';

export interface EducationProgramsSectionProps {
  programs: EducationProgram[];
  isLoading?: boolean;
  className?: string;
}

const containerAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4 },
};

const itemAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const EducationProgramsSection = memo(function EducationProgramsSection({
  programs,
  isLoading,
  className,
}: EducationProgramsSectionProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className={cn('text-center py-8 text-gray-400', className)}>
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhum programa cadastrado</p>
      </div>
    );
  }

  return (
    <motion.div {...containerAnimation} className={cn('space-y-3', className)}>
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-500" />
        Programas e Turmas
      </h3>

      {programs.map((program, index) => (
        <motion.div
          key={program.id}
          {...itemAnimation}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className={cn(
            'group bg-white rounded-xl border border-gray-100 p-4',
            'hover:border-blue-200 hover:shadow-sm transition-all',
            program.is_active && 'border-l-4 border-l-blue-500',
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {program.name}
                </h4>
                {program.is_active ? (
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Inativo
                  </Badge>
                )}
              </div>

              {program.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {program.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {program.age_group && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {program.age_group}
                  </span>
                )}
                {program.shift && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {program.shift}
                  </span>
                )}
                {program.modality && (
                  <Badge variant="outline" className="text-xs">
                    {program.modality}
                  </Badge>
                )}
                {program.available_slots !== null && (
                  <span className="text-blue-600 font-medium">
                    {program.available_slots} vagas
                  </span>
                )}
                {program.price_from !== null && (
                  <span className="text-green-600 font-medium">
                    A partir de {formatBrl(program.price_from)}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2 mt-1" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
});
