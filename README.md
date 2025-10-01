# 🛩️ Aviator Game - Documentación de Despliegue

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Requisitos Previos](#requisitos-previos)
- [Configuración del Entorno](#configuración-del-entorno)
- [Despliegue Paso a Paso](#despliegue-paso-a-paso)
- [Pruebas en Entorno LAN](#pruebas-en-entorno-lan)
- [Solución de Problemas](#solución-de-problemas)
- [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## 🎮 Descripción General

Aviator Game es una aplicación multiplayer en tiempo real que simula un juego de apuestas estilo "crash game". El sistema está diseñado con alta disponibilidad utilizando:

- **MongoDB Replica Set** (3 nodos) para persistencia de datos
- **Redis** para pub/sub y estado en tiempo real
- **Backend Node.js** escalable con múltiples instancias
- **Frontend React** con WebSocket para comunicación en tiempo real

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTORNO LAN                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Cliente 1   │         │   Cliente 2   │                 │
│  │  (Browser)    │         │  (Browser)    │                 │
│  └───────┬───────┘         └───────┬───────┘                 │
│          │                         │                         │
│          │    WebSocket (8080)     │                         │
│          └─────────┬───────────────┘                         │
│                    │                                         │
│          ┌─────────▼──────────┐                              │
│          │   Load Balancer    │                              │
│          │   (Nginx/HAProxy)  │                              │
│          └─────────┬──────────┘                              │
│                    │                                         │
│          ┌─────────┴──────────┐                              │
│          │                    │                              │
│    ┌─────▼─────┐      ┌──────▼──────┐                       │
│    │ Backend 1 │      │  Backend 2  │                       │
│    │ (Master)  │      │  (Slave)    │                       │
│    │ Port 3001 │      │  Port 3002  │                       │
│    └─────┬─────┘      └──────┬──────┘                       │
│          │                   │                               │
│          └─────────┬─────────┘                               │
│                    │                                         │
│          ┌─────────▼──────────┐                              │
│          │       Redis        │                              │
│          │    Port 6379       │                              │
│          └─────────┬──────────┘                              │
│                    │                                         │
│          ┌─────────▼──────────────────────┐                  │
│          │   MongoDB Replica Set          │                  │
│          │  ┌───────┐ ┌───────┐ ┌───────┐│                  │
│          │  │mongo1 │ │mongo2 │ │mongo3 ││                  │
│          │  │PRIMARY│ │ SEC   │ │ SEC   ││                  │
│          │  │:27017 │ │:27018 │ │:27019 ││                  │
│          │  └───────┘ └───────┘ └───────┘│                  │
│          └────────────────────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Requisitos Previos

### Software Necesario

- **Docker Desktop** (v20.10+) con Docker Compose
- **Node.js** (v18+) y npm (v9+)
- **Git** para clonar el repositorio
- **Editor de texto** (VS Code recomendado)

### Requisitos del Sistema

- **RAM**: Mínimo 8GB (16GB recomendado)
- **CPU**: 4 núcleos (8 recomendado)
- **Disco**: 10GB de espacio libre
- **Red**: Conexión LAN estable

---

## ⚙️ Configuración del Entorno

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/aviator-game.git
cd aviator-game
```

### 2. Configurar MongoDB Replica Set

#### 2.1 Crear Directorios de Persistencia

**En Windows:**
```bash
mkdir C:\mongo\replica1
mkdir C:\mongo\replica2
mkdir C:\mongo\replica3
```

**En Linux/Mac:**
```bash
mkdir -p ~/mongo/replica1
mkdir -p ~/mongo/replica2
mkdir -p ~/mongo/replica3
```

#### 2.2 Crear Red Docker

```bash
docker network create mongoCluster
```

#### 2.3 Iniciar Contenedores MongoDB

**En Windows:**
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

**En Linux/Mac:**
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

#### 2.4 Inicializar Replica Set

```bash
docker exec -it mongo1 mongosh
```

Dentro del shell de MongoDB:
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

Esperar unos segundos y verificar:
```javascript
rs.status()
```

Salir del shell:
```javascript
exit
```

#### 2.5 Configurar Hosts (Windows)

Editar `C:\Windows\System32\drivers\etc\hosts` como **Administrador**:

```
127.0.0.1   mongo1
127.0.0.1   mongo2
127.0.0.1   mongo3
```

**En Linux/Mac** editar `/etc/hosts`:
```bash
sudo nano /etc/hosts
```

Agregar las mismas líneas.

### 3. Configurar Redis

```bash
docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
```

### 4. Verificar Contenedores

```bash
docker ps
```

Deberías ver 4 contenedores corriendo:
- mongo1, mongo2, mongo3
- redis-stack-server

---

## 🚀 Despliegue Paso a Paso

### Backend

#### 1. Configurar Variables de Entorno

Crear archivo `backend/.env`:

```env
# MongoDB Configuration
MONGO_URI=mongodb://mongo1:27017,mongo2:27018,mongo3:27019/aviator_game?replicaSet=myReplicaSet

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Game Configuration (en milisegundos)
WAIT_TIME=5000
TICK_INTERVAL=100
POST_CRASH_WAIT=3000
```

#### 2. Instalar Dependencias

```bash
cd backend
npm install
```

#### 3. Iniciar Servidores Backend

**Terminal 1 - Servidor Maestro (Puerto 3001):**
```bash
npm start 3001
```

**Terminal 2 - Servidor Esclavo (Puerto 3002):**
```bash
npm start 3002
```

Deberías ver:
```
✅ Conectado a MongoDB Cluster
✅ Conectado a Redis
🚀 Servidor Aviator escuchando en puerto 3001
📊 Rol: MAESTRO (gestiona rondas)
```

### Frontend

#### 1. Configurar WebSocket

Editar `frontend/src/utils/constants.js`:

```javascript
export const WS_CONFIG = {
  URL: 'ws://192.168.1.100:8080', // Cambia por tu IP LAN
  RECONNECT_DELAY: 3000
};
```

#### 2. Instalar Dependencias

```bash
cd frontend
npm install
```

#### 3. Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

#### 4. Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en `frontend/build`

---

## 🌐 Pruebas en Entorno LAN

### Configuración del Load Balancer (Nginx)

#### 1. Instalar Nginx

**Windows:** Descargar de [nginx.org](http://nginx.org/en/download.html)

**Linux:**
```bash
sudo apt-get install nginx
```

**Mac:**
```bash
brew install nginx
```

#### 2. Configurar nginx.conf

Crear/editar el archivo de configuración:

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

#### 3. Iniciar Nginx

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

### Obtener IP LAN

**Windows:**
```bash
ipconfig
```

**Linux/Mac:**
```bash
ifconfig
```

Buscar la IP local (ejemplo: `192.168.1.100`)

### Acceder desde Otros Dispositivos

1. En la misma red LAN, abrir navegador
2. Navegar a: `http://192.168.1.100:5173`
3. Cada cliente recibirá un `clientId` único
4. Los clientes se sincronizan en tiempo real

---

## 🧪 Guía de Pruebas

### Prueba 1: Conexión Básica

1. Abrir la aplicación en el navegador
2. Verificar que aparezca "🟢 Conectado"
3. Verificar balance inicial de $1000

### Prueba 2: Colocar Apuesta

1. Esperar fase "Esperando siguiente ronda..."
2. Ingresar monto (ej: $100)
3. Click en "Apostar"
4. Verificar que el balance disminuya

### Prueba 3: Cashout Exitoso

1. Colocar apuesta en fase de espera
2. Esperar que inicie el vuelo
3. Click en "Retirar" cuando el multiplicador sea > 1.5x
4. Verificar ganancia en balance

### Prueba 4: Prueba de Crash

1. Colocar apuesta
2. NO hacer cashout
3. Esperar a que el avión crashee
4. Verificar pérdida de apuesta

### Prueba 5: Múltiples Clientes

1. Abrir 3 navegadores diferentes
2. Colocar apuestas en cada uno
3. Verificar que aparezcan en "Apostadores Activos"
4. Hacer cashout en diferentes momentos
5. Verificar que aparezcan en "Retiros Recientes"

### Prueba 6: Failover MongoDB

```bash
# Detener nodo primario
docker stop mongo1

# Verificar que el sistema siga funcionando
# Un nodo secundario se promoverá automáticamente
```

### Prueba 7: Escalabilidad Backend

```bash
# Iniciar servidor adicional
npm start 3003

# Actualizar nginx.conf para incluirlo
# Verificar balanceo de carga
```

---

## 📊 Monitoreo y Mantenimiento

### Verificar Estado del Sistema

```bash
# Estado de MongoDB Replica Set
docker exec -it mongo1 mongosh --eval "rs.status()"

# Logs de Backend
tail -f backend/logs/app.log

# Estado de contenedores
docker stats
```
---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para aprender sobre sistemas distribuidos en tiempo real**
