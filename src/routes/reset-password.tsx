import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
});

function ResetPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  return (
    <SiteShell>
      <div className="container-luxe grid min-h-[60vh] place-items-center">
        <form
          className="w-full max-w-sm rounded-sm border border-border p-4 sm:p-8"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ password });
            setLoading(false);
            if (error) toast.error(error.message);
            else {
              toast.success("Password updated");
              navigate({ to: "/account" });
            }
          }}
        >
          <h1 className="font-display text-2xl">Set a new password</h1>
          <div className="mt-4">
            <Label>New password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="mt-4 w-full" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
      </div>
    </SiteShell>
  );
}
