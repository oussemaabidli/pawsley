import { Link } from "@tanstack/react-router";
import { useSiteSettings, getBrandName } from "@/lib/site-settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  const { data: settings } = useSiteSettings();
  const brand = getBrandName(settings);
  const about = (settings?.footer?.about as string) ?? "";
  const copyright = (settings?.footer?.copyright as string) ?? `© ${new Date().getFullYear()} ${brand}`;
  const social = (settings?.social ?? {}) as Record<string, string>;

  return (
    <footer className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="container-luxe grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-3xl">{brand}</div>
          {about && <p className="mt-4 max-w-md text-sm text-primary-foreground/70">{about}</p>}
          <form className="mt-6 flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input type="email" placeholder="Email address" className="bg-transparent" />
            <Button type="submit" variant="secondary">Subscribe</Button>
          </form>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-primary-foreground/60">Shop</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/shop">All products</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-primary-foreground/60">Company</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-2 py-6 text-xs text-primary-foreground/60 md:flex-row">
          <span>{copyright}</span>
          <div className="flex gap-4">
            {social.instagram && <a href={social.instagram}>Instagram</a>}
            {social.facebook && <a href={social.facebook}>Facebook</a>}
            {social.tiktok && <a href={social.tiktok}>TikTok</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}