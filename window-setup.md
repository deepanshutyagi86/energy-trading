# 🪟 Windows Setup Guide

> **Read this top-to-bottom. Don't skip steps.**
> First-time setup: ~15 minutes.
> Once everything works, the "Quick Start" section at the bottom is all you need each time.

---

## 📦 Part 1 — Install the tools (one-time, ~10 min)

### 1.1 Install Node.js 18 (via nvm-windows)

Why Node 18 specifically? The blockchain library used in this project (`web3@0.20.7`) was written in 2017 and breaks on Node 20+. Using `nvm-windows` means you can have multiple Node versions without conflicts.

1. Download **nvm-setup.exe** from [nvm-windows releases](https://github.com/coreybutler/nvm-windows/releases) (get the latest release).
2. Run the installer. Accept all defaults.
3. Open **PowerShell as Administrator** (right-click Start menu → "Terminal (Admin)" or "Windows PowerShell (Admin)").
4. In PowerShell, run:
   ```powershell
   nvm install 18.20.4
   nvm use 18.20.4
   node --version
   ```
5. Expected output: `v18.20.4`

> ⚠️ If `nvm` is not recognized, close PowerShell and reopen it as Admin.

### 1.2 Install Git

1. Download from [git-scm.com/download/win](https://git-scm.com/download/win).
2. Run installer, accept all defaults.
3. Verify in PowerShell (any window):
   ```powershell
   git --version
   ```
   Should print something like `git version 2.x.x`.

---

## 📥 Part 2 — Get the project (~1 min)

Open a regular PowerShell window (not admin) and run:

```powershell
cd $HOME\Documents
git clone <YOUR_REPO_URL_HERE>
cd energy-trading
```

Replace `<YOUR_REPO_URL_HERE>` with the actual GitHub URL (e.g. `https://github.com/deepanshutyagi/energy-trading.git`).

Verify the files are there:
```powershell
dir
```
You should see `producer.js`, `consumer.js`, `server.js`, `deploy.js`, `contract.sol`, `package.json`, the 3 HTML files, and the `public` folder.

---

## 📦 Part 3 — Install project dependencies (~2 min)

Make sure you're in the project folder, then:

```powershell
node --version
```
Must show `v18.x.x`. If it shows something else, run `nvm use 18.20.4`.

Then:
```powershell
npm install
```

You'll see warnings about deprecated packages and "vulnerabilities" — **ignore them all**. They're from the 2016-era libraries this project uses. As long as you don't see red `npm ERR!` at the end, you're good.

Expected end: `added N packages, and audited N packages`.

> ❗ **DO NOT run `npm audit fix`** — it will break things.

### 3.1 If you hit errors during `npm install`

**Error mentioning `node-gyp`, `python`, or `Visual Studio`:**

You need C++ build tools. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/):
1. Download "Build Tools for Visual Studio"
2. Run the installer
3. Check "Desktop development with C++" workload
4. Install (~5 GB)
5. Retry `npm install`

**Error about a specific package version not existing:**

Send a screenshot of the full error — we'll fix the version in `package.json`.

---

## 🚀 Part 4 — First-time run (~5 min)

You'll need **5 PowerShell windows** open at once. Each one must be in the project folder. Here's how to open a new window:
- Easy way: press **Windows + Terminal** icon, then **Ctrl+Shift+T** for each new tab.
- Or: right-click in the project folder → "Open in Terminal".

In **every** new PowerShell window, first run:
```powershell
cd $HOME\Documents\energy-trading
nvm use 18.20.4
```

### 🪟 Window 1 — Ganache (local blockchain)

```powershell
npx ganache --deterministic --chain.chainId 1337 --miner.blockTime 0
```

Flags explained:
- `--deterministic` — always generates the same 10 accounts. This means your blockchain has predictable addresses (same on every machine, every run).
- `--chain.chainId 1337` — custom chain ID for local dev.
- `--miner.blockTime 0` — mine blocks instantly when a transaction comes in.

You'll see output like:
```
Available Accounts
==================
(0) 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 (1000 ETH)
(1) 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 (1000 ETH)
(2) 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b (1000 ETH)
...

RPC Listening on 0.0.0.0:8545
```

**Write these down somewhere** (or keep the window visible):
- **Producer account** (accounts[0]): `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
- **Consumer account** (accounts[1]): `0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0`

**Leave this window running. Don't close it or press Ctrl+C.**

### 🪟 Window 2 — Deploy the smart contract (one-time)

```powershell
node deploy.js
```

Expected:
```
Connecting to Ganache at http://127.0.0.1:8545 ...
Deploying from: 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
Tx submitted: 0x...
================================================
Contract deployed at: 0x...
================================================
Saved to .contract-address
```

This creates a file called `.contract-address` that the other servers read at startup.

> ⚠️ You only need to do this **once per Ganache session**. If you stop and restart Ganache, you must re-run `node deploy.js` because Ganache's blockchain state resets.

### 🪟 Window 3 — Main marketplace server

```powershell
node server.js
```

Expected: `[MAIN SERVER] Marketplace listening on http://localhost:4000`

### 🪟 Window 4 — Producer

```powershell
node producer.js
```

Expected:
```
[PRODUCER] Using contract at: 0x...
[PRODUCER] Server listening on http://localhost:3000
[PRODUCER] Connected to main server at localhost:4000
[SIM] Producer generated 1 kWh. Total: 1
[SIM] Producer generated 1 kWh. Total: 2
```

### 🪟 Window 5 — Consumer

```powershell
node consumer.js
```

Expected:
```
[CONSUMER] Using contract at: 0x...
[CONSUMER] Server listening on http://localhost:3001
[CONSUMER] Connected to main server at localhost:4000
```

---

## 🌐 Part 5 — Run the demo (~3 min)

Open **3 browser tabs** in Chrome / Firefox / Edge:

| Tab | URL | Role |
|-----|-----|------|
| Tab A | http://localhost:3000 | **Producer** login/wallet |
| Tab B | http://localhost:3001 | **Consumer** login/wallet |
| Tab C | http://localhost:4000 | **Marketplace** (shared) |

### 5.1 Log in both wallets

**Tab A (Producer):**
- Click the "Login to Ethereum Wallet" dropdown (top right)
- Enter any passphrase (e.g. `abc`)
- Click Submit
- Page redirects to `/enter_wallet`

You should see:
- **Energy tokens** — going up as blockchain records your kWh
- **Current Generation (kWh)** — counter increments every 5 sec
- **Account Balance (wei)** — ~1000 ETH (the number `1e+21` or similar)

**Tab B (Consumer):**
- Same login process. Any passphrase. Submit.
- See 0 tokens, 0 kWh, ~1000 ETH balance.

> 💡 Any passphrase works because Ganache auto-unlocks all accounts. On a real blockchain you'd need the actual account password.

### 5.2 Producer lists energy for sale

In **Tab A**, click **"Go to Energy Marketplace"** (top right nav).

- Click the green **SELL** button
- **Producer address**: paste `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` (the producer's account from Window 1)
- **Base bid**: `5` (5 wei — tiny amount, easy to see changes)
- Click **Submit**

A card should appear showing the producer's address, bid = 5, and the current energy tokens available.

### 5.3 Consumer bids

In **Tab B**, click **"Go to Energy Marketplace"**.

- Click the blue **BUY** button
- **Consumer address**: paste `0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0` (the consumer's account)
- Click **Submit**
- Now click the **Bid** button on the card showing the producer's listing

The bid jumps from 5 → 6 wei. Buyer address now appears on the card.

### 5.4 Wait 5 seconds — deal auto-closes

After 5 seconds of no new bids, the marketplace auto-closes the deal. Check your terminal windows:

- **Window 3 (server.js):** `[MAIN SERVER] Deal 0 closed: producer=..., consumer=..., bid=6`
- **Window 4 (producer.js):** `[SIM] Producer: Relay ON (started supplying power)`
- **Window 5 (consumer.js):** `[SIM] Consumer: Relay ON (started drawing power)` followed by `[CONSUMER] Paying 6 wei from ... to ...`

Every 8 seconds, consumer.js calls the smart contract's `send_eth()` function, transferring 6 wei from consumer to producer.

### 5.5 Watch the balances change

- **Tab A** (producer wallet): balance **increases** by 6 wei every 8 sec
- **Tab B** (consumer wallet): balance **decreases** by 6 wei every 8 sec (plus a little gas for each transaction)

### 5.6 Stop the deal

On the marketplace (Tab C, or the marketplace view from either wallet), click **"Close connection"**.

Terminal logs show `[SIM] Relay OFF` in both producer and consumer. Payments stop.

**🎉 That's one complete trade cycle. Your demo is working.**

---

## 🛑 How to shut everything down

When done, in each PowerShell window press **Ctrl+C**. That cleanly stops each process. Then close the windows.

---

## ⚡ Quick Start (for subsequent runs after first-time setup)

Once everything is installed and verified working, starting the demo again takes 30 seconds:

```powershell
cd $HOME\Documents\energy-trading
nvm use 18.20.4
```

Then open 5 PowerShell windows (in the project folder) and run one of these in each:

| Window | Command |
|--------|---------|
| 1 | `npx ganache --deterministic --chain.chainId 1337 --miner.blockTime 0` |
| 2 | `node deploy.js` *(runs once, exits when done)* |
| 3 | `node server.js` |
| 4 | `node producer.js` |
| 5 | `node consumer.js` |

Then open browser tabs: `localhost:3000`, `localhost:3001`, `localhost:4000`.

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `node` is not recognized | Run `nvm use 18.20.4`. If that fails, restart PowerShell. |
| `npm install` fails with node-gyp errors | Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with "Desktop development with C++" workload. |
| `deploy.js` says "Cannot connect to Ganache" | Is Ganache actually running in Window 1? Scroll up to see if it crashed. Run `netstat -ano | findstr :8545` to check. |
| Port 3000/3001/4000 already in use | Another process is using it. Kill it: `Get-NetTCPConnection -LocalPort 3000 \| Select-Object OwningProcess`, then `Stop-Process -Id <pid>`. |
| Servers say "ERROR: .contract-address not found" | You skipped Window 2. Run `node deploy.js` first, then restart the server that errored. |
| Browser page is unstyled / shows broken images | CSS/images aren't critical for functionality. Just refresh; if it persists, check the `public` folder exists. |
| "Wrong passphrase" on login | On Ganache any passphrase works. If you see this, it means socket.io isn't connecting. Check Window 4 or 5 for errors. |
| Balance never changes after a deal | The deal didn't close properly. Check Window 3 for "Deal 0 closed" log. If missing, you probably didn't click Bid. |
| Everything was working, now it's not | Easy fix: Ctrl+C everything, close windows, start fresh from the Quick Start. The blockchain resets every time Ganache restarts, so re-run `node deploy.js` too. |

---

## 🤔 Why do I have to re-deploy the contract every time?

Because Ganache's blockchain lives entirely in RAM by default. When you stop Ganache, the blockchain (including the deployed contract) is gone. `deploy.js` takes 2 seconds, so we don't bother with persistence.

If you want persistence: add `--database.dbPath ./chain-data` to the Ganache command. Then `.contract-address` remains valid across restarts. (Not recommended for a demo — a fresh blockchain every time is cleaner.)

---

## 📞 Getting help

If something doesn't work, the full error message from the terminal is the most useful thing to share. Screenshot or copy the last 20 lines of whatever window crashed.