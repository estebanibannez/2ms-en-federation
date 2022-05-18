const { ApolloServer, gql } = require("apollo-server");
const trails = require("./trail-data.json");
const { buildFederatedSchema } = require("@apollo/federation");
const findEasiestTrail = require("./findEasiestTrail");

const typeDefs = gql`
  type Trail @key(fields: "id") {
    id: ID!
    name: String!
    status: TrailStatus!
    difficulty: Difficulty!
    groomed: Boolean!
    trees: Boolean!
    night: Boolean!
    # feedback: ReviewableItem!
  }

  extend type Lift @key(fields: "id") {
    id: ID! @external
    easyWayDown: Trail!
  }

  # extend type ReviewableItem @key(fields: "itemID") {
  #   itemID: ID! @external
  # }

  # extend type Review @key(fields: "id") {
  #   id: ID! @external
  #   itemID: ID! @external
  #   trail: Trail! @requires(fields: "itemID")
  # }

  enum Difficulty {
    BEGINNER
    INTERMEDIATE
    ADVANCED
    EXPERT
  }

  enum TrailStatus {
    OPEN
    CLOSED
  }

  type Query {
    allTrails(status: TrailStatus): [Trail!]!
    Trail(id: ID!): Trail!
    trailCount(status: TrailStatus): Int!
  }

  type Mutation {
    setTrailStatus(id: ID!, status: TrailStatus!): Trail!
  }
`;
const resolvers = {
  Query: {
    allTrails: (root, { status }) =>
      !status ? trails : trails.filter((trail) => trail.status === status),
    Trail: (root, { id }) => trails.find((trail) => id === trail.id),
    trailCount: (root, { status }) =>
      !status
        ? trails.length
        : trails.filter((trail) => trail.status === status).length,
  },
  Mutation: {
    setTrailStatus: (root, { id, status }) => {
      let updatedTrail = trails.find((trail) => id === trail.id);
      updatedTrail.status = status;
      return updatedTrail;
    },
  },
  Trail: {
    feedback: ({ id }) => ({ itemID: id }),
    __resolveReference: (reference) =>
      trails.find((trail) => trail.id === reference.id),
  },
  Lift: {
    easyWayDown: (lift) => {
      const waysDown = trails.filter((trail) => trail.lift.includes(lift.id));
      return findEasiestTrail(waysDown);
    },
  },
  Review: {
    trail: ({ itemID }) => trails.find((trail) => trail.id === itemID),
  },
};

const server = new ApolloServer({
  schema: buildFederatedSchema({
    typeDefs,
    resolvers,
  }),
});

server.listen(4002).then(({ url }) => {
  console.log(`MS TWO Service running at ${url}`);
});
