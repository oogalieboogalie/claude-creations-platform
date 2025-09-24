#!/usr/bin/env node

/**
 * Claude Creations CLI Submission Tool
 * Submit your Claude Code projects directly from the terminal
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_BASE = process.env.CLAUDE_CREATIONS_API || 'https://claude-creations.vercel.app/api';
const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-creations-config.json');

class ClaudeCreationsCLI {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            }
        } catch (error) {
            console.log('No existing config found, will create new one');
        }
        return {};
    }

    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            console.log('✅ Configuration saved');
        } catch (error) {
            console.error('❌ Failed to save configuration:', error.message);
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            this.config.token = data.token;
            this.config.user = data.user;
            this.saveConfig();

            console.log(`✅ Logged in as ${data.user.username}`);
            return true;
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            return false;
        }
    }

    async register(username, email, password, githubUsername = null) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    github_username: githubUsername
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            this.config.token = data.token;
            this.config.user = data.user;
            this.saveConfig();

            console.log(`✅ Registered and logged in as ${data.user.username}`);
            return true;
        } catch (error) {
            console.error('❌ Registration failed:', error.message);
            return false;
        }
    }

    async submitProject(projectData) {
        if (!this.config.token || !this.config.user) {
            console.error('❌ Not logged in. Run: claude-submit login');
            return false;
        }

        projectData.creator_name = this.config.user.username;

        try {
            const response = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            console.log(`✅ Project "${projectData.title}" submitted successfully!`);
            console.log(`📝 Project ID: ${data.project_id}`);
            return true;
        } catch (error) {
            console.error('❌ Submission failed:', error.message);
            return false;
        }
    }

    async detectProjectInfo() {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const readmePath = path.join(process.cwd(), 'README.md');
        const gitConfigPath = path.join(process.cwd(), '.git', 'config');

        let projectInfo = {
            title: path.basename(process.cwd()),
            description: '',
            github_url: '',
            tags: [],
            category: 'tools'
        };

        // Try to read package.json
        try {
            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                projectInfo.title = pkg.name || projectInfo.title;
                projectInfo.description = pkg.description || projectInfo.description;

                // Detect category from keywords/dependencies
                if (pkg.keywords) {
                    projectInfo.tags = pkg.keywords;
                }

                if (pkg.dependencies) {
                    if (pkg.dependencies.express || pkg.dependencies.fastify) {
                        projectInfo.category = 'apis';
                    } else if (pkg.dependencies.react || pkg.dependencies.vue || pkg.dependencies.svelte) {
                        projectInfo.category = 'web-apps';
                    }
                }
            }
        } catch (error) {
            // Ignore package.json parsing errors
        }

        // Try to read README.md for description
        try {
            if (fs.existsSync(readmePath) && !projectInfo.description) {
                const readme = fs.readFileSync(readmePath, 'utf8');
                const lines = readme.split('\n');
                // Get first non-title line as description
                for (let line of lines) {
                    line = line.trim();
                    if (line && !line.startsWith('#') && !line.startsWith('!')) {
                        projectInfo.description = line.substring(0, 200);
                        break;
                    }
                }
            }
        } catch (error) {
            // Ignore README parsing errors
        }

        // Try to detect GitHub URL from git config
        try {
            if (fs.existsSync(gitConfigPath)) {
                const gitConfig = fs.readFileSync(gitConfigPath, 'utf8');
                const match = gitConfig.match(/url = (.+)/);
                if (match) {
                    let url = match[1].trim();
                    // Convert SSH to HTTPS
                    if (url.startsWith('git@github.com:')) {
                        url = url.replace('git@github.com:', 'https://github.com/');
                    }
                    if (url.endsWith('.git')) {
                        url = url.slice(0, -4);
                    }
                    projectInfo.github_url = url;
                }
            }
        } catch (error) {
            // Ignore git config parsing errors
        }

        return projectInfo;
    }

    showHelp() {
        console.log(`
🎨 Claude Creations CLI - Submit your projects to the community!

Usage:
  claude-submit <command> [options]

Commands:
  login <email> <password>        Login to your account
  register <username> <email> <password> [github_username]  Register new account
  submit [options]                Submit current project
  detect                          Show detected project info
  logout                          Logout from your account
  whoami                          Show current user
  help                           Show this help

Submit Options:
  --title <title>                Project title
  --description <description>    Project description
  --github-url <url>             GitHub repository URL
  --demo-url <url>               Live demo URL
  --tags <tags>                  Comma-separated tags
  --category <category>          Project category (tools, automation, web-apps, apis, experiments)
  --auto                         Use auto-detected project info

Examples:
  claude-submit register myuser my@email.com mypass
  claude-submit login my@email.com mypass
  claude-submit submit --auto
  claude-submit submit --title "My App" --description "Cool app" --category web-apps
  claude-submit detect

Website: https://claude-creations.vercel.app
`);
    }
}

// CLI Main Function
async function main() {
    const cli = new ClaudeCreationsCLI();
    const args = process.argv.slice(2);

    if (args.length === 0) {
        cli.showHelp();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'login':
            if (args.length < 3) {
                console.error('Usage: claude-submit login <email> <password>');
                return;
            }
            await cli.login(args[1], args[2]);
            break;

        case 'register':
            if (args.length < 4) {
                console.error('Usage: claude-submit register <username> <email> <password> [github_username]');
                return;
            }
            await cli.register(args[1], args[2], args[3], args[4]);
            break;

        case 'submit':
            const projectData = {};
            let useAuto = false;

            // Parse submit options
            for (let i = 1; i < args.length; i++) {
                const arg = args[i];
                const nextArg = args[i + 1];

                switch (arg) {
                    case '--title':
                        projectData.title = nextArg;
                        i++;
                        break;
                    case '--description':
                        projectData.description = nextArg;
                        i++;
                        break;
                    case '--github-url':
                        projectData.github_url = nextArg;
                        i++;
                        break;
                    case '--demo-url':
                        projectData.demo_url = nextArg;
                        i++;
                        break;
                    case '--tags':
                        projectData.tags = nextArg;
                        i++;
                        break;
                    case '--category':
                        projectData.category = nextArg;
                        i++;
                        break;
                    case '--auto':
                        useAuto = true;
                        break;
                }
            }

            if (useAuto || Object.keys(projectData).length === 0) {
                const detected = await cli.detectProjectInfo();
                Object.assign(detected, projectData); // Manual options override detected
                projectData = detected;
            }

            if (!projectData.title || !projectData.description) {
                console.error('❌ Title and description are required');
                console.log('Use --auto to detect from current directory, or specify manually');
                return;
            }

            await cli.submitProject(projectData);
            break;

        case 'detect':
            const detected = await cli.detectProjectInfo();
            console.log('🔍 Detected project info:');
            console.log(JSON.stringify(detected, null, 2));
            break;

        case 'logout':
            cli.config = {};
            cli.saveConfig();
            console.log('✅ Logged out');
            break;

        case 'whoami':
            if (cli.config.user) {
                console.log(`Logged in as: ${cli.config.user.username} (${cli.config.user.email})`);
            } else {
                console.log('Not logged in');
            }
            break;

        case 'help':
        default:
            cli.showHelp();
            break;
    }
}

// Run CLI
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = ClaudeCreationsCLI;