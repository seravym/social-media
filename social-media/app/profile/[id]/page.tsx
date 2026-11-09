
export default function ProfilePage() {
    return (
        <main className="profile-page">

            {/* Profile Header */}
            <section className="profile-header">
                <h2>Profile</h2>
            </section>

            {/* Profile Banner */}
            <section className="profile-banner">
                <div className="banner-placeholder">
                    Profile Banner
                </div>
            </section>

            {/* Profile Information */}
            <section className="profile-information">

                <div className="profile-picture">
                    Profile Picture
                </div>

                <div className="profile-details">
                    <h2>Amelia Febriani</h2>
                    <p>@amelia</p>

                    <p>
                        Information Technology Student.
                        Interested in Web Development.
                    </p>

                    <div className="profile-followers">
                        <span>85 Following</span>
                        <span>120 Followers</span>
                    </div>
                </div>

                <button>Edit Profile</button>

            </section>

            {/* Profile Navigation */}
            <section className="profile-navigation">
                <div>Posts</div>
                <div>Replies</div>
                <div>Media</div>
                <div>Likes</div>
            </section>

            {/* Profile Posts */}
            <section className="profile-posts">
                <h3>Posts</h3>

                <div className="post-item">
                    <p>Username</p>
                    <p>This is my first post!</p>
                </div>

            </section>

        </main>
    );
}
