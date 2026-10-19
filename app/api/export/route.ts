import { env } from "cloudflare:workers";
import { isOwner } from "../../../lib/projects";
import { seeds } from "../../../lib/seeds";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isOwner(request))
    return Response.json({ error: "No autorizado." }, { status: 403 });

  try {
    if (!env.DB) throw Error("DB unavailable");

    const result = await env.DB.prepare("SELECT * FROM projects").all<
      Record<string, unknown>
    >();

    const merged = new Map<string, Record<string, unknown>>(
      seeds.map((p) => [p.id, { ...p, deleted: 0 }]),
    );

    for (const p of result.results) merged.set(String(p.id), p);

    const keys = [
      "id",
      "title",
      "summary",
      "category",
      "content",
      "published",
      "revision",
      "updated_at",
      "deleted",
    ];

    const quote = (v: unknown) =>
      v == null
        ? "NULL"
        : typeof v === "number"
          ? String(v)
          : "'" + String(v).replace(/'/g, "''") + "'";

    const sql =
      "-- Copia de Bitácora de proyectos · " +
      new Date().toISOString() +
      "\n-- Restaurar sobre una base con las migraciones aplicadas.\nBEGIN TRANSACTION;\n" +
      [...merged.values()]
        .map(
          (p) =>
            "INSERT OR REPLACE INTO projects (" +
            keys.join(",") +
            ") VALUES (" +
            keys.map((k) => quote(p[k])).join(",") +
            ");",
        )
        .join("\n") +
      "\nCOMMIT;\n";

    return new Response(sql, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bitacora-backup.sql"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "No se pudo exportar la base de datos." },
      { status: 503 },
    );
  }
}
