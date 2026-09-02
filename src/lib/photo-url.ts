const IMAGE_EXT = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?|#|$)/i;

const IMAGE_HOSTS = [
  "abs.twimg.com",
  "brandbadge.clearbit.com",
  "cdninstagram.com",
  "clearbit.com",
  "cloudfront.net",
  "cloudinary.com",
  "fbcdn.net",
  "ggpht.com",
  "google.com",
  "googleusercontent.com",
  "gravatar.com",
  "gstatic.com",
  "githubusercontent.com",
  "img.logo.dev",
  "imgix.net",
  "logo.clearbit.com",
  "logo.dev",
  "media.licdn.com",
  "pbs.twimg.com",
  "twimg.com",
  "wp.com",
];

const PROFILE_HOSTS = [
  "facebook.com",
  "github.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
];

function hostMatches(host: string, allowed: string[]) {
  return allowed.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

function parseUrl(raw: string) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/** Return a usable image URL, or "" if this looks like a page / empty / not an image. */
export function usablePhotoUrl(raw: string | undefined | null): string {
  const url = (raw ?? "").trim();
  if (!url || !/^https?:\/\//i.test(url)) return "";

  const parsed = parseUrl(url);
  if (!parsed) return "";

  const host = parsed.hostname.toLowerCase();
  if (hostMatches(host, PROFILE_HOSTS)) return "";
  if (hostMatches(host, ["logo.dev"]) && !parsed.searchParams.get("token")) return "";
  if (IMAGE_EXT.test(parsed.pathname)) return url;
  if (hostMatches(host, IMAGE_HOSTS)) return url;

  return "";
}

export function companyLogoUrl(logoUrl: string | undefined, domain: string | undefined) {
  const usable = usablePhotoUrl(logoUrl);
  if (usable) return usable;
  const host = (domain ?? "").trim().replace(/^https?:\/\//i, "").split("/")[0];
  if (!host) return "";
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
}
