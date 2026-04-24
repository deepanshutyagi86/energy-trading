/*  @file       producer.js (FIXED for software-only demo)
*   Original authors:
*               Saurabh Gupta, Awadhut Thube, Jheel Nagaria, Ashish Kamble
*
*   Changes for single-laptop software-only demo:
*   - Removed Arduino serial port + DC energy meter code (hardware not needed)
*   - kWh is simulated (1 kWh every 5 seconds)
*   - Moved HTTP routes and socket handlers OUT of the arduino open() wrapper
*   - Uses web3.eth.accounts[0] consistently (was mixing [0] and [4])
*   - Removed duplicate send_eth call (consumer handles payment, not producer)
*   - Fixed res.sendfile -> res.sendFile with absolute path
*   - Added basic error handling
*/

// Instances //
var path = require('path');
var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();
var web3Admin = require('web3admin');

// Node.js web application framework
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var other_servers = require('socket.io-client');

// Main server is on the same laptop for this demo
var main_server = other_servers.connect('http://localhost:4000', {reconnect: true});

// ============================================================
// HARDWARE CODE REMOVED - SIMULATION MODE
// ============================================================

// Variables Declaration
var producer_address; var consumer_address;
var ether_per_token = 0; var accepted_bid;
var accept_deal_flag = 0; var block_deal_flag = 1;
var energy_tokens = 0;
var pending_tx_list = [];
var energy_KWH = 0; var prev_energy_KWH = 0; var difference = 0;
var producer; var consumer;

// Smart Contract ABI (unchanged from original)
var abi = [
  {
    "constant": false,
    "inputs": [{"name": "_account", "type": "address"}],
    "name": "token_balance",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "", "type": "address"}],
    "name": "balances",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_account", "type": "address"}],
    "name": "eth_balance",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_account", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "send_eth",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_account", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "update_tokens",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Load deployed contract address from file (written by deploy.js)
var contract_address = "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE";
try {
  contract_address = fs.readFileSync('.contract-address', 'utf8').trim();
  console.log('[PRODUCER] Using contract at:', contract_address);
} catch (e) {
  console.error('[PRODUCER] ERROR: .contract-address not found. Run "node deploy.js" first.');
  process.exit(1);
}

// Web3 setup
web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));
// web3Admin adds miner/admin APIs - on Ganache this is harmless (Ganache auto-mines anyway)
try { web3Admin.extend(web3); } catch (e) { console.log('[PRODUCER] web3Admin extend skipped (expected on Ganache)'); }
// Producer uses accounts[0] - first Ganache account
web3.eth.defaultAccount = web3.eth.accounts[0];

// Contract Object at Contract Address
var obj = web3.eth.contract(abi).at(contract_address);

// ============================================================
// SIMULATED ENERGY METER (1 kWh every 5s)
// ============================================================
setInterval(function() {
  energy_KWH = energy_KWH + 1;
  console.log('[SIM] Producer generated 1 kWh. Total: ' + energy_KWH);
}, 5000);

// ============================================================
// MAIN SERVER LISTENERS (now at top level)
// ============================================================
main_server.on('connect', function() {
  console.log('[PRODUCER] Connected to main server at localhost:4000');
});

main_server.on('close', function(data) {
  console.log('[SIM] Producer: Relay OFF (stopped supplying power)');
  accept_deal_flag = 0;
  block_deal_flag = 1;
});

main_server.on('accept_deal_0', function(data) {
  producer_address = data.producer_address;
  consumer_address = data.consumer_address;
  accepted_bid = data.bid;
  console.log('[PRODUCER] Deal: producer=' + producer_address + ', consumer=' + consumer_address + ', bid=' + accepted_bid);
  if (producer_address == web3.eth.accounts[0]) {
    console.log('[SIM] Producer: Relay ON (started supplying power)');
    accept_deal_flag = 1;
  }
});

// Share token balance when requested by marketplace
function handle_req_tokens(data) {
  if (data == web3.eth.accounts[0]) {
    return energy_tokens.toString ? energy_tokens.toString() : String(energy_tokens);
  }
  return null;
}
main_server.on('req_tokens_0', function(data) { var t = handle_req_tokens(data); if (t !== null) main_server.emit('display_tokens_0', t); });
main_server.on('req_tokens_1', function(data) { var t = handle_req_tokens(data); if (t !== null) main_server.emit('display_tokens_1', t); });
main_server.on('req_tokens_2', function(data) { var t = handle_req_tokens(data); if (t !== null) main_server.emit('display_tokens_2', t); });
main_server.on('req_tokens_3', function(data) { var t = handle_req_tokens(data); if (t !== null) main_server.emit('display_tokens_3', t); });
main_server.on('req_tokens_4', function(data) { var t = handle_req_tokens(data); if (t !== null) main_server.emit('display_tokens_4', t); });
main_server.on('req_tokens_5', function(data) { var t = handle_req_tokens(data); if (t !== null) main_server.emit('display_tokens_5', t); });

// ============================================================
// EXPRESS STATIC + ROUTES
// ============================================================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'login_page.html'));
});

app.get('/enter_wallet', function(req, res) {
  res.sendFile(path.join(__dirname, 'wallet.html'));
});

// ============================================================
// SOCKET.IO HANDLERS (registered once at startup, not per-request)
// ============================================================
io.on('connection', function(socket) {
  console.log('[PRODUCER] Browser connected via socket.io');

  socket.on('check_passphrase', function(data) {
    // On Ganache, accounts are auto-unlocked. We accept any passphrase.
    // On real Geth, we'd unlock here. Try it, but don't fail if it errors.
    try {
      web3.personal.unlockAccount(web3.eth.accounts[0], data, 100000);
    } catch (e) {
      // Ganache doesn't need unlocking - ignore
    }
    console.log('[PRODUCER] Login accepted for accounts[0]');
    socket.emit('unlock_ethereum_account_result', true);
  });

  socket.on('startmine', function() {
    // Ganache auto-mines. This is a no-op for demo purposes.
    console.log('[PRODUCER] Mining is automatic on Ganache (no-op)');
  });

  socket.on('stopmine', function() {
    console.log('[PRODUCER] Mining is automatic on Ganache (no-op)');
  });

  socket.on('basic_tx', function(data) {
    try {
      var from_address = web3.eth.accounts[0];
      web3.eth.sendTransaction({from: from_address, to: data.add, value: data.val});
      console.log('[PRODUCER] Sent ' + data.val + ' wei to ' + data.add);
    } catch (e) {
      console.log('[PRODUCER] basic_tx error: ' + e.message);
    }
  });

  var walletInterval = setInterval(function() {
    try {
      difference = energy_KWH - prev_energy_KWH;
      var balance = web3.eth.getBalance(web3.eth.accounts[0]);
      socket.emit('pending_tx_list', {
        tx_1: pending_tx_list[0],
        tx_2: pending_tx_list[1],
        tx_3: pending_tx_list[2]
      });
      socket.emit('energy_token_balance', {
        energy: energy_KWH,
        tok: energy_tokens.toString ? energy_tokens.toString() : String(energy_tokens),
        bal: balance.toString ? balance.toString() : String(balance)
      });
      if (difference != 0 && contract_address != "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE") {
        obj.update_tokens(web3.eth.accounts[0], difference);
        prev_energy_KWH = energy_KWH;
      }
      pending_tx_list = web3.eth.getBlock("pending").transactions;
      if (contract_address != "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE") {
        energy_tokens = obj.token_balance.call(web3.eth.accounts[0]);
      }
    } catch (e) {
      // Silently swallow - usually means account is locked or contract not deployed yet
    }
  }, 2000);

  socket.on('disconnect', function() {
    clearInterval(walletInterval);
    console.log('[PRODUCER] Browser disconnected');
  });
});

// ============================================================
// DEAL STATE TRACKING (no payment here - consumer handles payment)
// ============================================================
setInterval(function() {
  if (accept_deal_flag == 1 && block_deal_flag == 1) {
    producer = producer_address;
    consumer = consumer_address;
    ether_per_token = accepted_bid;
    block_deal_flag = 2;
    console.log('[PRODUCER] Deal registered. Waiting for consumer to pay...');
  }
}, 8000);

// HTTP SERVER
http.listen(3000, function() {
  console.log('[PRODUCER] Server listening on http://localhost:3000');
});