import {
  messages,
  users,
  type Message,
  type InsertMessage,
  type User,
  type UpsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(): Promise<Message[]>;
  getMessagesByCategory(category: string): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  updateMessageStatus(id: number, status: string): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return result[0];
  }

  async getMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(messages.createdAt);
  }

  async getMessagesByCategory(category: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.category, category))
      .orderBy(messages.createdAt);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);
    return result[0];
  }

  async updateMessageStatus(id: number, status: string): Promise<Message | undefined> {
    const result = await db
      .update(messages)
      .set({ status })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();