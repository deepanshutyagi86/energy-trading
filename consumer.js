/*  @file       consumer.js (FIXED for software-only demo)
*   Original authors:
*               Saurabh Gupta, Awadhut Thube, Jheel Nagaria, Ashish Kamble
*
*   Changes for single-laptop software-only demo:
*   - Removed Arduino serial port code (hardware not needed)
*   - Moved HTTP routes and socket handlers OUT of the arduino open() wrapper
*   - Changed HTTP port 3000 -> 3001 (producer already uses 3000 on same laptop)
*   - Changed main_server IP 192.168.43.50 -> localhost
*   - Uses web3.eth.accounts[1] (consumer is a different account from producer)
*   - Fixed res.sendfile -> res.sendFile with absolute path
*   - Added basic error handling
*/

// Instances //
var path = require('path');
var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();
var web3Admin = require('web3admin');

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var other_servers = require('socket.io-client');

// Main server is on the same laptop
var main_server = other_servers.connect('http://localhost:4000', {reconnect: true});

// ============================================================
// HARDWARE CODE REMOVED
// ============================================================

// Variables Declaration
var producer_address; var consumer_address;
var ether_per_token = 0; var accepted_bid;
var accept_deal_flag = 0; var block_deal_flag = 1;
var pending_tx_list = [];
var producer; var consumer;

// Smart Contract ABI (unchanged)
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
  console.log('[CONSUMER] Using contract at:', contract_address);
} catch (e) {
  console.error('[CONSUMER] ERROR: .contract-address not found. Run "node deploy.js" first.');
  process.exit(1);
}

// Web3 setup
web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));
try { web3Admin.extend(web3); } catch (e) { console.log('[CONSUMER] web3Admin extend skipped (expected on Ganache)'); }
// Consumer uses accounts[1] - DIFFERENT from producer's accounts[0]
web3.eth.defaultAccount = web3.eth.accounts[1];

// Contract Object at Contract Address
var obj = web3.eth.contract(abi).at(contract_address);

// ============================================================
// MAIN SERVER LISTENERS (at top level)
// ============================================================
main_server.on('connect', function() {
  console.log('[CONSUMER] Connected to main server at localhost:4000');
});

main_server.on('close', function(data) {
  console.log('[SIM] Consumer: Relay OFF (stopped drawing power)');
  accept_deal_flag = 0;
  block_deal_flag = 1;
});

main_server.on('accept_deal_0', function(data) {
  producer_address = data.producer_address;
  consumer_address = data.consumer_address;
  accepted_bid = data.bid;
  console.log('[CONSUMER] Deal: producer=' + producer_address + ', consumer=' + consumer_address + ', bid=' + accepted_bid);
  if (consumer_address == web3.eth.accounts[1]) {
    console.log('[SIM] Consumer: Relay ON (started drawing power)');
    accept_deal_flag = 1;
  }
});

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
// SOCKET.IO HANDLERS (registered once at startup)
// ============================================================
io.on('connection', function(socket) {
  console.log('[CONSUMER] Browser connected via socket.io');

  socket.on('check_passphrase', function(data) {
    // On Ganache, accounts are auto-unlocked. Accept any passphrase.
    try {
      web3.personal.unlockAccount(web3.eth.accounts[1], data, 100000);
    } catch (e) {
      // Ganache doesn't need unlocking - ignore
    }
    console.log('[CONSUMER] Login accepted for accounts[1]');
    socket.emit('unlock_ethereum_account_result', true);
  });

  socket.on('startmine', function() {
    console.log('[CONSUMER] Mining is automatic on Ganache (no-op)');
  });

  socket.on('stopmine', function() {
    console.log('[CONSUMER] Mining is automatic on Ganache (no-op)');
  });

  socket.on('basic_tx', function(data) {
    try {
      var from_address = web3.eth.accounts[1];
      web3.eth.sendTransaction({from: from_address, to: data.add, value: data.val});
      console.log('[CONSUMER] Sent ' + data.val + ' wei to ' + data.add);
    } catch (e) {
      console.log('[CONSUMER] basic_tx error: ' + e.message);
    }
  });

  var walletInterval = setInterval(function() {
    try {
      var balance = web3.eth.getBalance(web3.eth.accounts[1]);
      socket.emit('pending_tx_list', {
        tx_1: pending_tx_list[0],
        tx_2: pending_tx_list[1],
        tx_3: pending_tx_list[2]
      });
      socket.emit('energy_token_balance', {
        energy: 0,        // consumer doesn't generate
        tok: 0,           // consumer doesn't hold energy tokens
        bal: balance.toString ? balance.toString() : String(balance)
      });
      pending_tx_list = web3.eth.getBlock("pending").transactions;
    } catch (e) {
      // silently swallow - usually account locked or geth not ready
    }
  }, 2000);

  socket.on('disconnect', function() {
    clearInterval(walletInterval);
    console.log('[CONSUMER] Browser disconnected');
  });
});

// ============================================================
// DEAL PAYMENTS - Consumer pays producer every 8 seconds while deal active
// ============================================================
setInterval(function() {
  if (accept_deal_flag == 1 && block_deal_flag == 1) {
    producer = producer_address;
    consumer = consumer_address;
    ether_per_token = accepted_bid;
    block_deal_flag = 2;
    console.log('[CONSUMER] Deal registered. Starting payments...');
  }
  if (accept_deal_flag == 1 && contract_address != "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE") {
    try {
      console.log('[CONSUMER] Paying ' + ether_per_token + ' wei from ' + consumer + ' to ' + producer);
      obj.send_eth(producer, ether_per_token, {
        from: consumer,
        to: contract_address,
        value: ether_per_token
      });
    } catch (e) {
      console.log('[CONSUMER] send_eth error: ' + e.message);
    }
  }
}, 8000);

// HTTP SERVER - Using port 3001 (producer already uses 3000)
http.listen(3001, function() {
  console.log('[CONSUMER] Server listening on http://localhost:3001');
});