const { ApolloServer, gql } = require("apollo-server");
const lifts = require("./lift-data.json");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`
  type Lift @key(fields: "id") {
    id: ID!
    name: String!
    status: LiftStatus!
    capacity: Int!
    night: Boolean!
    elevationGain: Int!
    trailAccess: [Trail!]!
  }

  extend type Trail @key(fields: "id") {
    id: ID! @external
    liftAccess: [Lift!]!
  }

  enum LiftStatus {
    OPEN
    HOLD
    CLOSED
  }

  type Query {
    allLifts(status: LiftStatus): [Lift!]!
    Lift(id: ID!): Lift!
    liftCount(status: LiftStatus): Int!
  }

  type Mutation {
    setLiftStatus(id: ID!, status: LiftStatus!): Lift!
  }
`;
const resolvers = {
  Query: {
    allLifts: (root, { status }) =>
      !status ? lifts : lifts.filter((lift) => lift.status === status),
    Lift: (root, { id }) => lifts.find((lift) => id === lift.id),
    liftCount: (root, { status }) =>
      !status
        ? lifts.length
        : lifts.filter((lift) => lift.status === status).length,
  },
  Mutation: {
    setLiftStatus: (root, { id, status }) => {
      let updatedLift = lifts.find((lift) => id === lift.id);
      updatedLift.status = status;
      return updatedLift;
    },
  },
  Trail: {
    liftAccess: (trail) =>
      lifts.filter((lift) => lift.trails.includes(trail.id)),
  },
  Lift: {
    __resolveReference: ({ id }) => lifts.find((lift) => lift.id === id),
    trailAccess: (lift) =>
      lift.trails.map((id) => ({ __typename: "Trail", id })),
  },
};

const server = new ApolloServer({
  schema: buildFederatedSchema({
    typeDefs,
    resolvers,
  }),
});

server.listen(4001).then(({ url }) => {
  console.log(`🚠 MS ONE Service running at ${url}`);
});
