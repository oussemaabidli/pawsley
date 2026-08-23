import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Pawsley" }, { name: "description", content: "How Pawsley collects, uses and protects personal information." }] }),
  component: () => (
    <SiteShell>
      <div className="container-luxe max-w-3xl py-20 prose prose-neutral">
        <h1 className="font-display text-5xl">Privacy Policy</h1>
        <p className="mt-6 text-muted-foreground">We collect only the information needed to process orders, provide customer support, and improve our services. We never sell your personal data. Edit this page from the admin settings.</p>
      </div>
    </SiteShell>
  ),
});