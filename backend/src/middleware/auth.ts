import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    console.log('[Auth] Authorization header:', authHeader ? 'present' : 'missing');
    console.log('[Auth] Request headers:', JSON.stringify(request.headers));
    
    await request.jwtVerify();
    console.log('[Auth] JWT verification successful, user:', request.user);
  } catch (error: any) {
    console.error('[Auth] JWT verification failed:', error.message);
    reply.code(401).send({ error: 'Unauthorized' });
  }
}