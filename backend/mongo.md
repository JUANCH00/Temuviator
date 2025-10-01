### Create a Docker Network
The first step is to create a Docker network. This network will let each of your containers running in this network see each other. To create a network, run the docker network create command.

```
docker network create mongoCluster

```

### Crear directorios para persistencia

En tu máquina host, crea carpetas donde se guardarán los datos de cada nodo:
```
mkdir C:\mongo\replica1
mkdir C:\mongo\replica2
mkdir C:\mongo\replica3

```

### Start MongoDB Instances
You are now ready to start your first container with MongoDB. To start the container, use the docker run command.
```
docker run -d -p 27017:27017 --name mongo1 --network mongoCluster -v /c/mongo/replica1:/data/db mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo1

```
### Parameters
* -d indicates that this container should run in detached mode (in the background).
* -p indicates the port mapping. Any incoming request on port 27017 on your machine will be redirected to port 27017 in the container.
* --name indicates the name of the container. This will become the hostname of this machine.
* --network indicates which Docker network to use. All containers in the same network can see each other.
* mongo:5 is the image that will be used by Docker. This image is the MongoDB Community server version 5 (maintained by Docker). You could also use a MongoDB Enterprise custom image.

If the command was successfully executed, you should see a long hexadecimal string representing the container id. Start two other containers. You will need to use a different name and a different port for those two.

```
docker run -d -p 27018:27017 --name mongo2 --network mongoCluster -v /c/mongo/replica2:/data/db mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo2
 
docker run -d -p 27019:27017 --name mongo3 --network mongoCluster -v /c/mongo/replica3:/data/db mongo:latest mongod --replSet myReplicaSet --bind_ip localhost,mongo3

```

### Initiate the replica set
```
docker exec -it mongo1 mongosh

rs.initiate({
  _id: "myReplicaSet",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 2 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
})
```

### Add this conf to C:\Windows\System32\drivers\etc\hosts

127.0.0.1   mongo1
127.0.0.1   mongo2
127.0.0.1   mongo3

### Test and Verify the Replica Set
If you want to verify that everything was configured correctly, you can use the mongosh CLI tool to evaluate the rs.status() instruction. This will provide you with the status of your replica set, including the list of members.
```
docker exec -it mongo1 mongosh --eval "rs.status()"

```
You can also connect to your cluster using MongoDB Compass to create a database and add some documents. Note that the data is created inside the container storage and will be destroyed when the containers are removed from the host system. To verify that your replica set is working, you can try stopping one of the containers with docker stop and try to read from your database again.
```
docker stop mongo1

```
The data will still be there. You can see that the cluster is still running by using rs.status() on the mongo2 container.

```
docker exec -it mongo2 mongosh --eval "rs.status()"
```


### Redis image
```
docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest

```
