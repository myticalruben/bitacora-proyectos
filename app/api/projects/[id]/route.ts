import { save, remove } from "../../../../lib/projects";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return save(request, (await context.params).id);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return remove(request, (await context.params).id);
}
