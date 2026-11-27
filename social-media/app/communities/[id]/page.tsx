
"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "./detail.css";

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
  isLiked: boolean;
  isBookmarked: boolean;
  _count: {
    comments: number;
    likes: number;
  };
};

type Community = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  creatorId: string;
  createdAt: string;
  creator: Author;
  members: {
    userId: string;
  }[];
  posts: Post[];
  _count: {
    members: number;
    posts: number;
  };
};

const TEST_USER_ID = process.env.NEXT_PUBLIC_TEST_USER_ID;

function CommunityDetailContent() {
  const params = useParams<{ id: string }>();
  const communityId = params.id;

  const [community, setCommunity] = useState<Community | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [posting, setPosting] = useState(false);

  const [likingPosts, setLikingPosts] = useState<string[]>([]);
  const [bookmarkingPosts, setBookmarkingPosts] = useState<string[]>([]);

  const [postContent, setPostContent] = useState("");
  const [error, setError] = useState("");

  // COMMENTS
  const [openComments, setOpenComments] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentsLoaded, setCommentsLoaded] = useState<string[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<string[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [sendingComments, setSendingComments] = useState<string[]>([]);

  // LOAD COMMUNITY AND BOOKMARKS
  async function loadCommunity() {
    const [communityResponse, bookmarksResponse] = await Promise.all([
      fetch(`/api/commmunities/${communityId}`),
      TEST_USER_ID
        ? fetch(`/api/bookmarks?userId=${encodeURIComponent(TEST_USER_ID)}`)
        : Promise.resolve(null),
    ]);

    const communityResult = await communityResponse.json();

    if (!communityResponse.ok || !communityResult.success) {
      throw new Error(
        communityResult.message ||
          communityResult.error ||
          "Failed to fetch community."
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

    const formattedCommunity: Community = {
      ...communityResult.data,
      posts: communityResult.data.posts.map((post: Post) => ({
        ...post,
        isBookmarked: bookmarkedIds.includes(post.id),
      })),
    };

    setCommunity(formattedCommunity);
  }

  // INITIAL DATA
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [communityResponse, membershipResponse, bookmarksResponse] =
          await Promise.all([
            fetch(`/api/commmunities/${communityId}`),
            fetch(`/api/commmunities/${communityId}/membership`),
            TEST_USER_ID
              ? fetch(`/api/bookmarks?userId=${encodeURIComponent(TEST_USER_ID)}`)
              : Promise.resolve(null),
          ]);

        const communityResult = await communityResponse.json();
        const membershipResult = await membershipResponse.json();

        if (!communityResponse.ok || !communityResult.success) {
          throw new Error(
            communityResult.message ||
              communityResult.error ||
              `Failed to fetch community (${communityResponse.status})`
          );
        }

        if (!membershipResponse.ok || !membershipResult.success) {
          throw new Error(
            membershipResult.message ||
              membershipResult.error ||
              `Failed to check membership (${membershipResponse.status})`
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

        if (!ignore) {
          const formattedCommunity: Community = {
            ...communityResult.data,
            posts: communityResult.data.posts.map((post: Post) => ({
              ...post,
              isBookmarked: bookmarkedIds.includes(post.id),
            })),
          };

          setCommunity(formattedCommunity);
          setIsJoined(membershipResult.isMember);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [communityId]);

  // JOIN / LEAVE COMMUNITY
  async function handleMembership() {
    if (!community) return;

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/commmunities/${community.id}/membership`,
        {
          method: isJoined ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: TEST_USER_ID,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "Failed to update membership."
        );
      }

      setIsJoined(!isJoined);

      setCommunity((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          _count: {
            ...previous._count,
            members: Math.max(
              0,
              previous._count.members + (isJoined ? -1 : 1)
            ),
          },
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setProcessing(false);
    }
  }

  // CREATE POST
  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!community || !isJoined || !postContent.trim()) return;

    setPosting(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: postContent.trim(),
          communityId: community.id,
          userId: TEST_USER_ID,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "Failed to create post."
        );
      }

      setPostContent("");
      await loadCommunity();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setPosting(false);
    }
  }

  // LIKE / UNLIKE POST
  async function handleLike(postId: string) {
    if (!TEST_USER_ID || likingPosts.includes(postId)) return;

    setLikingPosts((previous) => [...previous, postId]);
    setError("");

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to update like."
        );
      }

      setCommunity((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          posts: previous.posts.map((post) => {
            if (post.id !== postId) return post;

            return {
              ...post,
              isLiked: result.liked,
              _count: {
                ...post._count,
                likes: Math.max(
                  0,
                  post._count.likes + (result.liked ? 1 : -1)
                ),
              },
            };
          }),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLikingPosts((previous) =>
        previous.filter((id) => id !== postId)
      );
    }
  }

  // SAVE / REMOVE BOOKMARK
  async function handleBookmark(postId: string) {
    if (!TEST_USER_ID || bookmarkingPosts.includes(postId)) return;

    const post = community?.posts.find((item) => item.id === postId);
    if (!post) return;

    setBookmarkingPosts((previous) => [...previous, postId]);

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
          result.message || "Failed to update bookmark."
        );
      }

      setCommunity((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          posts: previous.posts.map((item) =>
            item.id === postId
              ? { ...item, isBookmarked: !item.isBookmarked }
              : item
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save post."
      );
    } finally {
      setBookmarkingPosts((previous) =>
        previous.filter((id) => id !== postId)
      );
    }
  }

  // OPEN / CLOSE COMMENTS
  async function handleToggleComments(postId: string) {
    const isOpen = openComments.includes(postId);

    if (isOpen) {
      setOpenComments((previous) =>
        previous.filter((id) => id !== postId)
      );
      return;
    }

    setOpenComments((previous) => [...previous, postId]);

    if (
      commentsLoaded.includes(postId) ||
      commentsLoading.includes(postId)
    ) {
      return;
    }

    setCommentsLoading((previous) => [...previous, postId]);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch comments.");
      }

      setComments((previous) => ({
        ...previous,
        [postId]: result.comments || [],
      }));

      setCommentsLoaded((previous) => [...previous, postId]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch comments."
      );

      setOpenComments((previous) =>
        previous.filter((id) => id !== postId)
      );
    } finally {
      setCommentsLoading((previous) =>
        previous.filter((id) => id !== postId)
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

    setSendingComments((previous) => [...previous, postId]);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          userId: TEST_USER_ID,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.comment) {
        throw new Error(result.error || "Failed to send comment.");
      }

      setComments((previous) => ({
        ...previous,
        [postId]: [
          result.comment,
          ...(previous[postId] || []),
        ],
      }));

      setCommentsLoaded((previous) =>
        previous.includes(postId) ? previous : [...previous, postId]
      );

      setCommunity((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          posts: previous.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  _count: {
                    ...post._count,
                    comments: post._count.comments + 1,
                  },
                }
              : post
          ),
        };
      });

      setCommentInputs((previous) => ({
        ...previous,
        [postId]: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send comment."
      );
    } finally {
      setSendingComments((previous) =>
        previous.filter((id) => id !== postId)
      );
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <div className="community-detail-page">
        <p className="detail-loading">Loading community...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="community-detail-page">
        <Link href="/communities" className="detail-back">
          ← Back to Communities
        </Link>

        <div className="detail-error">
          {error || "Community not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="community-detail-page">
      <div className="community-detail-container">
        <Link href="/communities" className="detail-back">
          ← Back to Communities
        </Link>

        {error && <div className="detail-error">{error}</div>}

        {/* COMMUNITY HEADER */}
        <section className="detail-community-header">
          <div className="detail-community-image">
            {community.image ? (
              <img src={community.image} alt={community.name} />
            ) : (
              <span>🌷</span>
            )}
          </div>

          <div className="detail-community-info">
            <p className="detail-subtitle">COMMUNITY</p>

            <h1>{community.name}</h1>

            <p className="detail-description">
              {community.description || "No description available."}
            </p>

            <div className="detail-meta">
              <span>👥 {community._count.members} members</span>
              <span>📝 {community._count.posts} posts</span>
            </div>

            <p className="detail-creator">
              Created by{" "}
              <strong>
                {community.creator.name || community.creator.username}
              </strong>
            </p>

            <button
              type="button"
              className={
                isJoined ? "detail-leave-btn" : "detail-join-btn"
              }
              onClick={handleMembership}
              disabled={processing}
            >
              {processing
                ? "Please wait..."
                : isJoined
                  ? "Leave Community"
                  : "Join Community"}
            </button>
          </div>
        </section>

        {/* COMMUNITY POSTS */}
        <section className="detail-posts-section">
          <div className="detail-posts-heading">
            <h2>Community Posts</h2>
            <span>{community._count.posts} posts</span>
          </div>

          {isJoined ? (
            <form
              className="detail-create-post"
              onSubmit={handleCreatePost}
            >
              <h3>Share something with the community 🌸</h3>

              <textarea
                value={postContent}
                onChange={(event) => setPostContent(event.target.value)}
                placeholder={`What's happening in ${community.name}?`}
                rows={4}
                maxLength={1000}
                required
              />

              <div className="detail-create-post-footer">
                <span>{postContent.length}/1000</span>

                <button
                  type="submit"
                  disabled={posting || !postContent.trim()}
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          ) : (
            <div className="detail-join-notice">
              <p>Join this community to share your posts! 🌷</p>
            </div>
          )}

          {community.posts.length === 0 ? (
            <div className="detail-empty">
              <div>🌸</div>
              <h3>No posts yet</h3>
              <p>
                Be the first to share something with this community!
              </p>
            </div>
          ) : (
            <div className="detail-post-list">
              {community.posts.map((post) => (
                <article className="detail-post-card" key={post.id}>
                  {/* AUTHOR */}
                  <div className="detail-post-author">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.username}
                      />
                    ) : (
                      <div className="detail-avatar-placeholder">
                        {(post.author.name || post.author.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <strong>
                        {post.author.name || post.author.username}
                      </strong>
                      <span>@{post.author.username}</span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <p className="detail-post-content">{post.content}</p>

                  {/* POST ACTIONS */}
                  <div className="detail-post-footer">
                    <span>{formatDate(post.createdAt)}</span>

                    <button
                      type="button"
                      className={`detail-action-btn ${
                        post.isLiked ? "liked" : ""
                      }`}
                      onClick={() => handleLike(post.id)}
                      disabled={likingPosts.includes(post.id)}
                      aria-label={post.isLiked ? "Unlike post" : "Like post"}
                    >
                      <span>{post.isLiked ? "❤️" : "♡"}</span>
                      <span>{post._count.likes}</span>
                    </button>

                    <button
                      type="button"
                      className="detail-action-btn"
                      onClick={() => handleToggleComments(post.id)}
                    >
                      <span>💬</span>
                      <span>{post._count.comments}</span>
                    </button>

                    <span>👁 {post.views}</span>

                    <button
                      type="button"
                      className={`detail-action-btn detail-save-btn ${
                        post.isBookmarked ? "saved" : ""
                      }`}
                      onClick={() => handleBookmark(post.id)}
                      disabled={bookmarkingPosts.includes(post.id)}
                    >
                      {post.isBookmarked ? "🔖 Saved" : "🔖 Save"}
                    </button>
                  </div>

                  {/* COMMENTS PANEL */}
                  {openComments.includes(post.id) && (
                    <div className="detail-comments">
                      <h3>Comments</h3>

                      {commentsLoading.includes(post.id) ? (
                        <p className="detail-comments-empty">
                          Loading comments...
                        </p>
                      ) : (comments[post.id] || []).length === 0 ? (
                        <p className="detail-comments-empty">
                          No comments yet. Be the first to comment!
                        </p>
                      ) : (
                        <div className="detail-comments-list">
                          {(comments[post.id] || []).map((comment) => (
                            <div
                              className="detail-comment"
                              key={comment.id}
                            >
                              {comment.user.avatarUrl ? (
                                <img
                                  src={comment.user.avatarUrl}
                                  alt={comment.user.username}
                                  className="detail-comment-avatar"
                                />
                              ) : (
                                <div className="detail-comment-avatar placeholder">
                                  {(comment.user.name ||
                                    comment.user.username)
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}

                              <div className="detail-comment-body">
                                <div className="detail-comment-author">
                                  <strong>
                                    {comment.user.name ||
                                      comment.user.username}
                                  </strong>
                                  <span>@{comment.user.username}</span>
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
                        className="detail-comment-form"
                        onSubmit={(event) =>
                          handleSendComment(event, post.id)
                        }
                      >
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ""}
                          onChange={(event) =>
                            setCommentInputs((previous) => ({
                              ...previous,
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
        </section>
      </div>
    </div>
  );
}

export default function CommunityDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="community-detail-page">
          <p className="detail-loading">Loading community...</p>
        </div>
      }
    >
      <CommunityDetailContent />
    </Suspense>
  );
}
