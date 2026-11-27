"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import "../communities.css";
import "./home.css";

type Author = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
};

type Post = {
  id: string;
  content: string;
  views: number;
  createdAt: string;
  author: Author;
  community: {
    id: number;
    name: string;
    image: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
};

const TEST_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID;

export default function CommunitiesHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [likingPosts, setLikingPosts] = useState<string[]>([]);
  const [bookmarkingPosts, setBookmarkingPosts] = useState<string[]>([]);

  const [openComments, setOpenComments] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentsLoaded, setCommentsLoaded] = useState<string[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<string[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingComments, setSendingComments] = useState<string[]>([]);

  // CREATE COMMUNITY
  const [showModal, setShowModal] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchPosts() {
    try {
      const [postsResponse, bookmarksResponse] = await Promise.all([
        fetch("/api/commmunities/home"),
        TEST_USER_ID
          ? fetch(`/api/bookmarks?userId=${encodeURIComponent(TEST_USER_ID)}`)
          : Promise.resolve(null),
      ]);

      const postsResult = await postsResponse.json();

      if (!postsResponse.ok || !postsResult.success) {
        throw new Error(
          postsResult.error ||
            postsResult.message ||
            "Gagal mengambil postingan"
        );
      }

      let bookmarkedIds: string[] = [];

      if (bookmarksResponse) {
        const bookmarksResult = await bookmarksResponse.json();

        if (bookmarksResponse.ok && bookmarksResult.success) {
          bookmarkedIds = bookmarksResult.data.map(
            (bookmark: { id: string }) => bookmark.id
          );
        }
      }

      const formattedPosts: Post[] = postsResult.data.map(
        (post: Post) => ({
          ...post,
          isBookmarked: bookmarkedIds.includes(post.id),
        })
      );

      setPosts(formattedPosts);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }

  // FETCH POSTS
  useEffect(() => {
    Promise.resolve().then(() => {
      void fetchPosts();
    });
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // LIKE POST
  async function handleLike(postId: string) {
    if (!TEST_USER_ID || likingPosts.includes(postId)) return;

    setLikingPosts((current) => [...current, postId]);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: TEST_USER_ID }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Gagal Like post");
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post.id !== postId) return post;

          const liked = result.liked;

          return {
            ...post,
            isLiked: liked,
            _count: {
              ...post._count,
              likes: Math.max(
                0,
                post._count.likes + (liked ? 1 : -1)
              ),
            },
          };
        })
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal Like postingan"
      );
    } finally {
      setLikingPosts((current) =>
        current.filter((id) => id !== postId)
      );
    }
  }

  // BOOKMARK POST
  async function handleBookmark(postId: string) {
    if (!TEST_USER_ID || bookmarkingPosts.includes(postId)) return;

    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    setBookmarkingPosts((current) => [...current, postId]);

    try {
      const response = post.isBookmarked
        ? await fetch(
            `/api/bookmarks?postId=${encodeURIComponent(postId)}&userId=${encodeURIComponent(TEST_USER_ID)}`,
            { method: "DELETE" }
          )
        : await fetch("/api/bookmarks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              postId,
              userId: TEST_USER_ID,
            }),
          });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengubah status bookmark"
        );
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === postId
            ? { ...item, isBookmarked: !item.isBookmarked }
            : item
        )
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal menyimpan postingan"
      );
    } finally {
      setBookmarkingPosts((current) =>
        current.filter((id) => id !== postId)
      );
    }
  }

  // TOGGLE COMMENTS
  async function handleToggleComments(postId: string) {
    const isOpen = openComments.includes(postId);

    if (isOpen) {
      setOpenComments((current) =>
        current.filter((id) => id !== postId)
      );
      return;
    }

    setOpenComments((current) => [...current, postId]);

    if (commentsLoaded.includes(postId)) return;

    setCommentsLoading((current) => [...current, postId]);

    try {
      const response = await fetch(
        `/api/posts/${postId}/comments`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengambil komentar");
      }

      setComments((current) => ({
        ...current,
        [postId]: result.comments || [],
      }));

      setCommentsLoaded((current) => [...current, postId]);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal mengambil komentar"
      );

      setOpenComments((current) =>
        current.filter((id) => id !== postId)
      );
    } finally {
      setCommentsLoading((current) =>
        current.filter((id) => id !== postId)
      );
    }
  }

  // SEND COMMENT
  async function handleSendComment(
    event: FormEvent<HTMLFormElement>,
    postId: string
  ) {
    event.preventDefault();

    if (!TEST_USER_ID || sendingComments.includes(postId)) return;

    const content = (commentInputs[postId] || "").trim();
    if (!content) return;

    setSendingComments((current) => [...current, postId]);

    try {
      const response = await fetch(
        `/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            userId: TEST_USER_ID,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.comment) {
        throw new Error(result.error || "Gagal mengirim komentar");
      }

      setComments((current) => ({
        ...current,
        [postId]: [result.comment, ...(current[postId] || [])],
      }));

      setCommentsLoaded((current) =>
        current.includes(postId) ? current : [...current, postId]
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                _count: {
                  ...post._count,
                  comments: post._count.comments + 1,
                },
              }
            : post
        )
      );

      setCommentInputs((current) => ({
        ...current,
        [postId]: "",
      }));
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal mengirim komentar"
      );
    } finally {
      setSendingComments((current) =>
        current.filter((id) => id !== postId)
      );
    }
  }

  // CLOSE CREATE COMMUNITY MODAL
  function closeModal() {
    if (submitting) return;

    setShowModal(false);
    setFormError("");
  }

  // CREATE COMMUNITY
  async function handleCreateCommunity(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = communityName.trim();

    if (!trimmedName) {
      setFormError("Community name cannot be empty.");
      return;
    }

    if (trimmedName.length < 3) {
      setFormError("Community name must be at least 3 characters.");
      return;
    }

    if (!TEST_USER_ID) {
      setFormError("Test user ID belum dikonfigurasi.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const response = await fetch("/api/commmunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim(),
          image: image.trim(),
          creatorId: TEST_USER_ID,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to create community"
        );
      }

      setShowModal(false);
      setCommunityName("");
      setDescription("");
      setImage("");
      setFormError("");

      alert("Community created successfully!");
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create community"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="communities-home">
      <div className="communities-home-container">

        {/* HEADER */}
        <div className="communities-home-header">
          <div>
            <p className="communities-home-subtitle">
              YOUR COMMUNITY SPACE
            </p>

            <h1>Communities</h1>

            <p className="communities-home-description">
              Stay connected with the communities you joined.
            </p>
          </div>

          <button
            type="button"
            className="create-community-btn"
            onClick={() => setShowModal(true)}
          >
            + Create Community
          </button>
        </div>

        {/* TABS */}
        <div className="community-page-tabs">
          <Link
            href="/communities/home"
            className="community-page-tab active"
          >
            Home
          </Link>

          <Link
            href="/communities"
            className="community-page-tab"
          >
            Explore
          </Link>
        </div>

        {/* LATEST POSTS */}
        <div className="communities-home-section">
          <h2>Latest Posts</h2>
          <p>Posts from communities you joined.</p>
        </div>

        {loading ? (
          <div className="communities-home-message">
            Loading posts...
          </div>
        ) : error ? (
          <div className="communities-home-message error">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="communities-home-empty">
            <div className="empty-icon">👥</div>

            <h2>Your communities are waiting!</h2>

            <p>
              You havent joined any communities yet, or there are
              no posts in your communities.
            </p>

            <Link href="/communities">
              Explore Communities
            </Link>
          </div>
        ) : (
          <div className="communities-home-posts">
            {posts.map((post) => (
              <article
                className="communities-home-post"
                key={post.id}
              >
                <div className="community-post-top">
                  <Link
                    href={`/communities/${post.community.id}`}
                    className="community-post-name"
                  >
                    {post.community.name}
                  </Link>

                  <span>{formatDate(post.createdAt)}</span>
                </div>

                {/* AUTHOR */}
                <div className="community-post-author">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt="Profile"
                      className="community-post-avatar"
                    />
                  ) : (
                    <div className="community-post-avatar placeholder">
                      {(post.author.name || post.author.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="community-post-author-info">
                    <strong>
                      {post.author.name || post.author.username}
                    </strong>

                    <span>@{post.author.username}</span>
                  </div>
                </div>

                {/* CONTENT */}
                <p className="community-post-content">
                  {post.content}
                </p>

                {/* ACTIONS */}
                <div className="community-post-actions">
                  <button
                    type="button"
                    className="community-action-btn"
                    onClick={() => handleToggleComments(post.id)}
                  >
                    💬 {post._count.comments}
                  </button>

                  <button
                    type="button"
                    className={`community-action-btn ${post.isLiked ? "liked" : ""}`}
                    onClick={() => handleLike(post.id)}
                    disabled={likingPosts.includes(post.id)}
                  >
                    {post.isLiked ? "❤️" : "♡"} {post._count.likes}
                  </button>

                  <span className="community-action-views">
                    👁 {post.views}
                  </span>

                  <button
                    type="button"
                    className={`community-action-btn community-save-btn ${post.isBookmarked ? "saved" : ""}`}
                    onClick={() => handleBookmark(post.id)}
                    disabled={bookmarkingPosts.includes(post.id)}
                  >
                    {post.isBookmarked ? "🔖 Saved" : "🔖 Save"}
                  </button>
                </div>

                {/* COMMENTS */}
                {openComments.includes(post.id) && (
                  <div className="community-comments">
                    <h3>Comments</h3>

                    {commentsLoading.includes(post.id) ? (
                      <p className="community-comments-empty">
                        Loading comments...
                      </p>
                    ) : (comments[post.id] || []).length === 0 ? (
                      <p className="community-comments-empty">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      <div className="community-comments-list">
                        {(comments[post.id] || []).map((comment) => (
                          <div
                            className="community-comment"
                            key={comment.id}
                          >
                            {comment.user.avatarUrl ? (
                              <img
                                src={comment.user.avatarUrl}
                                alt="Profile"
                                className="community-comment-avatar"
                              />
                            ) : (
                              <div className="community-comment-avatar placeholder">
                                {(comment.user.name ||
                                  comment.user.username)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="community-comment-body">
                              <div className="community-comment-author">
                                <strong>
                                  {comment.user.name ||
                                    comment.user.username}
                                </strong>

                                <span>
                                  @{comment.user.username}
                                </span>
                              </div>

                              <p>{comment.content}</p>

                              <small>
                                {formatDate(comment.createdAt)}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <form
                      className="community-comment-form"
                      onSubmit={(event) =>
                        handleSendComment(event, post.id)
                      }
                    >
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(event) =>
                          setCommentInputs((current) => ({
                            ...current,
                            [post.id]: event.target.value,
                          }))
                        }
                      />

                      <button
                        type="submit"
                        disabled={
                          !(commentInputs[post.id] || "").trim() ||
                          sendingComments.includes(post.id)
                        }
                      >
                        {sendingComments.includes(post.id)
                          ? "Sending..."
                          : "Send"}
                      </button>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {/* CREATE COMMUNITY MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="create-community-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Create Community</h2>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCommunity}>
              <div className="form-group">
                <label htmlFor="community-name">
                  Community Name
                </label>

                <input
                  id="community-name"
                  type="text"
                  placeholder="Enter community name"
                  value={communityName}
                  onChange={(event) =>
                    setCommunityName(event.target.value)
                  }
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="community-description">
                  Description
                </label>

                <textarea
                  id="community-description"
                  placeholder="Describe your community..."
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  maxLength={300}
                />
              </div>

              <div className="form-group">
                <label htmlFor="community-image">
                  Image URL
                </label>

                <input
                  id="community-image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(event) =>
                    setImage(event.target.value)
                  }
                />
              </div>

              {formError && (
                <p className="form-error">{formError}</p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
