"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Author {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
}

interface PostDetail {
  id: string;
  content: string;
  views: number;
  createdAt: string;
  author: Author;
  repliesCount: number;
  likesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  comments: Comment[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    async function loadPostDetail() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setErrorMsg(data.error || "Postingan tidak ditemukan");
        } else {
          setPost(data.post);
        }
      } catch {
        if (!cancelled) setErrorMsg("Gagal memuat detail postingan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPostDetail();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal memproses like");
        return;
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: data.liked,
              likesCount: data.liked ? prev.likesCount + 1 : prev.likesCount - 1,
            }
          : null
      );
    } catch {
      alert("Terjadi kesalahan saat memproses like");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !post) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengirim komentar");
        return;
      }

      setPost((prev) =>
        prev
          ? {
              ...prev,
              repliesCount: prev.repliesCount + 1,
              comments: [data.comment, ...prev.comments],
            }
          : null
      );
      setReplyText("");
    } catch {
      alert("Gagal mengirim komentar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !confirm("Yakin ingin menghapus postingan ini?")) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal menghapus postingan");
        return;
      }
      router.push("/home");
    } catch {
      alert("Terjadi kesalahan saat menghapus postingan");
    }
  };

  if (loading) return <p style={{ padding: "16px" }}>Memuat detail postingan...</p>;
  if (errorMsg || !post) {
    return (
      <div style={{ padding: "16px" }}>
        <p style={{ color: "red" }}>{errorMsg || "Postingan tidak ditemukan"}</p>
        <Link href="/home">← Kembali ke Home</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <Link href="/home">← Kembali ke Home</Link>

      <hr />

      {/* Konten Post */}
      <article style={{ border: "1px solid gray", padding: "16px", margin: "12px 0" }}>
        <p>
          <strong>{post.author.name || post.author.username}</strong> @
          {post.author.username}
        </p>
        <p style={{ fontSize: "1.1rem" }}>{post.content}</p>
        <p style={{ fontSize: "0.85rem", color: "gray" }}>
          {new Date(post.createdAt).toLocaleString("id-ID")} · 📊 {post.views} Views
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <span>💬 {post.repliesCount} Balasan</span>
          <button onClick={handleToggleLike}>
            {post.isLiked ? "❤️" : "🤍"} ({post.likesCount})
          </button>
          <button onClick={handleDeletePost} style={{ color: "red" }}>
            🗑️ Hapus
          </button>
        </div>
      </article>

      {/* Form Komentar */}
      <form onSubmit={handleAddComment} style={{ margin: "16px 0" }}>
        <h3>Tulis Reply</h3>
        <textarea
          placeholder="Post your reply"
          rows={3}
          style={{ width: "100%" }}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          disabled={submitting}
        />
        <br />
        <button type="submit" disabled={submitting || !replyText.trim()}>
          {submitting ? "Mengirim..." : "Reply"}
        </button>
      </form>

      <hr />

      {/* Daftar Komentar */}
      <section>
        <h3>Comments ({post.comments.length})</h3>
        {post.comments.length === 0 ? (
          <p>Belum ada komentar.</p>
        ) : (
          post.comments.map((c) => (
            <div
              key={c.id}
              style={{ borderBottom: "1px solid #ccc", padding: "10px 0" }}
            >
              <p>
                <strong>{c.user.name || c.user.username}</strong> @{c.user.username} ·{" "}
                {new Date(c.createdAt).toLocaleString("id-ID")}
              </p>
              <p>{c.content}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}