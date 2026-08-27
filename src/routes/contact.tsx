import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/lib/site-settings";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Pawsley" },
      { name: "description", content: "Get in touch with the Pawsley team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useSiteSettings();
  const email = (data?.brand?.email as string) ?? "";
  const phone = (data?.brand?.phone as string) ?? "";
  const headline = (data?.pages as any)?.contact?.headline ?? "Say hello";
  const subheadline =
    (data?.pages as any)?.contact?.subheadline ?? "We'd love to hear from you.";

  const [name, setName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email: userEmail,
      message,
      rating: rating > 0 ? rating : null,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to send message: " + error.message);
    } else {
      toast.success("Thanks — we'll be in touch!");
      setName("");
      setUserEmail("");
      setMessage("");
      setRating(0);
    }
  };

  return (
    <SiteShell>
      <div className="container-luxe grid gap-8 sm:gap-12 py-12 sm:py-20 md:grid-cols-2">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 text-muted-foreground">{subheadline}</p>
          <div className="mt-6 flex flex-col gap-3">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {email}
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {phone}
              </a>
            )}
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Leave a rating (optional)</Label>
            <div
              className="mt-1 flex items-center gap-1"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="text-2xl leading-none"
                >
                  <span
                    className={
                      n <= (hover || rating)
                        ? "text-accent"
                        : "text-muted-foreground/40"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="ml-2 text-xs text-muted-foreground hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div>
            <Label>Name</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
    </SiteShell>
  );
}
