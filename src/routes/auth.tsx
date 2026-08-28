import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

// Supabase requires email format — we convert username silently
function toEmail(username: string) {
  return `${username.toLowerCase().trim()}@pawsley-users.app`;
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = toEmail(username);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: username },
        },
      });
      if (error) {
        if (
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists") ||
          error.status === 422
        ) {
          toast.error("This username is already taken. Please choose another.");
        } else {
          toast.error(error.message);
        }
      } else if (
        data?.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        toast.error("This username is already taken. Please choose another.");
      } else {
        toast.success(`Welcome, ${username}! 🎉`);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error("Incorrect username or password. Please try again.");
      } else {
        toast.success(`Welcome back, ${username}!`);
      }
    }

    setLoading(false);
  };

  return (
    <SiteShell>
      <div className="container-luxe grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md rounded-sm border border-border bg-card p-8 space-y-6">
          <div className="text-center">
            <h1 className="font-display text-3xl">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Welcome back!"
                : "Create your account in seconds"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="auth-username">Username</Label>
              <Input
                id="auth-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
              />
            </div>
            <div>
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="underline text-foreground hover:opacity-70"
                  onClick={() => {
                    setMode("signup");
                    setUsername("");
                    setPassword("");
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="underline text-foreground hover:opacity-70"
                  onClick={() => {
                    setMode("signin");
                    setUsername("");
                    setPassword("");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
