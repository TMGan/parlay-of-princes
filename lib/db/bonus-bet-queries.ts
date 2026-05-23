import { prisma } from './client';

export type BonusBetParameters = {
  sport: string;
  oddsAmerican: number;
  gameStartTime: string;
};

export type ParsedBonusBet = {
  id: string;
  name: string;
  description: string;
  parameters: BonusBetParameters;
  availableDate: Date;
  expiryDate: Date;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export function parseBonusBet(raw: {
  id: string;
  name: string;
  description: string;
  parameters: string;
  availableDate: Date;
  expiryDate: Date;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): ParsedBonusBet {
  return { ...raw, parameters: JSON.parse(raw.parameters) as BonusBetParameters };
}

export async function getActiveBonusBet() {
  const now = new Date();
  const raw = await prisma.bonusBet.findFirst({
    where: {
      availableDate: { lte: now },
      expiryDate: { gte: now },
    },
    orderBy: { availableDate: 'desc' },
  });
  return raw ? parseBonusBet(raw) : null;
}

export async function getAllBonusBets() {
  const rows = await prisma.bonusBet.findMany({
    orderBy: { availableDate: 'desc' },
  });
  return rows.map(parseBonusBet);
}

export async function createBonusBet(data: {
  name: string;
  description: string;
  parameters: BonusBetParameters;
  availableDate: Date;
  expiryDate: Date;
  createdByUserId: string;
}) {
  return prisma.bonusBet.create({
    data: {
      name: data.name,
      description: data.description,
      parameters: JSON.stringify(data.parameters),
      availableDate: data.availableDate,
      expiryDate: data.expiryDate,
      createdByUserId: data.createdByUserId,
    },
  });
}

export async function deleteBonusBet(id: string) {
  return prisma.bonusBet.delete({ where: { id } });
}

export async function updateBonusBet(
  id: string,
  data: {
    name: string;
    description: string;
    parameters: BonusBetParameters;
    availableDate: Date;
    expiryDate: Date;
  }
) {
  return prisma.bonusBet.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      parameters: JSON.stringify(data.parameters),
      availableDate: data.availableDate,
      expiryDate: data.expiryDate,
    },
  });
}

export async function getUserBonusBetForWeek(userId: string, weekNumber: number) {
  return prisma.bet.findFirst({
    where: { userId, weekNumber, isBonusBet: true },
  });
}
