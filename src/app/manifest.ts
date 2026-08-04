import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MEZANI — Gestion restaurant",
    short_name: "MEZANI",
    description: "Commandes, caisse et stocks pour les établissements de Kinshasa.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0F172A",
    lang: "fr-CD",
    orientation: "any",
    icons: [
      { src: "/mezani-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/mezani-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
