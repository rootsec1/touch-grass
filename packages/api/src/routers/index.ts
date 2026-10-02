import { and, eq, inArray, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  discovery,
  photo,
  visit,
  pushSubscription,
  rateLimit,
} from "@touch-grass/db/schema/nature";
import {
  discoveryInputSchema,
  discoveryEditSchema,
  identificationSchema,
  identifyInputSchema,
  pushInputSchema,
  visitInputSchema,
} from "../domain";
import { protectedProcedure, publicProcedure, router } from "../index";
import type { Context } from "../context";

async function ownedDiscovery(ctx: Context, id: string) {
  const [item] = await ctx.db
    .select()
    .from(discovery)
    .where(
      and(eq(discovery.id, id), eq(discovery.userId, ctx.session!.user.id)),
    );
  if (!item)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "This discovery couldn't be found.",
    });
  return item;
}
async function checkPhotos(ctx: Context, ids: string[]) {
  const photos = await ctx.db
    .select({ id: photo.id })
    .from(photo)
    .where(and(inArray(photo.id, ids), eq(photo.userId, ctx.session!.user.id)));
  if (new Set(ids).size !== ids.length || photos.length !== ids.length)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Please upload your photos again.",
    });
}
function serialize(item: typeof discovery.$inferSelect) {
  const parsed = identificationSchema.safeParse(item.identification);
  return { ...item, identification: parsed.success ? parsed.data : null };
}

export const appRouter = router({
  config: publicProcedure.query(({ ctx }) => ctx.publicConfig),
  identify: publicProcedure
    .input(identifyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const key = `identify:${ctx.session?.user.id || ctx.rateLimitKey}:${new Date().toISOString().slice(0, 10)}`;
      const [limit] = await ctx.db
        .insert(rateLimit)
        .values({ key, expiresAt: new Date(Date.now() + 86400000) })
        .onConflictDoUpdate({
          target: rateLimit.key,
          set: { count: sql`${rateLimit.count} + 1` },
        })
        .returning();
      if (!limit || limit.count > (ctx.session ? 50 : 5))
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "You've reached today's identification limit. You can still save photographs and try again tomorrow.",
        });
      return ctx.identify(input);
    }),
  journal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await ctx.db
        .select()
        .from(discovery)
        .where(eq(discovery.userId, ctx.session.user.id))
        .orderBy(desc(discovery.observedAt));
      const visits = items.length
        ? await ctx.db
            .select()
            .from(visit)
            .where(
              inArray(
                visit.discoveryId,
                items.map((i) => i.id),
              ),
            )
            .orderBy(desc(visit.observedAt))
        : [];
      return items.map((item) => ({
        ...serialize(item),
        visits: visits.filter((v) => v.discoveryId === item.id),
      }));
    }),
    create: protectedProcedure
      .input(discoveryInputSchema)
      .mutation(async ({ ctx, input }) => {
        await checkPhotos(ctx, input.photoIds);
        const [existing] = await ctx.db
          .select()
          .from(discovery)
          .where(eq(discovery.id, input.id));
        if (existing) {
          if (existing.userId !== ctx.session.user.id)
            throw new TRPCError({ code: "CONFLICT" });
          return serialize(existing);
        }
        await ctx.db
          .insert(discovery)
          .values({
            ...input,
            observedAt: new Date(input.observedAt),
            userId: ctx.session.user.id,
          })
          .onConflictDoNothing();
        return serialize(await ownedDiscovery(ctx, input.id));
      }),
    update: protectedProcedure
      .input(discoveryEditSchema)
      .mutation(async ({ ctx, input }) => {
        const original = await ownedDiscovery(ctx, input.id);
        const { id, ...changes } = input;
        const [item] = await ctx.db
          .update(discovery)
          .set({
            ...changes,
            ...(original.scientificName !== changes.scientificName ||
            original.commonName !== changes.commonName
              ? { identification: null }
              : {}),
          })
          .where(
            and(
              eq(discovery.id, id),
              eq(discovery.userId, ctx.session.user.id),
            ),
          )
          .returning();
        return serialize(item!);
      }),
    setIdentification: protectedProcedure
      .input(z.object({ id: z.uuid(), identification: identificationSchema }))
      .mutation(async ({ ctx, input }) => {
        await ownedDiscovery(ctx, input.id);
        if (!input.identification.isPlant)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "No clear plant was found. Try a closer photograph on your next visit.",
          });
        await ctx.db
          .update(discovery)
          .set({
            identification: input.identification,
            commonName: input.identification.commonName,
            scientificName: input.identification.scientificName,
          })
          .where(
            and(
              eq(discovery.id, input.id),
              eq(discovery.userId, ctx.session.user.id),
            ),
          );
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        const item = await ownedDiscovery(ctx, input.id);
        const visits = await ctx.db
          .select()
          .from(visit)
          .where(eq(visit.discoveryId, input.id));
        await ctx.db
          .delete(discovery)
          .where(
            and(
              eq(discovery.id, input.id),
              eq(discovery.userId, ctx.session.user.id),
            ),
          );
        await ctx.cleanUnusedPhotos([
          ...item.photoIds,
          ...visits.flatMap((v) => v.photoIds),
        ]);
        return { success: true };
      }),
    addVisit: protectedProcedure
      .input(visitInputSchema)
      .mutation(async ({ ctx, input }) => {
        await ownedDiscovery(ctx, input.discoveryId);
        await checkPhotos(ctx, input.photoIds);
        const [existing] = await ctx.db
          .select()
          .from(visit)
          .where(eq(visit.id, input.id));
        if (existing) {
          if (existing.discoveryId !== input.discoveryId)
            throw new TRPCError({ code: "CONFLICT" });
          return existing;
        }
        await ctx.db
          .insert(visit)
          .values({ ...input, observedAt: new Date(input.observedAt) })
          .onConflictDoNothing();
        const [item] = await ctx.db
          .select()
          .from(visit)
          .where(eq(visit.id, input.id));
        if (item?.discoveryId !== input.discoveryId)
          throw new TRPCError({ code: "CONFLICT" });
        return item;
      }),
  }),
  notifications: router({
    status: protectedProcedure.input(z.object({ endpoint: z.url() })).query(
      async ({ ctx, input }) =>
        (
          await ctx.db
            .select({ endpoint: pushSubscription.endpoint })
            .from(pushSubscription)
            .where(
              and(
                eq(pushSubscription.userId, ctx.session.user.id),
                eq(pushSubscription.endpoint, input.endpoint),
              ),
            )
        ).length > 0,
    ),
    subscribe: protectedProcedure
      .input(pushInputSchema)
      .mutation(async ({ ctx, input }) => {
        const url = new URL(input.endpoint);
        const allowed = [
          "fcm.googleapis.com",
          "updates.push.services.mozilla.com",
          "web.push.apple.com",
          "wns.windows.com",
          "notify.windows.com",
        ];
        if (
          url.protocol !== "https:" ||
          url.port ||
          url.username ||
          url.password ||
          !allowed.some(
            (host) =>
              url.hostname === host || url.hostname.endsWith(`.${host}`),
          )
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported notification service.",
          });
        await ctx.db
          .insert(pushSubscription)
          .values({
            endpoint: input.endpoint,
            userId: ctx.session.user.id,
            ...input.keys,
          })
          .onConflictDoUpdate({
            target: pushSubscription.endpoint,
            set: { userId: ctx.session.user.id, ...input.keys },
          });
        return { success: true };
      }),
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.url() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db
          .delete(pushSubscription)
          .where(
            and(
              eq(pushSubscription.userId, ctx.session.user.id),
              eq(pushSubscription.endpoint, input.endpoint),
            ),
          );
        return { success: true };
      }),
    test: protectedProcedure.mutation(async ({ ctx }) => {
      const delivered = await ctx.sendTestPush(ctx.session.user.id);
      if (!delivered)
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message:
            "The notification wasn't delivered. Check your browser's notification permission and try again.",
        });
      return { delivered };
    }),
  }),
});
export type AppRouter = typeof appRouter;
