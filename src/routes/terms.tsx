import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Pawsley" }, { name: "description", content: "Terms governing purchases and use of the Pawsley website." }] }),
  component: () => (
    <SiteShell>
      <div className="container-luxe max-w-3xl py-20">
        <h1 className="font-display text-5xl">Terms & Conditions</h1>
        <p className="mt-6 text-muted-foreground">By using this site you agree to our standard commerce terms covering orders, returns, and acceptable use. Edit this page from the admin settings.</p>
      </div>
    </SiteShell>
  ),
});