import "@/app/globals.css";
import ContentProtection from "@/components/ContentProtection";
import { createServerClient } from "@supabase/ssr";

// Fetch site config for dynamic metadata
async function getSiteConfig() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() { return []; },
          setAll() { },
        },
      }
    );
    const { data } = await supabase
      .from("site_config")
      .select("meta_title, meta_description, meta_keywords, favicon_url, site_name")
      .eq("id", 1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata() {
  const config = await getSiteConfig();
  return {
    title: config?.meta_title || "Popular Homeo Center | Homeopathy",
    description: config?.meta_description || "Popular Homeo Center - হোমিওপ্যাথি চিকিৎসা সেবা। আপনার সঠিক সিদ্ধান্তই আপনাকে রাখতে পারে সুস্থ এবং সুরক্ষিত।",
    keywords: config?.meta_keywords || "",
    ...(config?.favicon_url ? {
      icons: {
        icon: config.favicon_url,
        shortcut: config.favicon_url,
      },
    } : {}),
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        <ContentProtection />
        {children}
      </body>
    </html>
  );
}
