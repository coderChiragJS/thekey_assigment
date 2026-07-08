import type { PluralForms } from "@/domain/plural";
import type { enMessages } from "./en";

/** Spanish message catalog — keys mirror English so both stay in sync. */
export const esMessages: Record<keyof typeof enMessages, string> = {
  "app.title": "Foro de la Comunidad",
  "app.tagline": "Debates del curso y publicaciones guardadas",

  "nav.feed": "Publicaciones",
  "nav.saved": "Guardados",

  "toolbar.viewingAs": "Viendo como",
  "toolbar.language": "Idioma",
  "role.student": "estudiante",
  "role.moderator": "moderador",

  "feed.heading": "Publicaciones",
  "feed.course": "Curso",
  "feed.loading": "Cargando publicaciones…",
  "feed.empty": "Todavía no hay publicaciones en este curso.",
  "feed.error": "No se pudo cargar el feed.",
  "feed.forbidden": "No estás inscrito en este curso.",
  "feed.noCourses": "Todavía no estás inscrito en ningún curso.",

  "saved.heading": "Publicaciones guardadas",
  "saved.loading": "Cargando tus publicaciones guardadas…",
  "saved.error": "No se pudieron cargar tus publicaciones guardadas.",
  "saved.empty.title": "Aún no hay nada guardado",
  "saved.empty.body":
    "Guarda una publicación desde el feed y aparecerá aquí.",

  "post.by": "por {author}",
  "post.save": "Guardar",
  "post.saved": "Guardado",
  "post.saveAria": "Guardar esta publicación",
  "post.unsaveAria": "Quitar de guardados",

  "common.loadMore": "Cargar más",
  "common.retry": "Reintentar",
};

/** Spanish plural forms (same CLDR categories: one / other). */
export const esPlurals: Record<string, PluralForms> = {
  "post.savesCount": { one: "{count} guardado", other: "{count} guardados" },
};
