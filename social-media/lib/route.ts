import { NextResponse } from "next/server";
import { getSessionUserId } from "./session";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const noContent = () => new NextResponse(null, { status: 204 });

type AuthedUser = { id: string };

const LEGACY_DEV_USER_ID = "cmw9dzn1h00004okr31yn29tn";

export function authed<C = unknown>(
  fn: (user: AuthedUser, req: Request, ctx: C) => Promise<Response>
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      const sessionId = await getSessionUserId();
      const devId =
        process.env.NODE_ENV !== "production"
          ? process.env.DEV_MOCK_USER_ID ?? LEGACY_DEV_USER_ID
          : undefined;
      const id = sessionId ?? devId;

      if (!id) {
        return json({ error: "Unauthorized" }, 401);
      }

      return await fn({ id }, req, ctx);
    } catch (error) {
      console.error(error);
      return json({ error: "Terjadi kesalahan di server" }, 500);
    }
  };
}
