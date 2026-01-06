import { FastifyInstance } from 'fastify';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export async function authRoutes(fastify: FastifyInstance) {
  // Public registration disabled - admin only can create users
  fastify.post('/auth/register', async (request, reply) => {
    return reply.code(403).send({ error: 'Public registration is disabled. Contact administrator.' });
  });

  fastify.post('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body as any;

      // Support login with username OR email
      const user = await User.findOne({
        $or: [
          { email: email },
          { username: email }
        ]
      });
      
      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({ 
        id: user._id.toString(), 
        email: user.email,
        isAdmin: user.isAdmin
      });

      return { 
        token, 
        user: { 
          id: user._id,
          username: user.username,
          email: user.email, 
          name: user.name,
          isAdmin: user.isAdmin
        } 
      };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/auth/me', { 
    onRequest: [fastify.authenticate] 
  }, async (request: any, reply) => {
    try {
      const user = await User.findById(request.user.id).select('-password');
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      return { user };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Admin-only user management endpoints
  const checkAdmin = async (request: any, reply: any) => {
    const user = await User.findById(request.user.id);
    if (!user || !user.isAdmin) {
      return reply.code(403).send({ error: 'Admin access required' });
    }
  };

  // List all users (admin only)
  fastify.get('/auth/users', {
    onRequest: [fastify.authenticate, checkAdmin]
  }, async (request: any, reply) => {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return { users };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Create user (admin only)
  fastify.post('/auth/users', {
    onRequest: [fastify.authenticate, checkAdmin]
  }, async (request: any, reply) => {
    try {
      const { username, email, password, name, isAdmin } = request.body as any;

      // Validate username format
      if (!username || !/^[a-zA-Z0-9]+$/.test(username) || username.length > 20) {
        return reply.code(400).send({ error: 'Username must be alphanumeric only (max 20 characters)' });
      }

      // Check for existing username
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return reply.code(400).send({ error: 'Username already exists' });
      }

      // Check for existing email
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return reply.code(400).send({ error: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        name,
        isAdmin: isAdmin || false,
      });

      return { 
        user: { 
          id: user._id,
          username: user.username,
          email: user.email, 
          name: user.name,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt
        } 
      };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Update user (admin only)
  fastify.put('/auth/users/:id', {
    onRequest: [fastify.authenticate, checkAdmin]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      const { username, email, name, isAdmin, password } = request.body as any;

      const user = await User.findById(id);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Validate and update username if provided
      if (username) {
        if (!/^[a-zA-Z0-9]+$/.test(username) || username.length > 20) {
          return reply.code(400).send({ error: 'Username must be alphanumeric only (max 20 characters)' });
        }
        // Check if username is taken by another user
        const existingUsername = await User.findOne({ username, _id: { $ne: id } });
        if (existingUsername) {
          return reply.code(400).send({ error: 'Username already exists' });
        }
        user.username = username;
      }

      // Check if email is taken by another user
      if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: id } });
        if (existingEmail) {
          return reply.code(400).send({ error: 'Email already exists' });
        }
        user.email = email;
      }

      if (name) user.name = name;
      if (typeof isAdmin !== 'undefined') user.isAdmin = isAdmin;
      if (password) user.password = await bcrypt.hash(password, 10);

      await user.save();

      return { 
        user: { 
          id: user._id,
          username: user.username,
          email: user.email, 
          name: user.name,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        } 
      };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Delete user (admin only)
  fastify.delete('/auth/users/:id', {
    onRequest: [fastify.authenticate, checkAdmin]
  }, async (request: any, reply) => {
    try {
      const { id } = request.params;
      
      // Prevent self-deletion
      if (id === request.user.id) {
        return reply.code(400).send({ error: 'Cannot delete your own account' });
      }

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return { success: true, message: 'User deleted' };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });
}