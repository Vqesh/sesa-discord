# Sesa - Secret Santa Discord Bot

A Discord bot for organizing and automating Secret Santa gift exchanges within Discord servers.

## Features

- Create and manage Secret Santa events
- Automated random matching with derangement algorithm (ensures no self-assignments)
- Private DM delivery of match assignments
- Event organizer controls (create, start, cancel)
- Participant management (join/leave before event starts)
- Minimum 3 participants required for fairness

## Tech Stack

- **TypeScript** - Type-safe development
- **Discord.js v14** - Discord API interaction
- **Node.js** - Runtime environment
- **JSON Storage** - Persistent data storage

## Commands

- `/secretsanta create <name>` - Create a new Secret Santa event
- `/secretsanta join` - Join the current event
- `/secretsanta leave` - Leave before the event starts
- `/secretsanta start` - Assign matches and send DMs (organizer only)
- `/secretsanta status` - View event details and participants
- `/secretsanta cancel` - Cancel the event (organizer only)

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required credentials:
   ```
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id
   ```
4. Deploy commands: `npm run deploy`
5. Start the bot: `npm run dev`

## Project Structure

```
src/
├── commands/
│   └── secretsanta.ts    # Main command logic
├── utils/
│   ├── matching.ts       # Random assignment algorithm
│   └── storage.ts        # Data persistence
├── index.ts              # Bot entry point
└── deploy-commands.ts    # Command registration
```
