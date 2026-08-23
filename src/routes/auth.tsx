import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate({ to: "/account" }); }, [user, navigate]);

  return (
    <SiteShell>
      <div className="container-luxe grid min-h-[70vh] place-items-center py-16">
        <div className="w-full max-w-md rounded-sm border border-border bg-card p-8">
          <div className="text-center">
            <h1 className="font-display text-3xl">Welcome</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in or create an account</p>
          </div>
          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={async () => {
              const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (result.error) toast.error(String(result.error));
            }}
          >Continue with Google</Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
              <TabsTrigger value="forgot">Forgot</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignIn /></TabsContent>
            <TabsContent value="signup"><SignUp /></TabsContent>
            <TabsContent value="forgot"><Forgot /></TabsContent>
          </Tabs>
        </div>
      </div>
    </SiteShell>
  );
}

function SignIn() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false);
  return (
    <form className="mt-4 space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) toast.error(error.message); else toast.success("Signed in");
    }}>
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
function SignUp() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [loading, setLoading] = useState(false);
  return (
    <form className="mt-4 space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin } });
      setLoading(false);
      if (error) toast.error(error.message); else toast.success("Account created — you're signed in");
    }}>
      <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Password</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <Button className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
    </form>
  );
}
function Forgot() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false);
  return (
    <form className="mt-4 space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      setLoading(false);
      if (error) toast.error(error.message); else toast.success("Reset link sent");
    }}>
      <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <Button className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
      <p className="text-center text-xs text-muted-foreground"><Link to="/auth">Back to sign in</Link></p>
    </form>
  );
}