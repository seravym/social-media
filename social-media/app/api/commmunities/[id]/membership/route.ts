import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

async function getMembershipData(
  request: Request,
  params: Context["params"]
) {
  const { id } = await params;
  const communityId = Number(id);

  if (!Number.isInteger(communityId) || communityId <= 0) {
    return {
      error: NextResponse.json(
        { message: "Invalid community ID" },
        { status: 400 }
      ),
    };
  }

  const body = await request.json().catch(() => ({}));
  const userId =
    body.userId || process.env.NEXT_PUBLIC_TEST_USER_ID;

  if (!userId) {
    return {
      error: NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      ),
    };
  }

  return { communityId, userId };
}

// JOIN COMMUNITY
export async function POST(
  request: Request,
  { params }: Context
) {
  try {
    const result = await getMembershipData(request, params);

    if ("error" in result) return result.error;

    const { communityId, userId } = result;

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json(
        { message: "Community not found" },
        { status: 404 }
      );
    }

    await prisma.communityMember.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      update: {},
      create: {
        userId,
        communityId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined community",
    });
  } catch (error) {
    console.error("JOIN COMMUNITY ERROR:", error);

    return NextResponse.json(
      { message: "Failed to join community" },
      { status: 500 }
    );
  }
}

// LEAVE COMMUNITY
export async function DELETE(
  request: Request,
  { params }: Context
) {
  try {
    const result = await getMembershipData(request, params);

    if ("error" in result) return result.error;

    const { communityId, userId } = result;

    await prisma.communityMember.deleteMany({
      where: {
        userId,
        communityId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully left community",
    });
  } catch (error) {
    console.error("LEAVE COMMUNITY ERROR:", error);

    return NextResponse.json(
      { message: "Failed to leave community" },
      { status: 500 }
    );
  }
}
