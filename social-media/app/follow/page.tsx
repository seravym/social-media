"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import "../home/home.css";

interface UserItem {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function FollowPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        const res = await fetch("/api/follow");
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setErrorMsg(data.error || "Gagal memuat daftar pengguna");
        } else {
          setUsers(data.users || []);
        }
      } catch {
        if (!cancelled) setErrorMsg("Terjadi kesalahan jaringan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFollow = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal memproses follow");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== targetUserId) return u;
          return {
            ...u,
            isFollowing: data.following,
            followersCount: data.following
              ? u.followersCount + 1
              : u.followersCount - 1,
          };
        })
      );
    } catch {
      alert("Terjadi kesalahan saat memproses follow");
    }
  };

  return (
    <div className="feed-layout">
      <nav className="feed-nav">
        <Link href="/home" className="feed-nav-link">← Kembali ke Home</Link>
      </nav>

      <div className="feed-header">
        <h1 className="feed-title">Who to Follow</h1>
      </div>

      {errorMsg && <p className="error-text">{errorMsg}</p>}

      {loading ? (
        <p className="status-text">Memuat pengguna...</p>
      ) : users.length === 0 ? (
        <p className="status-text">Belum ada pengguna lain yang terdaftar.</p>
      ) : (
        users.map((user) => (
          <div key={user.id} className="follow-card">
            <div>
              <div className="post-meta" style={{ marginBottom: "2px" }}>
                <span className="post-author-name">
                  {user.name || user.username}
                </span>
                <span className="post-author-handle">@{user.username}</span>
              </div>
              <p className="post-time" style={{ margin: 0 }}>
                {user.followersCount} Followers · {user.followingCount} Following
              </p>
            </div>
            <button
              className={user.isFollowing ? "btn-outline" : "btn-pink"}
              onClick={() => handleToggleFollow(user.id)}
            >
              {user.isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}