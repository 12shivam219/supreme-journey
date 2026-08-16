import { prisma } from '../config/db.js';
import { CreateChildDTO, DeviceType } from '@tracker/shared';
import crypto from 'crypto';

export class FamilyService {
  static async createChildProfile(parentId: string, dto: CreateChildDTO) {
    const child = await prisma.user.create({
      data: {
        name: dto.name,
        email: `child_${crypto.randomBytes(6).toString('hex')}@tracker.local`,
        passwordHash: 'NO_PASSWORD_CHILD_PROFILE',
        role: 'child',
        age: dto.age || null,
        avatar: dto.avatar || null,
      },
    });

    await prisma.familyLink.create({
      data: {
        parentId,
        childId: child.id,
      },
    });

    return {
      id: child.id,
      name: child.name,
      role: child.role,
      age: child.age,
      avatar: child.avatar,
      createdAt: child.createdAt,
    };
  }

  static async getChildrenForParent(parentId: string) {
    const links = await prisma.familyLink.findMany({
      where: { parentId },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            role: true,
            age: true,
            avatar: true,
            createdAt: true,
            devices: {
              select: {
                id: true,
                deviceName: true,
                type: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    return links.map((link) => link.child);
  }

  static async generatePairingCode(parentId: string, childId: string) {
    // Verify parent relationship
    const link = await prisma.familyLink.findUnique({
      where: {
        parentId_childId: {
          parentId,
          childId,
        },
      },
    });

    if (!link) {
      throw new Error('CHILD_NOT_FOUND');
    }

    // Generate 6-digit numeric pairing code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Valid for 15 minutes

    await prisma.pairingCode.create({
      data: {
        childId,
        code,
        expiresAt,
      },
    });

    const qrPayload = JSON.stringify({
      code,
      childId,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      pairingCode: code,
      expiresAt,
      qrPayload,
    };
  }

  static async pairDevice(pairingCode: string, deviceName: string, type: DeviceType) {
    const record = await prisma.pairingCode.findUnique({
      where: { code: pairingCode },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new Error('INVALID_OR_EXPIRED_PAIRING_CODE');
    }

    // Mark pairing code as used
    await prisma.pairingCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const deviceToken = `agent_${crypto.randomBytes(32).toString('hex')}`;

    const device = await prisma.device.create({
      data: {
        childId: record.childId,
        deviceName,
        type,
        deviceToken,
      },
    });

    return {
      deviceId: device.id,
      deviceToken,
    };
  }
}
