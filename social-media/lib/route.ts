import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const noContent = () => new NextResponse(null, { status: 204 });

type MockUser = { id: string };

export function authed<C = unknown>(
  fn: (user: MockUser, req: Request, ctx: C) => Promise<Response>
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      const mockUser: MockUser = { id: "cmw9dzn1h00004okr31yn29tn" }; 
      
      return await fn(mockUser, req, ctx);
    } catch (error) {
      console.error(error);
      return json({ error: "Terjadi kesalahan di server" }, 500);
    }
  };
}