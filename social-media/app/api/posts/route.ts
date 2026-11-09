import { NextResponse } from "next/server";

// Data awal dari data.js milikmu
let postsStore = [
  {
    id: "post_alex_1",
    name: "Alexander",
    handle: "@alex_ander",
    time: "2h",
    message: "Tema pink ini keren banget! Semoga web-nya lancar!",
    replies: 12,
    likes: 48,
    views: "1.2K",
  },
  {
    id: "post_kat_1",
    name: "Kat",
    handle: "@trin_writes",
    time: "4h",
    message: "Still standing. Semoga sukses untuk UTS-nya!",
    replies: 3,
    likes: 15,
    views: "500",
  },
  {
    id: "post_garth_1",
    name: "Garth",
    handle: "@garth_dev",
    time: "6h",
    message: "Semoga frontend-nya sukses!",
    replies: 0,
    likes: 9,
    views: "150",
  },
  {
    id: "post_athena_1",
    name: "Athena",
    handle: "@athena_wisdom",
    time: "8h",
    message: "Pls pls pls bisaaa, jangan bikin stress. Menunggu UTS be like...",
    replies: 45,
    likes: 892,
    views: "10.5K",
  },
];

export async function GET() {
  return NextResponse.json({ posts: postsStore });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, name = "user", handle = "@user" } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const newPost = {
      id: "user_post_" + Date.now(),
      name,
      handle,
      time: "Now",
      message: message.trim(),
      replies: 0,
      likes: 0,
      views: "0",
    };

    postsStore = [newPost, ...postsStore];
    return NextResponse.json({ post: newPost, posts: postsStore }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membuat postingan" },
      { status: 500 }
    );
  }
}