import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Pawsley" }, { name: "description", content: "Answers to common questions about orders, shipping and returns." }] }),
  component: FaqPage,
});

function FaqPage() {
  const { data: faqs = [] } = useQuery({
    queryKey: ["faqs_public"],
    queryFn: async () => ((await supabase.from("faqs").select("*").eq("visible", true).order("sort_order")).data ?? []),
  });

  return (
    <SiteShell>
      <div className="container-luxe max-w-3xl py-20">
        <h1 className="font-display text-5xl">Frequently asked</h1>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger className="text-left font-display text-xl">{f.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SiteShell>
  );
}