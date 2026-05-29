const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', '(public)', 'articles', '[slug]', 'page.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace in generateMetadata
const target1 = `  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();`;

const replacement1 = `  console.log("[generateMetadata] raw slug:", slug);
  const decodedSlug = decodeURIComponent(slug);
  console.log("[generateMetadata] decoded slug:", decodedSlug);
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, categories(name)")
    .or(\`slug.eq.\${slug},slug.eq.\${decodedSlug}\`)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();`;

// Replace in ArticlePage
const target2 = `  // Fetch the article
  const { data: article, error } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !article) {
    notFound();
  }`;

const replacement2 = `  // Fetch the article
  console.log("[ArticlePage] raw slug:", slug);
  const decodedSlug = decodeURIComponent(slug);
  console.log("[ArticlePage] decoded slug:", decodedSlug);

  const { data: article, error } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .or(\`slug.eq.\${slug},slug.eq.\${decodedSlug}\`)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (error || !article) {
    console.error("[ArticlePage] Fetch error:", error, "Article:", article);
    notFound();
  }`;

if (content.includes(target1) && content.includes(target2)) {
  content = content.replace(target1, replacement1).replace(target2, replacement2);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully patched page.js");
} else {
  console.error("Failed to find replacement targets in page.js");
}



