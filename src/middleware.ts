import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

/** Routes that require a signed-in user. Pages redirect to sign-in; API routes answer 401 JSON. */
const PROTECTED_ROUTES = ["/simulations", "/api/simulations"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  const { pathname } = context.url;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtected && !context.locals.user) {
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect("/auth/signin");
  }

  return next();
});
