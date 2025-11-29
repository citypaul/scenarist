/**
 * Production implementation of UserRepository using Prisma.
 *
 * This is a demonstration of what the production implementation looks like.
 * In a real application, you would have Prisma set up with a database.
 *
 * Note: This file is for documentation purposes. The actual tests use
 * InMemoryUserRepository which doesn't require a database.
 */

import type { UserRepository, User, CreateUserInput } from "./user-repository";

// Type for Prisma client - in real app would import from @prisma/client
type PrismaClient = {
  user: {
    findUnique: (args: { where: { id: string } }) => Promise<PrismaUser | null>;
    findFirst: (args: {
      where: { email: string };
    }) => Promise<PrismaUser | null>;
    findMany: () => Promise<PrismaUser[]>;
    create: (args: { data: CreateUserInput }) => Promise<PrismaUser>;
  };
};

type PrismaUser = {
  id: string;
  email: string;
  name: string;
  tier: "standard" | "premium";
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({ where: { email } });
    return user ? this.toUser(user) : null;
  }

  async findAll(): Promise<ReadonlyArray<User>> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.toUser(user));
  }

  async create(data: CreateUserInput): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return this.toUser(user);
  }

  private toUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      tier: prismaUser.tier,
    };
  }
}
