
"use client";

import { useEffect, useState } from "react";
import "./bookmarks.css";

type BookmarkPost = {
  id: string;
  content: string;
  views: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  repliesCount: number;
  likesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  bookmarkedAt: string;
};

const TEST_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID;

export default function BookmarksPage() {
  const [posts, setPosts] = useState<BookmarkPost[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadBookmarks() {
      if (!TEST_USER_ID) {
        if (!ignore) {
          setError("Test user ID belum dikonfigurasi.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `/api/bookmarks?userId=${encodeURIComponent(TEST_USER_ID)}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Gagal mengambil bookmarks");
        }

        if (!ignore) {
          setPosts(result.data);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mengambil bookmarks"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadBookmarks();

    return () => {
      ignore = true;
    };
  }, []);

  async function fetchBookmarks() {
    if (!TEST_USER_ID) {
      setError("Test user ID belum dikonfigurasi.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/bookmarks?userId=${encodeURIComponent(TEST_USER_ID)}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil bookmarks");
      }

      setPosts(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil bookmarks"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveBookmark(postId: string) {
    if (!TEST_USER_ID) return;

    try {
      setRemovingId(postId);

      const response = await fetch(
        `/api/bookmarks?postId=${encodeURIComponent(postId)}&userId=${encodeURIComponent(TEST_USER_ID)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus bookmark");
      }

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId)
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Gagal menghapus bookmark"
      );
    } finally {
      setRemovingId(null);
    }
  }

  const filteredPosts = posts.filter((post) => {
    const keyword = search.toLowerCase();

    return (
      post.content.toLowerCase().includes(keyword) ||
      post.author.name.toLowerCase().includes(keyword) ||
      post.author.username.toLowerCase().includes(keyword)
    );
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <button
          className="bookmarks-back-btn"
          onClick={() => window.history.back()}
          type="button"
        >
          ←
        </button>

        <div>
          <h1>Bookmarks</h1>
          <p>{posts.length} saved posts</p>
        </div>
      </div>

      <div className="bookmarks-search">
        <span>⌕</span>

        <input
          type="text"
          placeholder="Search bookmarks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
          >
            ×
          </button>
        )}
      </div>

      <div className="bookmarks-content">
        {loading ? (
          <div className="bookmarks-state">
            <div className="bookmarks-spinner"></div>
            <p>Loading bookmarks...</p>
          </div>
        ) : error ? (
          <div className="bookmarks-state">
            <p>{error}</p>
            <button type="button" onClick={fetchBookmarks}>
              Try again
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bookmarks-empty">
            <div className="bookmarks-empty-icon">🔖</div>

            <h2>
              {search ? "No results found" : "Save posts for later"}
            </h2>

            <p>
              {search
                ? "Try searching with another keyword."
                : "Bookmark posts to easily find them again."}
            </p>
          </div>
        ) : (
          <div className="bookmarks-list">
            {filteredPosts.map((post) => (
              <article className="bookmark-post" key={post.id}>
                <div className="bookmark-post-header">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      className="bookmark-avatar"
                    />
                  ) : (
                    <div className="bookmark-avatar-placeholder">
                      {post.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="bookmark-author">
                    <strong>{post.author.name}</strong>
                    <span>@{post.author.username}</span>
                  </div>

                  <span className="bookmark-date">
                    {formatDate(post.createdAt)}
                  </span>
                </div>

                <p className="bookmark-post-content">
                  {post.content}
                </p>

                <div className="bookmark-post-footer">
                  <span>💬 {post.repliesCount}</span>
                  <span>❤️ {post.likesCount}</span>
                  <span>👁 {post.views}</span>

                  <button
                    type="button"
                    className="bookmark-remove-btn"
                    onClick={() => handleRemoveBookmark(post.id)}
                    disabled={removingId === post.id}
                    title="Remove bookmark"
                  >
                    {removingId === post.id
                      ? "Removing..."
                      : "🔖 Saved"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
