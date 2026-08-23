import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/lib/site-settings";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Pawsley" }, { name: "description", content: "Get in touch with the Pawsley team." }] }),
  component: ContactPage,
});
function ContactPage() {
  const { data } = useSiteSettings();
  const email = (data?.brand?.email as string) ?? "";
  const headline = (data?.pages as any)?.contact?.headline ?? "Say hello";
  const subheadline = (data?.pages as any)?.contact?.subheadline ?? "We'd love to hear from you.";
  
  return (
    <SiteShell>
      <div className="container-luxe grid gap-12 py-20 md:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl">{headline}</h1>
          <p className="mt-4 text-muted-foreground">{subheadline}</p>
          {email && <p className="mt-6 text-sm">Email: <a className="underline" href={`mailto:${email}`}>{email}</a></p>}
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Thanks — we'll be in touch"); }}>
          <div><Label>Name</Label><Input required /></div>
          <div><Label>Email</Label><Input type="email" required /></div>
          <div><Label>Message</Label><Textarea required rows={6} /></div>
          <Button className="w-full">Send</Button>
        </form>
      </div>
    </SiteShell>
  );
}