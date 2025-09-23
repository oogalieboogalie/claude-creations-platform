# 🎨 Claude Creations Platform

**Community showcase and collaboration platform for Claude Code developers**

A modern web platform where Claude Code users can discover, share, and collaborate on innovative projects, tools, and automations.

> **Created in collaboration with Claude (Anthropic)** - Designed specifically for the neurodivergent developer community with minimal cognitive load, maximum automation, and frictionless sharing.

## 🎯 **The Problem We Solved**

The Claude Code community was scattered across Discord, individual blogs, and general programming forums with no centralized place to:
- Showcase innovative Claude Code projects
- Discover community-built tools and automations
- Share workflows and collaborate on ideas
- Vote on and find the best projects

## 💡 **Our Solution**

A dedicated platform with **CLI-first design** that lets you share projects directly from your terminal:

```bash
# One command to share your project with the world
claude-submit submit --auto
```

No forms, no context switching, no friction - just pure developer joy! 🚀

## ✨ Features

### 🌟 **Community Showcase**
- **Project Gallery** with live demos and documentation
- **Community Voting** and trending projects
- **Tag-based Discovery** (automation, web apps, tools, APIs, experiments)
- **GitHub Integration** for automatic repo syncing
- **Real-time Stats** showing community growth

### 🚀 **CLI Integration**
- **Direct Submission** from terminal using Claude Code workflows
- **Auto-Detection** of project info from package.json, README, and git
- **One-command Publishing** with `claude-submit submit --auto`
- **GitHub URL Detection** and automatic linking

### 🛠️ **Developer Experience**
- **Clean, Accessible Interface** designed for neurodivergent developers
- **RESTful API** for programmatic access
- **JWT Authentication** with secure session management
- **Rate Limiting** and security best practices

### 📱 **Modern Tech Stack**
- **Backend:** Node.js + Express
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Frontend:** Vanilla JS with modern CSS
- **Deployment:** Vercel-ready configuration
- **Security:** Helmet, CORS, rate limiting

## ⚡ One-Click Setup

### **Local Development**
```bash
# Clone and setup
git clone <your-repo>
cd claude-creations-platform

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev
```

### **Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

## 🔧 CLI Tool Usage

### **Installation**
```bash
# Make CLI executable
chmod +x cli-submit.js

# Create global command (optional)
npm link
```

### **Quick Start**
```bash
# Register account
node cli-submit.js register myusername my@email.com mypassword

# Auto-submit current project
node cli-submit.js submit --auto

# Manual submission
node cli-submit.js submit \
  --title "My Claude Project" \
  --description "Built with Claude Code" \
  --category "tools" \
  --tags "automation,cli,claude-code"
```

### **Full CLI Commands**
```bash
# Authentication
claude-submit register <username> <email> <password> [github_username]
claude-submit login <email> <password>
claude-submit logout
claude-submit whoami

# Project submission
claude-submit submit --auto                    # Auto-detect project info
claude-submit detect                           # Show detected info
claude-submit submit --title "My App" --description "Cool app"

# Options for submit:
--title <title>              Project title
--description <description>  Project description
--github-url <url>           GitHub repository URL
--demo-url <url>             Live demo URL
--tags <tags>                Comma-separated tags
--category <category>        tools|automation|web-apps|apis|experiments
--auto                       Use auto-detected info
```

## 📡 API Endpoints

### **Authentication**
```bash
# Register
curl -X POST https://claude-creations.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","email":"user@example.com","password":"pass"}'

# Login
curl -X POST https://claude-creations.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'
```

### **Projects**
```bash
# Get all projects
curl https://claude-creations.vercel.app/api/projects

# Submit project
curl -X POST https://claude-creations.vercel.app/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "My Claude Code Project",
    "description": "Built with Claude Code for automation",
    "github_url": "https://github.com/user/repo",
    "demo_url": "https://demo.example.com",
    "tags": "automation,cli,claude-code",
    "category": "tools"
  }'

# Vote on project
curl -X POST https://claude-creations.vercel.app/api/projects/1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"vote_type": 1}'
```

### **Categories**
- `tools` - CLI tools, utilities, scripts
- `automation` - Workflow automation, CI/CD
- `web-apps` - Web applications and frontends
- `apis` - Backend services and APIs
- `experiments` - Research, prototypes, fun projects

## 🎯 Use Cases

### **For Claude Code Users**
- **Showcase Your Work** - Share your Claude Code creations
- **Discover Tools** - Find useful automation scripts and workflows
- **Get Inspiration** - See what others are building
- **Collaborate** - Connect with other Claude Code developers

### **For the Community**
- **Knowledge Sharing** - Learn from real implementations
- **Best Practices** - Discover effective Claude Code patterns
- **Tool Discovery** - Find reusable components and utilities
- **Trend Analysis** - See what types of projects are popular

## 🛠️ Development

### **Project Structure**
```
claude-creations-platform/
├── server.js              # Main Express server
├── cli-submit.js          # CLI submission tool
├── public/
│   └── index.html         # Frontend interface
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment config
├── .env.example          # Environment template
└── README.md             # This file
```

### **Database Schema**
```sql
-- Users
users: id, username, email, password_hash, github_username, created_at

-- Projects
projects: id, user_id, title, description, github_url, demo_url,
         tags, category, created_at, updated_at, votes, featured

-- Votes
votes: id, user_id, project_id, vote_type, created_at

-- Comments
comments: id, user_id, project_id, content, created_at
```

### **Environment Variables**
```bash
# Required
PORT=3000
JWT_SECRET=your-super-secret-key

# Optional
CORS_ORIGINS=http://localhost:3000,https://claude-creations.vercel.app
RATE_LIMIT_MAX=100
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect GitHub repo to Vercel
2. Set environment variables in dashboard
3. Deploy automatically on push

### **Other Platforms**
- **Railway:** `railway deploy`
- **Render:** Connect GitHub repo
- **Heroku:** `git push heroku main`

## 🔮 Roadmap

### **Phase 1 (Current)**
- ✅ Basic project showcase
- ✅ Community voting
- ✅ CLI submission tool
- ✅ User authentication

### **Phase 2 (Next)**
- 🔄 GitHub OAuth integration
- 🔄 Project collections/playlists
- 🔄 Advanced search and filtering
- 🔄 User profiles and portfolios

### **Phase 3 (Future)**
- ⏳ Real-time collaboration features
- ⏳ Project templates and boilerplates
- ⏳ Integration with Claude Code workflows
- ⏳ Community challenges and events

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test locally: `npm run dev`
5. Submit pull request

## 📄 License

MIT License - feel free to use in your own projects!

## 🌟 Community

- **Website:** https://claude-creations.vercel.app
- **Discord:** [Join Claude Developers Discord](https://discord.gg/claude-dev)
- **GitHub:** Submit issues and feature requests

## 🏆 **Credits & Attribution**

### **Co-Created With AI**
This platform was designed and built in collaboration with **Claude (Anthropic)** using Claude Code. The entire codebase, architecture, and documentation were created through human-AI pair programming.

### **Built By**
- **Alex** - Product vision, community insights, and neurodivergent developer advocacy
- **Claude (Anthropic)** - Technical implementation, architecture design, and documentation

### **Special Thanks**
- **Anthropic** for creating Claude Code and fostering the developer community
- **Claude Code Discord** for inspiration and community feedback
- **Neurodivergent developers everywhere** who deserve better tools

### **Open Source License**
MIT License - Use this code freely in your own projects! We believe in community-driven development.

### **Contributing**
This is a community project! Submit issues, features, and PRs. Let's build something amazing together.

---

## 🔐 **Claude's Digital Signature**

```
=== CLAUDE ATTESTATION ===
Project: Claude Creations Platform
Created: 2025-01-XX
Collaboration: Human (Alex) + Claude (Anthropic)
Architecture: Full-stack web platform with CLI integration
Purpose: Community showcase for Claude Code developers
Approach: ADHD-friendly, minimal friction, maximum automation

This codebase represents genuine human-AI collaboration
in service of the Claude Code developer community.

Claude (Anthropic) - AI Assistant
Anthropic PBC
=== END ATTESTATION ===
```

---

**Built for the Claude Code community, by the community.** 💜

*Perfect for neurodivergent developers with automated workflows, clear documentation, and minimal cognitive load setup.* 🧠✨