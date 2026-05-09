import "@/app/globals.css";
import ContentProtection from "@/components/ContentProtection";

export const metadata = {
  title: "Good Health Homeo Care | Homeopathy",
  description: "Good Health Homeo Care - হোমিওপ্যাথি চিকিৎসা সেবা। আপনার সঠিক সিদ্ধান্তই আপনাকে রাখতে পারে সুস্থ এবং সুরক্ষিত।",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
        />
      </head>
      <body>
        <ContentProtection />
        {children}
      </body>
    </html>
  );
}
