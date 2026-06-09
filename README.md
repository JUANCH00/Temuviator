# 🛩️ Aviator Game — Deployment Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [LAN Environment Testing](#lan-environment-testing)
- [Troubleshooting](#troubleshooting)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## 🎮 Overview

Aviator Game is a real-time multiplayer application that simulates a crash-style betting game. The system is designed for high availability using:

- **MongoDB Replica Set** (3 nodes) for data persistence
- **Redis** for pub/sub and real-time state management
- **Scalable Node.js backend** with multiple instances
- **React frontend** with WebSocket for real-time communication

---

## 📦 Prerequisites

### Required Software

- **Docker Desktop** (v20.10+) with Docker Compose
- **Node.js** (v18+) and npm (v9+)
- **Git** to clone the repository
- **Text editor** (VS Code recommended)

### System Requirements

- **RAM**: 8 GB minimum (16 GB recommended)
- **CPU**: 4 cores (8 recommended)
- **Disk**: 10 GB free space
- **Network**: Stable LAN connection

---

## ⚙️ Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/aviator-game.git
cd aviator-game
```

### 2. Configure MongoDB Replica Set

#### 2.1 Create Persistence Directories

**Windows:**
```bash
mkdir C:\mongo\replica1
mkdir C:\mongo\replica2
mkdir C:\mongo\replica3
```

**Linux/Mac:**
```bash
mkdir -p ~/mongo/replica1
mkdir -p ~/mongo/replica2
mkdir -p ~/mongo/replica3
```

#### 2.2 Create Docker Network

```bash
docker network create mongoCluster
```

#### 2.3 Start MongoDB Containers

**Windows:**
```bash
docker run -d -p 27017:27017 --name mongo1 --network mongoCluster ^
  -v C:\mongo\replica1:/data/db ^
  mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo1

docker run -d -p 27018:27017 --name mongo2 --network mongoCluster ^
  -v C:\mongo\replica2:/data/db ^
  mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo2

docker run -d -p 27019:27017 --name mongo3 --network mongoCluster ^
  -v C:\mongo\replica3:/data/db ^
  mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo3
```

**Linux/Mac:**
```bash
docker run -d -p 27017:27017 --name mongo1 --network mongoCluster \
  -v ~/mongo/replica1:/data/db \
  mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo1

docker run -d -p 27018:27017 --name mongo2 --network mongoCluster \
  -v ~/mongo/replica2:/data/db \
  mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo2

docker run -d -p 27019:27017 --name mongo3 --network mongoCluster \
  -v ~/mongo/replica3:/data/db \
  mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo3
```

#### 2.4 Initialize Replica Set

```bash
docker exec -it mongo1 mongosh
```

Inside the MongoDB shell:
```javascript
rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
})
```

Wait a few seconds, then verify:
```javascript
rs.status()
```

Exit the shell:
```javascript
exit
```

#### 2.5 Configure Hosts (Windows)

Edit `C:\Windows\System32\drivers\etc\hosts` as **Administrator**:

```
127.0.0.1   mongo1
127.0.0.1   mongo2
127.0.0.1   mongo3
```

**Linux/Mac** — edit `/etc/hosts`:
```bash
sudo nano /etc/hosts
```

Add the same lines.

### 3. Configure Redis

```bash
docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
```

### 4. Verify Containers

```bash
docker ps
```

You should see 4 running containers:
- mongo1, mongo2, mongo3
- redis-stack-server

---

## 🚀 Step-by-Step Deployment

### Backend

#### 1. Configure Environment Variables

Create `backend/.env`:

```env
# MongoDB Configuration
MONGO_URI=mongodb://mongo1:27017,mongo2:27018,mongo3:27019/aviator_game?replicaSet=myReplicaSet

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Game Configuration (in milliseconds)
WAIT_TIME=5000
TICK_INTERVAL=100
POST_CRASH_WAIT=3000
```

#### 2. Install Dependencies

```bash
cd backend
npm install
```

#### 3. Start Backend Servers

**Terminal 1 — Primary Server (Port 3001):**
```bash
npm start 3001
```

**Terminal 2 — Secondary Server (Port 3002):**
```bash
npm start 3002
```

Expected output:
```
✅ Connected to MongoDB Cluster
✅ Connected to Redis
🚀 Aviator server listening on port 3001
📊 Role: PRIMARY (manages rounds)
```

### Frontend

#### 1. Configure WebSocket

Edit `frontend/src/utils/constants.js`:

```javascript
export const WS_CONFIG = {
  URL: 'ws://192.168.1.100:8080', // Replace with your LAN IP
  RECONNECT_DELAY: 3000
};
```

#### 2. Install Dependencies

```bash
cd frontend
npm install
```

#### 3. Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

#### 4. Production Build

```bash
npm run build
```

Compiled files will be in `frontend/build`

---

## 🌐 LAN Environment Testing

### Load Balancer Configuration (Nginx)

#### 1. Install Nginx

**Windows:** Download from [nginx.org](http://nginx.org/en/download.html)

**Linux:**
```bash
sudo apt-get install nginx
```

**Mac:**
```bash
brew install nginx
```

#### 2. Configure nginx.conf

Create or edit the configuration file:

```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include mime.types;

    upstream nodejs_cluster {
        least_conn;
        server 127.0.0.1:3001;
        server 127.0.0.1:3002;
        server 127.0.0.1:3003;
    }

    server {
        listen 8080;
        server_name localhost;

        location / {
            proxy_pass http://nodejs_cluster;
            proxy_http_version 1.1;

            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_connect_timeout 7d;
            proxy_send_timeout 7d;
            proxy_read_timeout 7d;
            proxy_buffering off;
        }
    }
}
```

#### 3. Start Nginx

**Windows:**
```bash
nginx.exe
```

**Linux:**
```bash
sudo nginx
```

**Mac:**
```bash
nginx
```

### Get LAN IP

**Windows:**
```bash
ipconfig
```

**Linux/Mac:**
```bash
ifconfig
```

Look for your local IP (e.g. `192.168.1.100`)

### Access from Other Devices

1. On the same LAN, open a browser
2. Navigate to: `http://192.168.1.100:5173`
3. Each client receives a unique `clientId`
4. Clients synchronize in real time

---

## 🧪 Testing Guide

### Test 1: Basic Connection

1. Open the application in the browser
2. Verify that "🟢 Connected" appears
3. Verify initial balance of $1,000

### Test 2: Place a Bet

1. Wait for the "Waiting for next round..." phase
2. Enter an amount (e.g. $100)
3. Click "Bet"
4. Verify that the balance decreases

### Test 3: Successful Cashout

1. Place a bet during the waiting phase
2. Wait for the flight to begin
3. Click "Cash Out" when the multiplier is > 1.5x
4. Verify the winnings in the balance

### Test 4: Crash Test

1. Place a bet
2. Do NOT cash out
3. Wait for the plane to crash
4. Verify that the bet is lost

### Test 5: Multiple Clients

1. Open 3 different browsers
2. Place bets in each one
3. Verify they appear under "Active Bettors"
4. Cash out at different moments
5. Verify they appear under "Recent Cashouts"

### Test 6: MongoDB Failover

```bash
# Stop a backend node
docker stop mongo3

# Verify the system keeps running
# A secondary node will be promoted automatically
```

### Test 7: Backend Scalability

```bash
# Start an additional server
npm start 3003

# Update nginx.conf to include it
# Verify load balancing
```

---

## 📊 Monitoring and Maintenance

### Check System Status

```bash
# MongoDB Replica Set status
docker exec -it mongo1 mongosh --eval "rs.status()"

# Backend logs
tail -f backend/logs/app.log

# Container status
docker stats
```

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

**Built with ❤️ to learn about real-time distributed systems**
