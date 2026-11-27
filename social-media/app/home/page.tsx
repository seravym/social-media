"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Author {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface Post {
  id: string;
  content: string;
  views: number;
  createdAt: string;
  author: Author;
  repliesCount: number;
  likesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<"foryou" | "following">("foryou");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postText, setPostText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        const res = await fetch(`/api/posts?tab=${currentTab}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setErrorMsg(data.error || "Gagal memuat postingan");
        } else {
          setPosts(data.posts || []);
        }
      } catch {
        if (!cancelled) setErrorMsg("Terjadi kesalahan jaringan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [currentTab]);

  const handleTabChange = (tab: "foryou" | "following") => {
    if (tab === currentTab) return;
    setLoading(true);
    setErrorMsg("");
    setCurrentTab(tab);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: postText.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal membuat postingan");
        return;
      }

      setPosts((prev) => [data.post, ...prev]);
      setPostText("");
    } catch {
      setErrorMsg("Gagal mengirim postingan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal memproses like");
        return;
      }

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            isLiked: data.liked,
            likesCount: data.liked ? post.likesCount + 1 : post.likesCount - 1,
          };
        })
      );
    } catch {
      alert("Terjadi kesalahan saat memproses like");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      <nav>
        <ul style={{ display: "flex", gap: "16px", listStyle: "none", padding: 0 }}>
          <li><Link href="/home">Home</Link></li>
          <li><Link href="/communities">Communities</Link></li>
          <li><Link href="/follow">Follow</Link></li>
          <li><Link href="/notifications">Notifications</Link></li>
          <li><Link href="/login">Login</Link></li>
          <li><Link href="/conversations">Chat</Link></li>
        </ul>
      </nav>

      <hr />

      <main>
        <h1>Home</h1>

        {/* Tab Navigasi */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button onClick={() => handleTabChange("foryou")}>
            For You {currentTab === "foryou" && "(Aktif)"}
          </button>
          <button onClick={() => handleTabChange("following")}>
            Following {currentTab === "following" && "(Aktif)"}
          </button>
        </div>

        <hr />

        {/* Form Postingan */}
        <form onSubmit={handleCreatePost} style={{ margin: "12px 0" }}>
          <h3>Buat Postingan Baru</h3>
          <textarea
            placeholder="What is happening?!"
            rows={3}
            style={{ width: "100%" }}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            disabled={submitting}
          />
          <br />
          <button type="submit" disabled={submitting || !postText.trim()}>
            {submitting ? "Mengirim..." : "Post"}
          </button>
        </form>

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <hr />

        {/* Feed Postingan */}
        <div>
          <h3>Linimasa (Feed)</h3>
          {loading ? (
            <p>Memuat postingan...</p>
          ) : posts.length === 0 ? (
            <p>
              {currentTab === "following"
                ? "Belum ada postingan dari akun yang kamu ikuti."
                : "Belum ada postingan."}
            </p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                onClick={() => router.push(`/post/${post.id}`)}
                style={{
                  border: "1px solid gray",
                  margin: "10px 0",
                  padding: "12px",
                  cursor: "pointer",
                }}
              >
                <p>
                  <strong>{post.author.name || post.author.username}</strong>{" "}
                  @{post.author.username} ·{" "}
                  {new Date(post.createdAt).toLocaleString("id-ID")}
                </p>
                <p>{post.content}</p>
                <div>
                  <span>💬 {post.repliesCount}</span> |{" "}
                  <button onClick={(e) => handleToggleLike(e, post.id)}>
                    {post.isLiked ? "❤️" : "🤍"} ({post.likesCount})
                  </button>{" "}
                  | <span>📊 {post.views}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}