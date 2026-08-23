import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { useSiteSettings, getBrandName } from "@/lib/site-settings";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Pawsley" }, { name: "description", content: "The story behind Pawsley — premium, considered pet accessories." }] }),
  component: AboutPage,
});
function AboutPage() {
  const { data } = useSiteSettings();
  const brand = getBrandName(data);
  const about = (data?.footer?.about as string) ?? "";
  const headline = (data?.pages as any)?.about?.headline ?? "Considered by design.";
  return (
    <SiteShell>
      <div className="container-luxe max-w-3xl py-20">
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">About {brand}</div>
        <h1 className="mt-4 font-display text-5xl">{headline}</h1>
        <p className="mt-8 text-lg text-muted-foreground">{about || `${brand} was founded on the belief that pet accessories should be as considered as the ones we choose for ourselves. Every piece is made from responsibly sourced materials, in small runs, with respect for craft.`}</p>
      </div>
    </SiteShell>
  );
}