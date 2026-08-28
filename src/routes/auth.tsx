import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

// Convert username to internal Supabase email format
function toEmail(username: string) {
  return `${username.toLowerCase().trim()}@pawsley-users.app`;
}

// Clean a raw string into a valid username base (lowercase, no spaces/symbols)
function cleanBase(raw: string): string {
  return raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
}

// Generate N unique username suggestions from a base string
function generateSuggestions(base: string, count = 3): string[] {
  const clean = cleanBase(base);
  if (!clean) return [];
  const used = new Set<number>();
  const results: string[] = [];
  while (results.length < count) {
    // 3-digit suffix: enough variety, short enough to read
    const num = Math.floor(100 + Math.random() * 900);
    if (!used.has(num)) {
      used.add(num);
      results.push(`${clean}${num}`);
    }
  }
  return results;
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  // Generate suggestions whenever the username changes (register mode only)
  useEffect(() => {
    if (mode !== "signup") {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (username.length < 2) {
      setSuggestions([]);
      return;
    }
    // Debounce: wait 400ms after user stops typing
    debounceRef.current = setTimeout(() => {
      setSuggestions(generateSuggestions(username));
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = toEmail(username);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: username } },
      });

      if (error) {
        const isTaken =
          error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists") ||
          error.status === 422;

        if (isTaken) {
          // Refresh suggestions with new random numbers on every failure
          setSuggestions(generateSuggestions(username));
          toast.error("Username already taken — pick one of the suggestions below!");
        } else {
          toast.error(error.message);
        }
      } else if (
        data?.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        // Supabase email enumeration protection returned a fake success
        setSuggestions(generateSuggestions(username));
        toast.error("Username already taken — pick one of the suggestions below!");
      } else {
        setSuggestions([]);
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

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setUsername("");
    setPassword("");
    setSuggestions([]);
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

              {/* Suggestions — only shown in register mode */}
              {mode === "signup" && suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    💡 Suggested usernames — click one to use it:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setUsername(s);
                          setSuggestions([]);
                        }}
                        className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                  onClick={() => switchMode("signup")}
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
                  onClick={() => switchMode("signin")}
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
