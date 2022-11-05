import { FastifyInstance } from "fastify";
import ShortUniqueId from "short-unique-id";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function poolRoutes(fastify: FastifyInstance) {
  fastify.get("/pools/count", async () => {
    return { count: await prisma.pool.count() };
  });

  fastify.post("/pools", async (request, reply) => {
    const createPoolBody = z.object({
      title: z.string(),
    });

    const { title } = createPoolBody.parse(request.body);

    const generate = new ShortUniqueId({ length: 6 });
    const code = String(generate()).toUpperCase();

    // se o usuário está logado crio o bolão com o ownerId
    try {
      await request.jwtVerify(); // verifica se está logado

      await prisma.pool.create({
        data: {
          title,
          code: code,
          ownerId: request.user.sub,
          participants: {
            create: {
              userId: request.user.sub,
            },
          },
        },
      });
    } catch (error) {
      await prisma.pool.create({
        data: {
          title,
          code: code,
        },
      });
    }

    return reply.status(201).send({ code });
  });
}
