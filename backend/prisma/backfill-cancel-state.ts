import prisma from '../src/db/prismaClient';

async function backfillCancelState() {
  console.log('--- Starting Backfill for CancelFormRequests stateId ---');
  try {
    const cancelRequests = await (prisma as any).cancelFormRequests.findMany({
      where: { stateId: null },
      include: {
        Licenses: {
          select: { id: true, presentStateId: true, permanentStateId: true },
        },
        requester: {
          select: { id: true, stateId: true },
        },
      },
    });

    console.log(`Found ${cancelRequests.length} cancel requests without stateId.`);

    let updatedCount = 0;
    for (const req of cancelRequests) {
      const resolvedStateId =
        req.Licenses?.presentStateId ||
        req.Licenses?.permanentStateId ||
        req.requester?.stateId ||
        null;

      if (resolvedStateId) {
        await (prisma as any).cancelFormRequests.update({
          where: { id: req.id },
          data: { stateId: resolvedStateId },
        });
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} cancel requests with stateId.`);
  } catch (error) {
    console.error('Error during cancel requests stateId backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillCancelState();
