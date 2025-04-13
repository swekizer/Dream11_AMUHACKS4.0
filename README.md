# 🌍 TheGoodSociety — Crowdfunding & Social Impact Platform

**TheGoodSociety** is a full-stack, modern fundraising platform that allows users to create, manage, and donate to causes they care about — all while building a socially driven community. Inspired by GoFundMe and modern social networks, it bridges the gap between social impact and digital giving.

[Live Site →](https://fundraiser-website-pearl.vercel.app/)

## 🚀 Features

- 📝 **Create & Manage Campaigns** — Easy-to-use campaign creation with images, goals, and categories.
- 💸 **Real-Time Donations** — Smooth Payment Flow.
- 🌐 **Explore Campaigns** — Discover fundraisers by popularity, recency, or funding status.
- 🫂 **Community Feed** — Integrated social layer for updates, comments, and engagement.
- 🔒 **Secure Auth** — Login/Signup powered by Supabase Authentication.
- 📊 **Analytics & Tracking** — Track progress toward fundraising goals in real-time.

## 🛠️ Tech Stack

| Layer          | Tech Used                                  |
|----------------|--------------------------------------------|
| Frontend       | Next.js                                    |
| Backend        | Supabase (Database, Auth, Storage)         |
| Hosting        | Vercel                                     |
| Dev Tools      | VS Code, GitHub                            |


## ⚖️ Supabase Setup

1. Go to [Supabase](https://supabase.io/) and create a project
2. Create tables and policies from schema.sql file.
3. Enable **Row Level Security (RLS)** where needed
4. Setup **Auth** with email/password provider
5. Add Supabase credentials to your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## ⚡ How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/theGOOdSociety.git
   cd theGOOdSociety
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables in `.env.local` (see Supabase setup)

4. Run development server:
   ```bash
   npm run dev
   ```

5. Visit http://localhost:3000 in your browser

## 🌟 Future Directions

- ✨ Real-time donations feed
- 🔐 Full donor authentication & donation history
- 🚀 Social media sharing & engagement metrics
- 🛍️ Integration with Razorpay/Stripe for wider payment options
- 🌐 Multilingual support
- 💸 Admin dashboard for campaign moderation
- 📉 Analytics for fundraisers

## 🙏 Acknowledgements

Built during a hackathon sprint using cutting-edge tools. Inspired by GoFundMe, Milaap, and the need for transparent, community-driven giving.
AMUHACKS 4.0 
#AMUHACKS 4.0 #CSSAMU #AMU


