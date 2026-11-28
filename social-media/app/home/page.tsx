"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Heart, BarChart2, Bookmark } from "lucide-react";
import "./home.css";

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

  const handleToggleBookmark = async (e: React.MouseEvent, postId: string) => {
  e.stopPropagation();
  try {
    const res = await fetch(`/api/posts/${postId}/bookmark`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Gagal memproses bookmark");
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isBookmarked: data.bookmarked } : post
      )
    );
  } catch {
    alert("Terjadi kesalahan saat memproses bookmark");
  }
};

  return (
    <div className="feed-layout">

      <main>
        <div className="feed-header">
          <h1 className="feed-title">Home</h1>
        </div>

        <div className="feed-tabs">
          <button
            className={`feed-tab-btn ${currentTab === "foryou" ? "active" : ""}`}
            onClick={() => handleTabChange("foryou")}
          >
            For You
          </button>
          <button
            className={`feed-tab-btn ${currentTab === "following" ? "active" : ""}`}
            onClick={() => handleTabChange("following")}
          >
            Following
          </button>
        </div>

        <form onSubmit={handleCreatePost} className="composer-form">
          <textarea
            className="composer-textarea"
            placeholder="What is happening?!"
            rows={3}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            disabled={submitting}
          />
          <div className="composer-actions">
            <button
              type="submit"
              className="btn-pink"
              disabled={submitting || !postText.trim()}
            >
              {submitting ? "Mengirim..." : "Post"}
            </button>
          </div>
        </form>

        {errorMsg && <p className="error-text">{errorMsg}</p>}

        <div>
          {loading ? (
            <p className="status-text">Memuat postingan...</p>
          ) : posts.length === 0 ? (
            <p className="status-text">
              {currentTab === "following"
                ? "Belum ada postingan dari akun yang kamu ikuti."
                : "Belum ada postingan."}
            </p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="post-card"
                onClick={() => router.push(`/post/${post.id}`)}
              >
                <div className="post-meta">
                  <span className="post-author-name">
                    {post.author.name || post.author.username}
                  </span>
                  <span className="post-author-handle">@{post.author.username}</span>
                  <span className="post-time">
                    · {new Date(post.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-actions">
                  <span className="action-stat">
                    <MessageCircle size={16} strokeWidth={1.9} /> {post.repliesCount}
                  </span>
                  <button
                    className={`action-btn ${post.isLiked ? "liked" : ""}`}
                    onClick={(e) => handleToggleLike(e, post.id)}
                  >
                    <Heart
                      size={16}
                      strokeWidth={1.9}
                      fill={post.isLiked ? "currentColor" : "none"}
                    />{" "}
                    {post.likesCount}
                  </button>
                  <span className="action-stat">
                    <BarChart2 size={16} strokeWidth={1.9} /> {post.views}
                  </span>
                  <button
                    className={`action-btn ${post.isBookmarked ? "liked" : ""}`}
                    onClick={(e) => handleToggleBookmark(e, post.id)}
                  >
                    <Bookmark
                      size={16}
                      strokeWidth={1.9}
                      fill={post.isBookmarked ? "currentColor" : "none"}
                    />
                    {post.isBookmarked ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}