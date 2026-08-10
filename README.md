# Friend Chat

A simple real-time chat app: create an account, log in, chat with everyone in
"General," or click a person's name to send them a private message. Online
status and typing indicators included.

## What's inside

- **Backend:** Node.js + Express + Socket.io (real-time messages)
- **Accounts:** username/password, passwords hashed with bcrypt, sessions via JWT
- **Storage:** simple JSON files in `/data` (no database server to install)
- **Frontend:** plain HTML/CSS/JS, no build step

## 1. Run it on your own computer

You need [Node.js](https://nodejs.org) installed (version 18 or newer).

```bash
cd chatapp
npm install
npm start
```

Then open **http://localhost:3000** in your browser, and sign up.

To chat with a friend on the same Wi-Fi network, find your computer's local
IP address (e.g. `192.168.1.23`) and have them visit
`http://192.168.1.23:3000` instead of `localhost`.

## 2. Chat with friends over the internet (recommended)

To chat with friends anywhere, you need to put the app on a server that's
always on. The easiest free ways to do that:

**Option A — Render.com (easiest)**
1. Create a free account at render.com and a free GitHub account if you
   don't have one.
2. Push this `chatapp` folder to a new GitHub repository.
3. In Render, click **New > Web Service**, connect your repo.
4. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
5. Deploy. Render gives you a public URL like `https://your-app.onrender.com`
   — send that link to your friends.

**Option B — Railway.app**
Same idea as Render: connect your GitHub repo, it detects Node.js
automatically, and gives you a public URL.

Either way, everyone just opens the link in a browser — no installs needed
on their end.

## 3. A couple of things worth knowing

- **Data storage:** messages and accounts are stored in flat JSON files
  under `/data`. This is fine for a small group of friends, but isn't built
  to handle heavy traffic or huge message history — if this grows into
  something bigger, swap in a real database (e.g. PostgreSQL).
- **Secret key:** the app signs login sessions with a secret key. For real
  deployment, set an environment variable `JWT_SECRET` to a long random
  string (in Render/Railway, add it under "Environment Variables"). If you
  skip this, it'll still work using a built-in default — just slightly less
  secure.
- **Passwords:** stored only as bcrypt hashes, never in plain text.

## Project structure

```
chatapp/
  server.js           # Express app + Socket.io real-time logic
  lib/
    db.js             # tiny JSON-file "database"
    auth.js           # JWT sign/verify helpers
  public/
    login.html         # sign up / log in page
    index.html         # the chat UI
    css/style.css
    js/login.js
    js/chat.js
  data/                # created automatically — users.json, messages.json
```

## Ideas for extending it

- Friend requests (only chat with people who've accepted)
- Read receipts, message editing/deleting
- Image/file sharing
- Push notifications
- Group chats beyond just "General"
