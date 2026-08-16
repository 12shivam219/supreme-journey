import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/db.js';

export async function authenticateParent(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const userPayload = request.user as { id: string; role: string };

    if (!userPayload || userPayload.role !== 'parent') {
      return reply.status(403).send({ error: 'Forbidden', message: 'Parent access required' });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or missing access token' });
  }
}

export async function authenticateDeviceToken(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing device token' });
  }

  const token = authHeader.split(' ')[1];
  const device = await prisma.device.findUnique({
    where: { deviceToken: token },
  });

  if (!device) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid device token' });
  }

  // Update last seen timestamp
  await prisma.device.update({
    where: { id: device.id },
    data: { lastSeen: new Date() },
  });

  // Attach device context to request
  (request as any).device = device;
}
