import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service.js';

export class UserController {
  static async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userPayload = request.user as { id: string };
    if (!userPayload?.id) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const user = await UserService.getUserById(userPayload.id);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send(user);
  }
}
