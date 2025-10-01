export const MONGO_CONFIG = {
    URI: 'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=myReplicaSet',
    OPTIONS: {
        readPreference: 'primaryPreferred',
        w: 'majority',
        wtimeoutMS: 5000
    }
};