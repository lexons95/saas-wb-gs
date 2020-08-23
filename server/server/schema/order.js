import { gql } from 'apollo-server-express';

const schema = gql`
  extend type Query {
    orders(filter: JSONObject, configId: String): [Order]!
    searchOrders(filter: String!, configId: String): [Order]!
    order(_id: String!) : Order
  }
  extend type Mutation {
    createOrder(order: JSONObject!, configId: String): Response!
    updateOrder(order: JSONObject!): Response!

    updateOrderPayment(_id: String!, paid: Boolean!): Response!
    updateOrderDelivery(_id: String!, trackingNum: String): Response!
    updateOrderStatus(_id: String!, status: String!): Response!
    cancelOrder(_id: String!): Response!
    updateOrderRemark(_id: String!, sellerRemark: String!): Response!
  }

  type Order {
    _id: String
    createdAt: Date
    updatedAt: Date

    type: String
    items: [JSONObject]
    deliveryFee: Float
    total: Float!
    customer: JSONObject
    remark: String
    sellerRemark: String
    charges: [JSONObject]

    paid: Boolean!
    sentOut: Boolean!
    trackingNum: String
    status: String

  }
`;

export default schema;