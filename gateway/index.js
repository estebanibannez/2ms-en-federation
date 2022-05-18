const { ApolloServer } = require("apollo-server");
const { ApolloGateway } = require("@apollo/gateway");
const { readFileSync } = require('fs');

const supergraphSdl = readFileSync('./prod-schema.graphql').toString();

const gateway = new ApolloGateway({
  supergraphSdl,
});

const server = new ApolloServer({
  gateway,
});

server
  .listen(8000)
  .then(({ url }) => {
    console.log(`Gateway ready at ${url}`);
  })
  .catch((err) => {
    console.error(err);
  });
