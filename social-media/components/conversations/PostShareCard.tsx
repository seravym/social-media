"use client";

import Image from "next/image";
import Link from "next/link";

export interface SharedPostData {
  id: string;
  title: string;
  author: string;
  thumbnail?: string | null;
}

interface PostShareCardProps {
  post: SharedPostData;
  vanishMode?: boolean;
}

export function PostShareCard({ post, vanishMode = false }: PostShareCardProps) {
  return (
    <Link
      href={`/articles/${post.id}`}
      className={`mt-1.5 flex w-60 items-center gap-2.5 overflow-hidden rounded-xl border p-2 transition ${
        vanishMode
          ? "border-slate-700 bg-slate-800/90 hover:border-pink-500/60"
          : "border-slate-200 bg-white hover:border-pink-300"
      }`}
    >
      {post.thumbnail ? (
        <Image
          src={post.thumbnail}
          alt={post.title}
          width={48}
          height={48}
          unoptimized
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-lg text-pink-600">
          📰
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-semibold ${
            vanishMode ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {post.title}
        </p>
        <p
          className={`truncate text-[11px] ${
            vanishMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          oleh {post.author}
        </p>
      </div>
    </Link>
  );
}
