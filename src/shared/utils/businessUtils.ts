// Utilitários para Business

export function tempoRelactive(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

export function formatarHorario(schedule: string): string[] {
  // Se já tem quebras de linha, retorna como está
  if (schedule.includes("\n") || schedule.includes("|")) {
    return schedule
      .split(/\n|\|/)
      .filter((linha) => linha.trim())
      .map((l) => l.trim());
  }

  // Se é formato simples, retorna como está
  if (!schedule.includes(":") || schedule.length < 20) {
    return [schedule];
  }

  // Tenta parsear formato estruturado do banco
  const dias = schedule.split(",").map((d) => d.trim());

  // Agrupa dias consecutivos com mesmo horário
  const grupos: { dias: string[]; schedule: string }[] = [];

  dias.forEach((dia) => {
    const match = dia.match(/^(.+?):\s*(.+)$/);
    if (!match) return;

    const [, nameDia, scheduleDia] = match;
    const ultimoGrupo = grupos[grupos.length - 1];

    if (ultimoGrupo && ultimoGrupo.schedule === scheduleDia.trim()) {
      ultimoGrupo.dias.push(nameDia.trim());
    } else {
      grupos.push({ dias: [nameDia.trim()], schedule: scheduleDia.trim() });
    }
  });

  // Formata os grupos
  return grupos.map((grupo) => {
    if (grupo.dias.length === 1) {
      return `${grupo.dias[0]}: ${grupo.schedule}`;
    }

    // Verifica se são dias consecutivos
    const diasSemana = [
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
      "Domingo",
    ];
    const indices = grupo.dias
      .map((d) => {
        const idx = diasSemana.findIndex((ds) =>
          d.toLowerCase().includes(ds.toLowerCase()),
        );
        return idx;
      })
      .filter((i) => i >= 0);

    if (
      indices.length > 1 &&
      indices.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1)
    ) {
      return `${grupo.dias[0]} a ${grupo.dias[grupo.dias.length - 1]}: ${grupo.schedule}`;
    }

    return grupo.dias.map((d) => `${d}: ${grupo.schedule}`).join("\n");
  });
}
