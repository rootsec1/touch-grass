// Public identity is independent of the API host and preview deployment URL.
export const SITE_URL = "https://touch-grass.abhishekmurthy.com";
export const SOCIAL_IMAGE = `${SITE_URL}/images/touch-grass-social.jpg`;
export function publicPageHead(
  path: string,
  title: string,
  description: string,
) {
  const url = new URL(path, SITE_URL).href;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Touch Grass" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: url },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: SOCIAL_IMAGE },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content:
          "An illustrated meadow beneath an oak tree. Touch Grass — Wonder is right outside.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: SOCIAL_IMAGE },
      {
        name: "twitter:image:alt",
        content: "Touch Grass, an illustrated pocket nature journal.",
      },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
