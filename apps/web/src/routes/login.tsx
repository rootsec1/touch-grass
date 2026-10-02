import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@touch-grass/ui/components/button";
import { Input } from "@touch-grass/ui/components/input";
import {
  Field,
  FieldLabel,
  FieldGroup,
} from "@touch-grass/ui/components/field";
import { Tabs, TabsList, TabsTrigger } from "@touch-grass/ui/components/tabs";
import { Loader2, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useConfig } from "@/lib/use-journal";
import { ErrorState } from "@/components/page";
export const Route = createFileRoute("/login")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { next?: string; mode?: "signin" | "signup" } => ({
    mode: s.mode === "signin" ? "signin" : undefined,
    next:
      typeof s.next === "string" &&
      /^\/(capture|journal|settings)(\?|\/|$)/.test(s.next)
        ? s.next
        : undefined,
  }),
  component: Login,
});
function Login() {
  const { next, mode = "signup" } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { data: config } = useConfig();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      const fields = {
        email: String(data.get("email")),
        password: String(data.get("password")),
      };
      const result =
        mode === "signup"
          ? await authClient.signUp.email({
              ...fields,
              name: String(data.get("name")).trim(),
            })
          : await authClient.signIn.email(fields);
      if (result.error)
        throw new Error(
          result.error.message || "Please check your details and try again.",
        );
      await navigate({ to: next || "/journal" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't connect. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <div className="auth-layout">
        <div className="auth-visual">
          <img
            src="/images/oak-study.webp"
            alt="Illustrated oak leaves and acorns"
          />
          <div>
            <h2>
              Keep a little
              <br />
              of the outside.
            </h2>
            <p>A private place for your discoveries, season after season.</p>
          </div>
        </div>
        <div className="auth-form">
          <img className="auth-sprig" src="/images/fern-study.webp" alt="" />
          <h1>
            {mode === "signup" ? "Your own field journal." : "Welcome back."}
          </h1>
          <p>
            {mode === "signup"
              ? "Keep the things you notice, wherever you wander."
              : "Pick up where your last walk left off."}
          </p>
          <Tabs
            value={mode}
            onValueChange={(v) => {
              void navigate({
                to: "/login",
                search: { next, mode: v === "signin" ? "signin" : "signup" },
                replace: true,
              });
              setError("");
            }}
            className="mb-5"
          >
            <TabsList className="w-full">
              <TabsTrigger value="signup">Start a journal</TabsTrigger>
              <TabsTrigger value="signin">Sign in</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={submit}>
            <FieldGroup>
              {mode === "signup" ? (
                <Field>
                  <FieldLabel htmlFor="name">Your name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="given-name"
                    placeholder="Your first name"
                    required
                    maxLength={80}
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder={
                    mode === "signup"
                      ? "At least 8 characters"
                      : "Your password"
                  }
                  minLength={8}
                  maxLength={128}
                  required
                />
              </Field>
              {error ? <ErrorState message={error} /> : null}
              <Button variant="field" type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                {mode === "signup" ? "Start my journal" : "Open my journal"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </FieldGroup>
          </form>
          {config?.google ? (
            <Button
              className="w-full mt-3"
              variant="outline"
              onClick={() =>
                void authClient.signIn.social({
                  provider: "google",
                  callbackURL: next || "/journal",
                })
              }
            >
              Continue with Google
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
            Your photos and locations are private. Identification photos are
            sent to Google Gemini to suggest a match.
          </p>
          <Button
            variant="link"
            className="mt-2"
            nativeButton={false}
            render={<Link to="/capture" />}
          >
            Just looking? Try a discovery first
          </Button>
        </div>
      </div>
    </div>
  );
}
