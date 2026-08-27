import { Link } from "@tanstack/react-router";
import { useSiteSettings, getBrandName } from "@/lib/site-settings";
import { Instagram, Facebook, Phone } from "lucide-react";

// TikTok icon (not in lucide)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z"/>
    </svg>
  );
}

export function SiteFooter() {
  const { data: settings } = useSiteSettings();
  const brand = getBrandName(settings);
  const about = (settings?.footer?.about as string) ?? "";
  const copyright =
    (settings?.footer?.copyright as string) ??
    `© ${new Date().getFullYear()} ${brand}`;
  const social = (settings?.social ?? {}) as Record<string, string>;
  const phone = (settings?.brand?.phone as string) ?? "";

  return (
    <footer className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="container-luxe grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-3xl">{brand}</div>
          {about && (
            <p className="mt-4 max-w-md text-sm text-primary-foreground/70">
              {about}
            </p>
          )}
          {/* Social media & phone */}
          <div className="mt-6 flex flex-col gap-4">
            {(social.instagram || social.facebook || social.tiktok) && (
              <div className="flex items-center gap-3">
                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 text-primary-foreground/70 transition-colors hover:border-primary-foreground/60 hover:text-primary-foreground"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {social.facebook && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 text-primary-foreground/70 transition-colors hover:border-primary-foreground/60 hover:text-primary-foreground"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {social.tiktok && (
                  <a
                    href={social.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/20 text-primary-foreground/70 transition-colors hover:border-primary-foreground/60 hover:text-primary-foreground"
                  >
                    <TikTokIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-2 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-primary-foreground/60">
            Shop
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/shop">All products</Link>
            </li>
            <li>
              <Link to="/wishlist">Wishlist</Link>
            </li>
            <li>
              <Link to="/cart">Cart</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-primary-foreground/60">
            Company
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy</Link>
            </li>
            <li>
              <Link to="/terms">Terms</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-luxe py-6 text-xs text-primary-foreground/60">
          <span>{copyright}</span>
        </div>
      </div>
    </footer>
  );
}
