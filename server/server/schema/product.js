import { gql } from 'apollo-server-express';

const schema = gql`
  extend type Query {
    products(filter: JSONObject, configId: String): [Product]!
    product(_id: String!, configId: String): Product
  }
  extend type Mutation {
    createProduct(product: JSONObject!): Response!
    createProducts(products: [JSONObject!]!): Response!
    updateProduct(product: JSONObject!, inventory: [JSONObject!]): Response!
    deleteProduct(_id: String!): Response!
    updateProductPublish(ids: [String!], published: Boolean!): Response!
  }

  type Product {
    _id: String
    createdAt: Date
    updatedAt: Date
    name: String!
    subName: String
    description: String
    category: [JSONObject]
    variants: JSONObject
    tags: [String]
    type: String!
    published: Boolean!
    images: [JSONObject]!    
  }

  type Image {
    src: String!
    name: String
    description: String
    fav: Boolean
  }
`;
export default schema;