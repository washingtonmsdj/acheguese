/**
 * Utilitários para formatação e manipulação de horários de funcionamento
 */

export interface BusinessHours {
  day: string;
  hours: string;
  isToday?: boolean;
  isOpen?: boolean;
}

/**
 * Formata uma string de horário de funcionamento em uma estrutura mais legível
 */
export function parseBusinessHours(hoursString: string): BusinessHours[] {
  if (!hoursString) return [];

  const lines = hoursString.split("\n").filter((line) => line.trim());
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  const dayMap: Record<string, number> = {
    domingo: 0,
    segunda: 1,
    terça: 2,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sábado: 6,
    sabado: 6,
  };

  return lines.map((line, index) => {
    const cleanLine = line.trim();

    // Detectar se é o dia atual
    let isToday = false;
    const lowerLine = cleanLine.toLowerCase();

    for (const [dayName, dayNumber] of Object.entries(dayMap)) {
      if (lowerLine.includes(dayName) && dayNumber === today) {
        isToday = true;
        break;
      }
    }

    // Detectar se está fechado
    const isOpen = !lowerLine.includes("fechado");

    // Separar dia e horário
    const colonIndex = cleanLine.indexOf(":");
    let day = "";
    let hours = "";

    if (colonIndex > 0) {
      day = cleanLine.substring(0, colonIndex).trim();
      hours = cleanLine.substring(colonIndex + 1).trim();
    } else {
      // Se não tem dois pontos, assume que é tudo horário
      day = "";
      hours = cleanLine;
    }

    return {
      day,
      hours,
      isToday,
      isOpen,
    };
  });
}

/**
 * Verifica se o negócio está aberto agora
 */
export function isBusinessOpenNow(hoursString: string): boolean {
  if (!hoursString) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde meia-noite

  const parsedHours = parseBusinessHours(hoursString);
  const todayHours = parsedHours.find((h) => h.isToday);

  if (!todayHours || !todayHours.isOpen) return false;

  // Extrair horários do formato "11:00 às 15:00 e 18:00 às 22:00"
  const timeRanges = todayHours.hours.match(
    /(\d{1,2}):(\d{2})\s*às?\s*(\d{1,2}):(\d{2})/g,
  );

  if (!timeRanges) return false;

  for (const range of timeRanges) {
    const match = range.match(/(\d{1,2}):(\d{2})\s*às?\s*(\d{1,2}):(\d{2})/);
    if (match) {
      const [, startHour, startMin, endHour, endMin] = match;
      const startTime = parseInt(startHour) * 60 + parseInt(startMin);
      const endTime = parseInt(endHour) * 60 + parseInt(endMin);

      if (currentTime >= startTime && currentTime <= endTime) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Formata horário para exibição mais limpa
 */
export function formatBusinessHours(hoursString: string): string {
  if (!hoursString) return "";

  return hoursString.replace(/\n/g, "\n").replace(/\s+/g, " ").trim();
}

/**
 * Obtém o status atual do negócio (Aberto/Fechado)
 */
export function getBusinessStatus(hoursString: string): {
  isOpen: boolean;
  status: string;
  nextChange?: string;
} {
  const isOpen = isBusinessOpenNow(hoursString);

  return {
    isOpen,
    status: isOpen ? "Aberto agora" : "Fechado",
  };
}

/**
 * Verifica se um negócio está aberto agora baseado em string de horário simples
 * @param schedule - String com o horário de funcionamento
 */
export function isOpenNow(schedule: string): boolean {
  if (!schedule) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const dayNames = [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado",
  ];
  const currentDayName = dayNames.at(currentDay) ?? "domingo";
  const scheduleLower = schedule.toLowerCase();

  if (
    scheduleLower.includes("fechado") &&
    scheduleLower.includes(currentDayName)
  ) {
    return false;
  }

  const patterns = [
    /(\w+)\s*a\s*(\w+):\s*(\d{1,2}):(\d{2})\s*às\s*(\d{1,2}):(\d{2})/gi,
    /seg.*sáb:\s*(\d{1,2}):(\d{2})\s*às\s*(\d{1,2}):(\d{2})/gi,
    /seg.*dom:\s*(\d{1,2}):(\d{2})\s*às\s*(\d{1,2}):(\d{2})/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...scheduleLower.matchAll(pattern)];
    for (const match of matches) {
      let startHour: number, startMin: number, endHour: number, endMin: number;

      if (match.length === 7) {
        const [, startDay, endDay] = match;
        const startDayIndex = dayNames.findIndex((d) =>
          startDay.includes(d.substring(0, 3)),
        );
        const endDayIndex = dayNames.findIndex((d) =>
          endDay.includes(d.substring(0, 3)),
        );
        if (startDayIndex === -1 || endDayIndex === -1) continue;
        const isInDayRange =
          (startDayIndex <= endDayIndex &&
            currentDay >= startDayIndex &&
            currentDay <= endDayIndex) ||
          (startDayIndex > endDayIndex &&
            (currentDay >= startDayIndex || currentDay <= endDayIndex));
        if (!isInDayRange) continue;
        [, , , startHour, startMin, endHour, endMin] = match.map((m, i) =>
          i > 2 ? parseInt(m) : m,
        ) as any;
      } else if (match.length === 5) {
        [, startHour, startMin, endHour, endMin] = match.map((m) =>
          parseInt(m),
        ) as any;
        if (
          scheduleLower.includes("seg") &&
          scheduleLower.includes("sáb") &&
          currentDay === 0
        )
          continue;
      } else {
        continue;
      }

      const openTime = startHour * 60 + startMin;
      const closeTime = endHour * 60 + endMin;
      if (currentTime >= openTime && currentTime <= closeTime) return true;
    }
  }

  return true;
}

/**
 * Obtém o horário de fechamento de hoje
 */
export function getClosingTime(schedule: string): string | null {
  if (!schedule) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const dayNames = [
    "domingo",
    "segunda",
    "terça",
    "quarta",
    "quinta",
    "sexta",
    "sábado",
  ];
  const currentDayName = dayNames.at(currentDay) ?? "domingo";
  const scheduleLower = schedule.toLowerCase();

  if (
    scheduleLower.includes("fechado") &&
    scheduleLower.includes(currentDayName)
  )
    return null;

  const timePattern = /(\d{1,2}):(\d{2})\s*às\s*(\d{1,2}):(\d{2})/gi;
  const matches = [...scheduleLower.matchAll(timePattern)];

  if (matches.length > 0) {
    const [, , , endHour, endMin] = matches[0];
    return `${endHour}:${endMin}`;
  }

  return null;
}
