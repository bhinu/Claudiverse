# Claudiverse

An anonymous, real-time community chat for students in the same lecture hall. Post unspoken thoughts, watch them map themselves across a live semantic field, and discover who else in the room thinks like you.

Built for hackathons. Powered by Claude.

---

## What it does

Students join a room by code (e.g. `JADE-7`) or by scanning nearby rooms via geolocation. Each post is analyzed by Claude Haiku, which:

1. Places it on a 2D semantic map (Personal ↔ Societal, Fear ↔ Hope axes)
2. Detects its sentiment and assigns a category label
3. Draws glowing neon bridges between posts that are semantically close

Clicking a bridge generates a casual conversation starter between the two connected ideas, and opens a small real-time chat tied to that specific connection — so the two people who posted those thoughts can actually talk.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Graph | react-force-graph-2d |
| AI | Anthropic SDK — `claude-haiku-4-5-20251001` |
| Storage | File-based JSON (`.latent-rooms.json`, `.latent-bridges.json`) |

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/your-username/claudiverse.git
cd claudiverse
npm install
```

### 2. Add your Anthropic API key

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to demo

1. Open two browser tabs (or two devices on the same network pointing at your machine)
2. Create a room in one tab, join with the code in the other
3. Post a few thoughts in each tab — related topics cluster closer together
4. Once two nodes are close enough, an orange bridge line appears between them
5. Click the bridge → get a conversation starter + a live chat between those two posts

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                        # Landing / join screen
│   ├── room/[roomId]/                  # Room view
│   │   ├── page.tsx                    # Server component
│   │   └── RoomShell.tsx               # Client shell (map + chat panel)
│   └── api/
│       ├── generate-bridge/            # POST — AI conversation starter
│       ├── process-truth/              # POST — AI semantic analysis
│       └── room/[roomId]/
│           ├── poll/                   # GET  — delta message polling
│           ├── post/                   # POST — submit a truth
│           ├── resonate/               # POST — react to a message
│           └── bridge/[bridgeId]/      # GET/POST — bridge chat messages
├── components/
│   ├── ForceGraphMap.tsx               # Canvas graph (nodes + bridges)
│   ├── BridgeModal.tsx                 # Conversation starter + chat modal
│   ├── ChatFeed.tsx                    # Right-panel message list
│   ├── TruthComposer.tsx               # Post input
│   ├── RoomHeader.tsx                  # Room name, code, presence count
│   └── JoinScreen.tsx                  # Create / join room UI
├── context/
│   └── RoomContext.tsx                 # Global state + polling
└── lib/
    ├── types.ts                        # Shared TypeScript interfaces
    ├── room-store.ts                   # File-based persistence
    ├── similarity.ts                   # Edge computation from coords
    ├── analyze-truth.ts                # Shared AI analysis logic
    └── identity.ts                     # Anonymous identity generation
```

---

## Architecture notes

**Why file-based storage?**
Next.js runs route handlers in isolated worker threads that don't share in-memory state. A shared JSON file on disk is the simplest way to make all workers see the same data without adding Redis or a database.

**Why polling instead of SSE?**
Same reason — SSE streams live in one worker and other workers can't push events to them. Polling every 3 seconds with delta requests (`?after=N`) keeps it snappy without a message broker.

**How the semantic map works:**
Claude returns `[x, y]` coordinates (0–100 scale) placing each post on two axes: Personal↔Societal and Fear↔Hope. Euclidean distance in that space determines similarity. Posts within ~53 units (similarity ≥ 0.62) get a bridge drawn between them.

---

## License

MIT
