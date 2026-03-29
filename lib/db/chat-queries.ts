import { prisma } from '@/lib/db/client';
import type { Message } from '@/lib/types/chat';

/**
 * Get messages for a league, most recent first.
 */
export async function getLeagueMessages(
  leagueId: string,
  limit = 50
): Promise<Message[]> {
  return prisma.message.findMany({
    where: { leagueId },
    include: {
      user: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Create a new message in a league.
 */
export async function createMessage(
  leagueId: string,
  userId: string,
  content: string
): Promise<Message> {
  return prisma.message.create({
    data: { leagueId, userId, content },
    include: {
      user: { select: { id: true, username: true } },
    },
  });
}

/**
 * Delete a message by ID.
 */
export async function deleteMessage(messageId: string): Promise<void> {
  await prisma.message.delete({ where: { id: messageId } });
}

/**
 * Check if a user can delete a message (author or league admin).
 */
export async function canDeleteMessage(
  messageId: string,
  userId: string
): Promise<boolean> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      league: {
        include: {
          members: {
            where: { userId, status: 'ACTIVE' },
          },
        },
      },
    },
  });

  if (!message) return false;
  if (message.userId === userId) return true;

  const membership = message.league.members[0];
  return membership?.role === 'ADMIN';
}
