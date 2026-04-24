# ⚡ Peer-to-Peer Energy Trading on Blockchain

A college project demonstrating P2P energy trading between a producer and consumer, with all transactions recorded on a local Ethereum blockchain via a custom smart contract.

**Software-only demo** — no hardware required. One laptop, multiple browser tabs, fully self-contained.

---

## 📖 What it does

1. A **producer** (house with solar panels) generates electricity. This is simulated at **1 kWh every 5 seconds**.
2. For every kWh produced, the producer gets an **"energy token"** recorded on the blockchain via a smart contract.
3. The producer lists energy on a **marketplace** with a base bid price.
4. A **consumer** (house without power) bids on the listing.
5. After a 5-second timeout with no new bid, the deal is auto-closed.
6. Every 8 seconds while the deal is active, the consumer **automatically pays** the producer in Ether through the smart contract.
7. Either party can click "Close connection" to end the deal.

## 🧩 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     ONE LAPTOP                          │
│                                                         │
│  🔗 Ganache (local Ethereum blockchain, port 8545)      │
│       ├─ 10 pre-funded accounts (1000 ETH each)         │
│       └─ Smart contract deployed (tracks tokens/ether)  │
│                                                         │
│  🖥️  server.js      (marketplace      :4000)            │
│  🏭 producer.js    (producer wallet   :3000)            │
│  🛒 consumer.js    (consumer wallet   :3001)            │
│                                                         │
│  🌐 3 browser tabs:                                     │
│       localhost:3000  →  producer UI                    │
│       localhost:3001  →  consumer UI                    │
│       localhost:4000  →  marketplace                    │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Setup

- **Windows users:** follow [`SETUP_WINDOWS.md`](./SETUP_WINDOWS.md)
- **macOS/Linux users:** follow [`SETUP_MAC.md`](./SETUP_MAC.md) *(same steps, different commands)*

First-time setup takes ~15 minutes. After that, starting the demo is a 30-second routine (see the "Quick start" section in either setup guide).

## 📂 Project structure

```
├── server.js              Main marketplace (matchmaker + auction)
├── producer.js            Producer's wallet server
├── consumer.js            Consumer's wallet server
├── deploy.js              Deploys the smart contract to Ganache
├── contract.sol           Solidity smart contract source
├── package.json           Node.js dependencies
│
├── login_page.html        Login UI
├── wallet.html            Wallet dashboard UI
├── energy_marketplace.html Marketplace / auction UI
│
└── public/                Styles, fonts, images (bootstrap + custom CSS)
```

## 🛠️ Tech stack

- **Node.js 18** — backend runtime
- **web3.js 0.20.7** — talks to the blockchain
- **Ganache 7** — local Ethereum blockchain (auto-mining, pre-funded accounts)
- **Solidity 0.4.11** — smart contract language
- **Socket.IO 2** — real-time browser ↔ server communication
- **Express 4** — web server framework

## 📜 Credits

**Original authors:**
Saurabh Gupta, Awadhut Thube, Jheel Nagaria, Ashish Kamble — CoE-CNDS, VJTI

**Project modernization for software-only demo:** Deepanshu Tyagi, 2026

## 📄 License

See [LICENSE](./LICENSE) file.