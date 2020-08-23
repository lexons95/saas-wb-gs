import { gql } from 'apollo-server-express';

const schema = gql`
  extend type Query {
    users(filter: JSONObject): [User]!
    user(id: String!): User
    loggedInUser: Response
  }
  extend type Mutation {
    createUser(user: JSONObject!): Response!
    updateUser(user: JSONObject!): Response!
    deleteUser(id: String!): Response!

    loginUser(user: JSONObject!): Response!
    changeUserPassword(_id: String!, password: String!): Response!
    login(user: JSONObject): Response
    login2(username: String!, password: String!): Response
    logout: Response
    invalidateTokens: Boolean!
  }

  type User {
    _id: String,
    username: String!,
    password: String!,
    email: String,
    role: String,,
    configId: String,
    profile: UserProfile,
    tokenCount: Int
  }

  type UserProfile {
    icNum: String 
    name: String,
    contact: String
    addresses: [JSONObject!]!
  }
`;
export default schema;