"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  name: string;
  handle: string;
  time: string;
  message: string;
  replies: number;
  likes: number;
  views: string | number;
}

const defaultPosts: Post[] = [
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
];

const STORE_ALL_POSTS = "xclone.posts.list";

export default function HomePage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<"foryou" | "following">("foryou");
  const [postText, setPostText] = useState("");
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window === "undefined") return defaultPosts;
    const localPosts = JSON.parse(localStorage.getItem(STORE_ALL_POSTS) || "null");
    if (localPosts && localPosts.length > 0) {
      return localPosts;
    }
    localStorage.setItem(STORE_ALL_POSTS, JSON.stringify(defaultPosts));
    return defaultPosts;
  });

  const handleCreatePost = () => {
    if (!postText.trim()) return;

    const newPost: Post = {
      id: "user_post_" + Date.now(),
      name: "User",
      handle: "@user",
      time: "Now",
      message: postText.trim(),
      replies: 0,
      likes: 0,
      views: "0",
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem(STORE_ALL_POSTS, JSON.stringify(updatedPosts));
    setPostText("");
  };

  const handleToggleLike = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter((id) => id !== postId));
    } else {
      setLikedPosts([...likedPosts, postId]);
    }
  };

  return (
    <div>
      {/* Navigasi Sederhana */}
      <nav>
        <ul>
          <li><a href="/home">Home</a></li>
          <li><a href="/communities">Communities</a></li>
        </ul>
      </nav>

      <hr />

      {/* Konten Utama */}
      <main>
        <h1>Home</h1>

        {/* Tab Navigasi */}
        <div>
          <button onClick={() => setCurrentTab("foryou")}>
            For You {currentTab === "foryou" && "(Aktif)"}
          </button>
          <button onClick={() => setCurrentTab("following")}>
            Following {currentTab === "following" && "(Aktif)"}
          </button>
        </div>

        <hr />

        {/* Kotak Buat Post */}
        <div>
          <h3>Buat Postingan Baru</h3>
          <textarea
            placeholder="What is happening?!"
            rows={3}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
          <br />
          <button onClick={handleCreatePost}>Post</button>
        </div>

        <hr />

        {/* Daftar Postingan */}
        <div>
          <h3>Linimasa (Feed)</h3>
          {posts.map((post, index) => {
            const postId = post.id || `post_index_${index}`;
            const isLiked = likedPosts.includes(postId);
            const displayLikes = (post.likes || 0) + (isLiked ? 1 : 0);

            return (
              <div
                key={postId}
                onClick={() => router.push(`/post/${postId}`)}
                style={{ border: "1px solid gray", margin: "10px 0", padding: "10px", cursor: "pointer" }}
              >
                <p>
                  <strong>{post.name}</strong> {post.handle} - {post.time}
                </p>
                <p>{post.message}</p>
                <div>
                  <span>💬 {post.replies || 0}</span> |{" "}
                  <button onClick={(e) => handleToggleLike(e, postId)}>
                    {isLiked ? "❤️ Suka" : "🤍 Suka"} ({displayLikes})
                  </button> |{" "}
                  <span>📊 {post.views || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}