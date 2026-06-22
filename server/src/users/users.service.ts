// ======================================================
// GEOBOARD — USERS SERVICE
// ======================================================

import prisma from '../common/prisma.js'
import { NotFoundError } from '../common/errors.js'
import type { AuthUser } from '../types/index.js'

export class UsersService {
  async getProfile(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
      },
    })

    if (!user) throw new NotFoundError('User')
    return user
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
      },
    })

    return user
  }

  async deleteAccount(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    })
  }
}

export const usersService = new UsersService()