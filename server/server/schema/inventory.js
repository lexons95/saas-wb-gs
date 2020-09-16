import { gql } from 'apollo-server-express';

const schema = gql`
  extend type Query {
    inventory(filter: JSONObject, configId: String): [Inventory]!
  }
  extend type Mutation {
    createInventory(inventory: JSONObject!): Response!
    updateInventory(inventory: JSONObject!): Response!
    deleteInventory(id: String!): Response!

    bulkUpdateInventory(inventory: [JSONObject!]): Response!
    updateInventoryPublish(ids: [String!], published: Boolean!): Response!
  }

  type Inventory {
    _id: String
    createdAt: Date
    updatedAt: Date
    sku: String
    price: Float!
    stock: Int!
    weight: Float
    onSale: Boolean
    salePrice: Float
    variants: JSONObject
    description: String
    published: Boolean!
    productId: String!
  }
`;

export default schema;