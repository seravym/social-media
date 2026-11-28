"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../../home/home.css";


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

function PostDetailContent() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const hasFetchedId = useRef<string | null>(null);

  useEffect(() => {
    if (!postId || hasFetchedId.current === postId) return;
    hasFetchedId.current = postId;

    async function loadPostDetail() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Postingan tidak ditemukan");
        } else {
          setPost(data.post);
        }
      } catch {
        setErrorMsg("Gagal memuat detail postingan");
      } finally {
        setLoading(false);
      }
    }

    loadPostDetail();
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

  const handleToggleBookmark = async () => {
  if (!post) return;
  try {
    const res = await fetch(`/api/posts/${post.id}/bookmark`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Gagal memproses bookmark");
      return;
    }

    setPost((prev) =>
      prev ? { ...prev, isBookmarked: data.bookmarked } : null
    );
  } catch {
    alert("Terjadi kesalahan saat memproses bookmark");
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

  if (loading) return <div className="feed-layout"><p className="status-text">Memuat detail postingan...</p></div>;
  if (errorMsg || !post) {
    return (
      <div className="feed-layout">
        <p className="error-text">{errorMsg || "Postingan tidak ditemukan"}</p>
        <div style={{ padding: "16px" }}>
          <Link href="/home" className="feed-nav-link">← Kembali ke Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-layout">
      <nav className="feed-nav">
        <Link href="/home" className="feed-nav-link">← Kembali ke Home</Link>
      </nav>

      <article className="post-detail-card">
        <div className="post-meta">
          <span className="post-author-name">
            {post.author.name || post.author.username}
          </span>
          <span className="post-author-handle">@{post.author.username}</span>
        </div>
        <p className="post-content" style={{ fontSize: "1.1rem" }}>{post.content}</p>
        <p className="post-time" style={{ marginBottom: "12px" }}>
          {new Date(post.createdAt).toLocaleString("id-ID")} · 📊 {post.views}
        </p>
        <div className="post-actions">
          <span>💬 {post.repliesCount}</span>
          <button
            className={`action-btn ${post.isLiked ? "liked" : ""}`}
            onClick={handleToggleLike}
          >
            {post.isLiked ? "❤️" : "🤍"} {post.likesCount}
          </button>
          <button className="action-btn danger" onClick={handleDeletePost}>
            🗑️ Delete
          </button>
          <button
            className={`action-btn ${post.isBookmarked ? "liked" : ""}`}
            onClick={handleToggleBookmark}
          >
            {post.isBookmarked ? "🔖 Saved" : "🔖 Save"}
          </button>
        </div>
      </article>

      <form onSubmit={handleAddComment} className="composer-form">
        <textarea
          className="composer-textarea"
          placeholder="Post your reply"
          rows={3}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          disabled={submitting}
        />
        <div className="composer-actions">
          <button
            type="submit"
            className="btn-pink"
            disabled={submitting || !replyText.trim()}
          >
            {submitting ? "Mengirim..." : "Reply"}
          </button>
        </div>
      </form>

      <section>
        {post.comments.length === 0 ? (
          <p className="status-text">Belum ada balasan.</p>
        ) : (
          post.comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="post-meta">
                <span className="post-author-name">
                  {c.user.name || c.user.username}
                </span>
                <span className="post-author-handle">@{c.user.username}</span>
                <span className="post-time">
                  · {new Date(c.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
              <p className="post-content" style={{ marginBottom: 0 }}>{c.content}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
export default function PostDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="feed-layout">
          <p className="status-text">Memuat detail postingan...</p>
        </div>
      }
    >
      <PostDetailContent />
    </Suspense>
  );
}