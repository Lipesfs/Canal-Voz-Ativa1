import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin routes for user management
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.patch('/api/admin/users/:id/admin', isAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { isAdmin } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      await storage.upsertUser({
        ...user,
        isAdmin: isAdmin
      });

      res.json({ message: "Permissões administrativas atualizadas com sucesso" });
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({ message: "Erro ao atualizar permissões" });
    }
  });
  // Submit a new message
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.json({ message: "Mensagem enviada com sucesso!", data: message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Get all messages (admin only)
  app.get("/api/messages", isAdmin, async (req, res) => {
    try {
      const { category } = req.query;
      let messages;
      
      if (category && typeof category === 'string') {
        messages = await storage.getMessagesByCategory(category);
      } else {
        messages = await storage.getMessages();
      }
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  // Get a specific message
  app.get("/api/messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.getMessage(id);
      
      if (!message) {
        res.status(404).json({ message: "Mensagem não encontrada" });
        return;
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar mensagem" });
    }
  });

  // Update message status (admin only)
  app.patch("/api/messages/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "resolved", "archived"].includes(status)) {
        res.status(400).json({ message: "Status inválido" });
        return;
      }
      
      const updatedMessage = await storage.updateMessageStatus(id, status);
      
      if (!updatedMessage) {
        res.status(404).json({ message: "Mensagem não encontrada" });
        return;
      }
      
      res.json({ message: "Status atualizado com sucesso", data: updatedMessage });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  // Delete message (admin only)
  app.delete("/api/messages/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMessage(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Mensagem não encontrada" });
        return;
      }
      
      res.json({ message: "Mensagem excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir mensagem" });
    }
  });

  // Get statistics
  app.get("/api/stats", isAdmin, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyMessages = messages.filter(m => m.createdAt >= thisMonth);
      const resolvedMessages = messages.filter(m => m.status === "resolved");
      
      const stats = {
        thisMonth: monthlyMessages.length,
        actionsTaken: resolvedMessages.length,
        responseRate: messages.length > 0 ? Math.round((resolvedMessages.length / messages.length) * 100) : 0
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
