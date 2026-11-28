"use client"
import "./profile.css";
import { useState } from "react";

export default function ProfilePage() {
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [displayName, setDisplayName] = useState("Nama Akun");
    const [username, setUsername] = useState("@username");
    const [bio,setBio] = useState ("")

const [draftName, setDraftName] = useState(displayName);
  const [draftUsername, setDraftUsername] = useState(username);
  const [draftBio, setDraftBio] = useState(bio);



  return (
    <div className="profile-layout">
      <main className="profile-page">
        <section className="profile-banner" >
            <img
            src= "/banner.jpg"
            alt= "banner tercinta"
            className="banner-img"
            />
            </section>

        <section className="profile-information">
          <div className="profile-top-row">
            <div className="profile-picture">
                <img
                src="/juhoon.jpg"
                alt="Ma juhoon Profile"
                className="avatar-img"
                />
            </div>

            <div className="profile-stats">
              <div>
                <strong>0</strong>
                <span>Followers</span>
              </div>
              <div>
                <strong>0</strong>
                <span>Following</span>
              </div>
            </div>

            <div className="profile-actions">
              <button type="button" onClick={() => setIsEditOpen(true)}>Edit Profile</button>
              <button type="button">Share</button>
            </div>
          </div>

          <div className="profile-details">
            <h2>Nama Akun</h2>
            <p>@username</p>
            <p>bergabung sejak 2026</p>
          </div>
        </section>

        <section className="profile-navigation">
          <div className="active">Posts</div>
          <div>Replies</div>
          <div>Likes</div>
        </section>

        <section className="profile-posts">
          <div className="post-item">
            <p>
              <strong>Nama Akun</strong> @username
            </p>
            <p>kenapa aku begadang terus??</p>
            <div className = "post-actions">
                <span>💬 890</span>
                <span>♡ 15</span>
                <span>📊 1M</span>
                <span>🔖</span>
            </div>
          </div>
        </section>

        <section className="profile-posts">
          <div className="post-item">
            <p>
              <strong>Nama Akun</strong> @username
            </p>
            <p> Bismillah Front-End A</p>
            <div className = "post-actions">
                <span>💬 8</span>
                <span>♡ 15</span>
                <span>📊 1M</span>
                <span>🔖</span>
            </div>
          </div>
        </section>

      </main>

      

      <aside className="profile-sidebar">
        <input type="text" placeholder="Search..." />
        <div>
          <h3>Trending</h3>
          <p>#randomtrend</p>
        </div>
      </aside>
    </div>
  );
}