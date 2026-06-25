export function getActiveRecord<T extends { from: Date; to: Date | null }>(
  histories: T[],
  atDate: Date,
): T | null {
  return (
    histories.find(
      (h) => h.from <= atDate && (h.to === null || h.to >= atDate),
    ) ?? null
  );
}

export function buildTemporalFilter(atDate: Date) {
  return {
    from: { lte: atDate },
    OR: [{ to: null }, { to: { gte: atDate } }],
  };
}

export async function closeActiveRecord(
  prisma: { updateMany: (args: unknown) => Promise<unknown> },
  filterField: string,
  filterId: string,
  closingDate: Date,
): Promise<void> {
  await (prisma as any).updateMany({
    where: {
      [filterField]: filterId,
      to: null,
    },
    data: { to: closingDate },
  });
}
