
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "./list-detail.css";

type User = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
};

type ListMember = {
  id: number;
  userId: string;
  addedAt: string;
  user: User;
};

type ListDetail = {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  createdAt: string;
  owner: User;
  members: ListMember[];
  _count: {
    members: number;
  };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: User;
};

type Post = {
  id: string;
  content: string;
  views: number;
  createdAt: string;
  author: User;
  repliesCount: number;
  likesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
};

function ListDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [list, setList] = useState<ListDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");

  const [likingPostIds, setLikingPostIds] = useState<Set<string>>(
    new Set()
  );

  const [bookmarkingPostIds, setBookmarkingPostIds] = useState<
    Set<string>
  >(new Set());

  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(
    new Set()
  );

  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, Comment[]>
  >({});

  const [loadedCommentPostIds, setLoadedCommentPostIds] = useState<
    Set<string>
  >(new Set());

  const [loadingCommentPostIds, setLoadingCommentPostIds] = useState<
    Set<string>
  >(new Set());

  const [commentInputs, setCommentInputs] = useState<
    Record<string, string>
  >({});

  const [submittingPostIds, setSubmittingPostIds] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const [listResponse, postsResponse] = await Promise.all([
          fetch(`/api/lists/${id}`),
          fetch(`/api/lists/${id}/posts`),
        ]);

        const [listResult, postsResult] = await Promise.all([
          listResponse.json(),
          postsResponse.json(),
        ]);

        if (!listResponse.ok || !listResult.success) {
          throw new Error(listResult.message || "Failed to load list");
        }

        setList(listResult.data);

        if (!postsResponse.ok || !postsResult.success) {
          setPostsError(
            postsResult.message || "Failed to load List Timeline."
          );
        } else {
          setPosts(postsResult.posts || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
        setPostsLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  async function handleLike(post: Post) {
    if (likingPostIds.has(post.id)) return;

    setLikingPostIds((previous) => {
      const updated = new Set(previous);
      updated.add(post.id);
      return updated;
    });

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process like.");
      }

      setPosts((previous) =>
        previous.map((item) =>
          item.id === post.id
            ? {
                ...item,
                isLiked: result.liked,
                likesCount: Math.max(
                  0,
                  item.likesCount + (result.liked ? 1 : -1)
                ),
              }
            : item
        )
      );
    } catch (error) {
      console.error("Like Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to process like."
      );
    } finally {
      setLikingPostIds((previous) => {
        const updated = new Set(previous);
        updated.delete(post.id);
        return updated;
      });
    }
  }

  async function handleBookmark(post: Post) {
    if (bookmarkingPostIds.has(post.id)) return;

    setBookmarkingPostIds((previous) => {
      const updated = new Set(previous);
      updated.add(post.id);
      return updated;
    });

    try {
      const response = await fetch(
        post.isBookmarked
          ? `/api/bookmarks?postId=${encodeURIComponent(post.id)}`
          : "/api/bookmarks",
        {
          method: post.isBookmarked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          ...(!post.isBookmarked && {
            body: JSON.stringify({ postId: post.id }),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update bookmark."
        );
      }

      setPosts((previous) =>
        previous.map((item) =>
          item.id === post.id
            ? {
                ...item,
                isBookmarked: !item.isBookmarked,
              }
            : item
        )
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update bookmark."
      );
    } finally {
      setBookmarkingPostIds((previous) => {
        const updated = new Set(previous);
        updated.delete(post.id);
        return updated;
      });
    }
  }

  async function handleToggleReplies(postId: string) {
    const isExpanded = expandedPostIds.has(postId);

    setExpandedPostIds((previous) => {
      const updated = new Set(previous);

      if (isExpanded) {
        updated.delete(postId);
      } else {
        updated.add(postId);
      }

      return updated;
    });

    if (isExpanded || loadedCommentPostIds.has(postId)) return;

    setLoadingCommentPostIds((previous) => {
      const updated = new Set(previous);
      updated.add(postId);
      return updated;
    });

    try {
      const response = await fetch(
        `/api/posts/${postId}/comments`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load replies.");
      }

      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: result.comments || [],
      }));

      setLoadedCommentPostIds((previous) => {
        const updated = new Set(previous);
        updated.add(postId);
        return updated;
      });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to load replies."
      );

      setExpandedPostIds((previous) => {
        const updated = new Set(previous);
        updated.delete(postId);
        return updated;
      });
    } finally {
      setLoadingCommentPostIds((previous) => {
        const updated = new Set(previous);
        updated.delete(postId);
        return updated;
      });
    }
  }

  async function handleSubmitComment(postId: string) {
    const content = commentInputs[postId]?.trim();

    if (!content || submittingPostIds.has(postId)) return;

    setSubmittingPostIds((previous) => {
      const updated = new Set(previous);
      updated.add(postId);
      return updated;
    });

    try {
      const response = await fetch(
        `/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send reply.");
      }

      const newComment: Comment = result.comment;

      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: [
          newComment,
          ...(previous[postId] || []),
        ],
      }));

      setCommentInputs((previous) => ({
        ...previous,
        [postId]: "",
      }));

      setLoadedCommentPostIds((previous) => {
        const updated = new Set(previous);
        updated.add(postId);
        return updated;
      });

      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? {
                ...post,
                repliesCount: post.repliesCount + 1,
              }
            : post
        )
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to send reply."
      );
    } finally {
      setSubmittingPostIds((previous) => {
        const updated = new Set(previous);
        updated.delete(postId);
        return updated;
      });
    }
  }

  if (loading) {
    return (
      <div className="list-detail-page">
        <p>Loading list...</p>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="list-detail-page">
        <button onClick={() => router.push("/lists")}>
          Back to Lists
        </button>
        <p>{error || "List not found"}</p>
      </div>
    );
  }

  return (
    <div className="list-detail-page">
      <div className="list-detail-header">
        <button
          className="back-button"
          onClick={() => router.push("/lists")}
        >
          ← Back to Lists
        </button>

        <h1>{list.name}</h1>
        <p>{list.description || "No description available."}</p>

        <span>
          {list.isPrivate ? "🔒 Private List" : "🌐 Public List"}
        </span>
      </div>

      <div className="list-detail-card">
        <h2>List Information</h2>

        <p>
          Created by:{" "}
          {list.owner?.name ||
            (list.owner?.username
              ? `@${list.owner.username}`
              : "Unknown")}
        </p>

        <p>
          Created on:{" "}
          {new Date(list.createdAt).toLocaleDateString("id-ID")}
        </p>

        <p>Total Members: {list._count.members}</p>
      </div>

      <div className="list-members-section">
        <div className="members-section-header">
          <div>
            <h2>Members</h2>
            <p>{list._count.members} accounts in this List</p>
          </div>

          <button
            className="manage-members-button"
            onClick={() => router.push(`/lists/${id}/members`)}
          >
            Manage Members
          </button>
        </div>

        {list.members.length === 0 ? (
          <p>No members in this list yet.</p>
        ) : (
          <div className="members-list">
            {list.members.map((member) => (
              <div className="member-item" key={member.id}>
                <div>
                  <strong>
                    {member.user.name || `@${member.user.username}`}
                  </strong>
                  <p>@{member.user.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="list-timeline-section">
        <div className="list-timeline-header">
          <h2>List Timeline</h2>
          <p>Latest posts from accounts in this List</p>
        </div>

        {postsLoading ? (
          <div className="timeline-empty">
            <p>Loading posts...</p>
          </div>
        ) : postsError ? (
          <div className="timeline-empty">
            <p>{postsError}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="timeline-empty">
            <div className="timeline-empty-icon">📝</div>
            <h3>No posts yet</h3>
            <p>
              Posts from accounts added to this List will appear here.
            </p>
          </div>
        ) : (
          <div className="list-posts">
            {posts.map((post) => (
              <article className="list-post-card" key={post.id}>
                <div className="list-post-author">
                  {post.author.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.username}
                      className="list-post-avatar"
                    />
                  ) : (
                    <div className="list-post-avatar-placeholder">
                      {(post.author.name || post.author.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="list-post-author-info">
                    <strong>
                      {post.author.name || `@${post.author.username}`}
                    </strong>

                    <span>
                      @{post.author.username} ·{" "}
                      {new Date(post.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>

                <p className="list-post-content">{post.content}</p>

                <div className="list-post-stats">
                  <button
                    type="button"
                    className={`list-replies-button ${
                      expandedPostIds.has(post.id) ? "active" : ""
                    }`}
                    onClick={() => handleToggleReplies(post.id)}
                  >
                    💬 {post.repliesCount}{" "}
                    {post.repliesCount === 1 ? "Reply" : "Replies"}
                  </button>

                  <button
                    type="button"
                    className={`list-like-button ${
                      post.isLiked ? "liked" : ""
                    }`}
                    onClick={() => handleLike(post)}
                    disabled={likingPostIds.has(post.id)}
                  >
                    {post.isLiked ? "❤️" : "♡"}{" "}
                    {post.likesCount}{" "}
                    {post.likesCount === 1 ? "Like" : "Likes"}
                  </button>

                  <button
                    type="button"
                    className={`list-bookmark-button ${
                      post.isBookmarked ? "bookmarked" : ""
                    }`}
                    onClick={() => handleBookmark(post)}
                    disabled={bookmarkingPostIds.has(post.id)}
                  >
                    {post.isBookmarked ? "🔖 Saved" : "♧ Bookmark"}
                  </button>

                  <span>👁️ {post.views} Views</span>
                </div>

                {expandedPostIds.has(post.id) && (
                  <div className="list-replies-section">
                    <h3>Replies</h3>

                    {loadingCommentPostIds.has(post.id) ? (
                      <p className="replies-message">
                        Loading replies...
                      </p>
                    ) : (
                      <>
                        {(commentsByPost[post.id] || []).length === 0 ? (
                          <p className="replies-message">
                            No replies yet. Be the first to reply!
                          </p>
                        ) : (
                          <div className="list-comments">
                            {(commentsByPost[post.id] || []).map(
                              (comment) => (
                                <div
                                  className="list-comment-item"
                                  key={comment.id}
                                >
                                  <div className="list-comment-avatar">
                                    {comment.user.avatarUrl ? (
                                      <img
                                        src={comment.user.avatarUrl}
                                        alt={comment.user.username}
                                      />
                                    ) : (
                                      <span>
                                        {(
                                          comment.user.name ||
                                          comment.user.username
                                        )
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>

                                  <div className="list-comment-content">
                                    <div className="list-comment-heading">
                                      <strong>
                                        {comment.user.name ||
                                          `@${comment.user.username}`}
                                      </strong>
                                      <span>
                                        @{comment.user.username}
                                      </span>
                                    </div>

                                    <p>{comment.content}</p>

                                    <small>
                                      {new Date(
                                        comment.createdAt
                                      ).toLocaleString("id-ID", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </small>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <form
                          className="list-reply-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            handleSubmitComment(post.id);
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Write a reply..."
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
                              !commentInputs[post.id]?.trim() ||
                              submittingPostIds.has(post.id)
                            }
                          >
                            {submittingPostIds.has(post.id)
                              ? "Sending..."
                              : "Send"}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ListDetail() {
  return (
    <Suspense
      fallback={
        <div className="list-detail-page">
          <p>Loading list...</p>
        </div>
      }
    >
      <ListDetailContent />
    </Suspense>
  );
}
