import { prisma } from "../lib/prisma";

const username = process.env.SEED_USERNAME;

const categories = [
    {
        name: "Technology",
        image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475",
        titles: [
        "How Technology Is Changing Everyday Life",
        "The Future of Artificial Intelligence",
        "Simple Ways to Improve Digital Security",
        "Why Smart Devices Are Becoming Popular",
        "Technology Trends Worth Understanding",
        ],
    },
    {
        name: "Design",
        image:
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
        titles: [
        "The Importance of Design in Daily Life",
        "Minimalist Design for Beginners",
        "How Colors Influence Visual Design",
        "Creating a Better User Experience",
        "Design Inspiration from Everyday Objects",
        ],
    },
    {
        name: "Data",
        image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
        titles: [
        "Understanding Data in the Modern World",
        "How Data Helps Us Make Decisions",
        "A Beginner's Guide to Data Visualization",
        "The Role of Data in Everyday Technology",
        "Turning Information into Useful Insights",
        ],
    },
    {
        name: "Food",
        image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        titles: [
        "Exploring the Joy of Simple Food",
        "Comfort Food for a Busy Day",
        "Why Food Brings People Together",
        "A Beginner's Guide to Balanced Meals",
        "Discovering New Flavors and Recipes",
        ],
    },
    {
        name: "Travel",
        image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
        titles: [
        "The Beauty of Exploring New Places",
        "How to Plan a Simple Weekend Trip",
        "Travel Tips for First-Time Explorers",
        "Finding Inspiration Through Travel",
        "Making Meaningful Memories on a Trip",
        ],
    },
    ];

    async function main() {
    if (!username) {
        throw new Error(
        "Set SEED_USERNAME to your existing account username."
        );
    }

    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        throw new Error(`User @${username} was not found.`);
    }

    const seededArticles: { id: string; category: string }[] = [];

    for (const category of categories) {
        for (const title of category.titles) {
        let article = await prisma.article.findFirst({
            where: {
            authorId: user.id,
            title,
            },
        });

        if (!article) {
            article = await prisma.article.create({
            data: {
                authorId: user.id,
                title,
                category: category.name,
                content: `${title}.

    This article explores ${title.toLowerCase()} and why it matters in our daily lives. Through simple examples and practical ideas, we can understand the topic more clearly and discover how it connects to our experiences.

    Learning something new does not always require complicated steps. Starting with the basics, observing what happens around us, and staying curious can help us develop a better understanding of this subject.

    There are many ways to apply these ideas in everyday life. The most important thing is to keep exploring, learn from different perspectives, and find what works best for us.`,
                coverImageUrl: `${category.image}?auto=format&fit=crop&w=1200&q=80`,
                status: "published",
                publishedAt: new Date(),
            },
            });
        }

        seededArticles.push({
            id: article.id,
            category: category.name,
        });
        }
    }

    for (const category of categories) {
        const article = seededArticles.find(
        (item) => item.category === category.name
        );

        if (!article) continue;

        const existingBookmark = await prisma.articleBookmark.findUnique({
        where: {
            articleId_userId: {
            articleId: article.id,
            userId: user.id,
            },
        },
        });

        if (!existingBookmark) {
        await prisma.articleBookmark.create({
            data: {
            articleId: article.id,
            userId: user.id,
            },
        });
        }
    }

    console.log("Dummy articles added successfully!");
    console.log("5 articles per category: Technology, Design, Data, Food, Travel");
    console.log("5 articles bookmarked for Saved.");
    }

    main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
