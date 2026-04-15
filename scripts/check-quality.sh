#!/bin/bash

echo "🔍 Verificando qualidade do código..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de problemas
ISSUES=0

# 1. Verificar lint
echo "📋 Verificando lint..."
if npx eslint src/ --quiet; then
  echo -e "${GREEN}✅ Lint passou${NC}"
else
  echo -e "${RED}❌ Lint falhou${NC}"
  ISSUES=$((ISSUES + 1))
fi
echo ""

# 2. Verificar TypeScript
echo "🔷 Verificando TypeScript..."
if npx tsc --noEmit; then
  echo -e "${GREEN}✅ TypeScript passou${NC}"
else
  echo -e "${RED}❌ TypeScript falhou${NC}"
  ISSUES=$((ISSUES + 1))
fi
echo ""

# 3. Contar 'as any'
echo "🔍 Contando 'as any'..."
ANY_COUNT=$(grep -r "as any" src/core/ 2>/dev/null | wc -l)
if [ "$ANY_COUNT" -lt 100 ]; then
  echo -e "${GREEN}✅ 'as any': $ANY_COUNT (meta: <100)${NC}"
elif [ "$ANY_COUNT" -lt 300 ]; then
  echo -e "${YELLOW}⚠️  'as any': $ANY_COUNT (meta: <100)${NC}"
else
  echo -e "${RED}❌ 'as any': $ANY_COUNT (meta: <100)${NC}"
  ISSUES=$((ISSUES + 1))
fi
echo ""

# 4. Contar TODOs
echo "📝 Contando TODOs..."
TODO_COUNT=$(grep -r "TODO\|FIXME" src/core/ 2>/dev/null | wc -l)
echo -e "${BLUE}ℹ️  TODOs/FIXMEs: $TODO_COUNT${NC}"
echo ""

# 5. Contar magic numbers (números hardcoded comuns)
echo "🔢 Verificando magic numbers..."
MAGIC_COUNT=$(grep -rE "\b(10|20|50|100|1000|5000|10000|15000|30000)\b" src/core/ 2>/dev/null | grep -v "const\|PAGINATION\|TIMEOUTS\|RETRIES" | wc -l)
if [ "$MAGIC_COUNT" -lt 50 ]; then
  echo -e "${GREEN}✅ Magic numbers: $MAGIC_COUNT (meta: <50)${NC}"
elif [ "$MAGIC_COUNT" -lt 100 ]; then
  echo -e "${YELLOW}⚠️  Magic numbers: $MAGIC_COUNT (meta: <50)${NC}"
else
  echo -e "${RED}❌ Magic numbers: $MAGIC_COUNT (meta: <50)${NC}"
fi
echo ""

# 6. Verificar uso de enums
echo "🏷️  Verificando uso de enums..."
ENUM_IMPORTS=$(grep -r "from '@/shared/types/enums'" src/core/ 2>/dev/null | wc -l)
echo -e "${BLUE}ℹ️  Arquivos usando enums: $ENUM_IMPORTS${NC}"
echo ""

# 7. Verificar uso de constantes
echo "📦 Verificando uso de constantes..."
CONST_IMPORTS=$(grep -r "from '@/shared/constants'" src/core/ 2>/dev/null | wc -l)
echo -e "${BLUE}ℹ️  Arquivos usando constantes: $CONST_IMPORTS${NC}"
echo ""

# 8. Verificar uso de helpers tipados
echo "🛠️  Verificando uso de helpers tipados..."
HELPER_IMPORTS=$(grep -r "from '@/shared/utils/supabase-helpers'" src/core/ 2>/dev/null | wc -l)
echo -e "${BLUE}ℹ️  Arquivos usando helpers tipados: $HELPER_IMPORTS${NC}"
echo ""

# Resultado final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ Todas as verificações passaram!${NC}"
  echo ""
  echo "📊 Resumo de Qualidade:"
  echo -e "  • Lint: ${GREEN}✓${NC}"
  echo -e "  • TypeScript: ${GREEN}✓${NC}"
  echo -e "  • 'as any': $ANY_COUNT"
  echo -e "  • TODOs: $TODO_COUNT"
  echo -e "  • Magic numbers: $MAGIC_COUNT"
  echo -e "  • Arquivos com enums: $ENUM_IMPORTS"
  echo -e "  • Arquivos com constantes: $CONST_IMPORTS"
  echo -e "  • Arquivos com helpers: $HELPER_IMPORTS"
  echo ""
  exit 0
else
  echo -e "${RED}❌ $ISSUES verificação(ões) falharam${NC}"
  echo ""
  echo "💡 Dicas:"
  echo "  • Execute 'npx eslint src/ --fix' para corrigir problemas de lint"
  echo "  • Execute 'npx tsc --noEmit' para ver erros de TypeScript"
  echo "  • Considere usar enums ao invés de strings hardcoded"
  echo "  • Considere usar constantes ao invés de magic numbers"
  echo ""
  exit 1
fi
