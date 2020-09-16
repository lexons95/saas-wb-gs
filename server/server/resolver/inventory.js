import { AuthenticationError } from 'apollo-server-express';
import InventoryModel from '../model/inventory';
import { editorOnly } from '../utils/authentication';

const resolvers = {
  Query: {
    inventory: async (_, args=null, { req }) => {
      let loggedInUser = req.user;
      let dbName = args.configId;
      if (dbName) {
        const db_base = await global.connection.useDb(dbName);
        const collection_inventory = await db_base.model("Inventory",InventoryModel.schema,'inventory');
        return await collection_inventory.getInventory(args);
      }
      return [];
    },
      
  },
  Mutation: {
    bulkUpdateInventory: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser.configId;
      if (dbName) {
        const db_base = await global.connection.useDb(dbName);
        const collection_inventory = await db_base.model("Inventory",InventoryModel.schema,'inventory');
        
        let updateResult = await collection_inventory.bulkUpdate(args);
        return updateResult;
      }
      return {
        success: false,
        message: "user config id not found",
        data: {}
      };
    }),
    updateInventoryPublish: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser.configId;
      if (dbName) {
        const db_base = await global.connection.useDb(dbName);
        const collection_inventory = await db_base.model("Inventory",InventoryModel.schema,'inventory');
        
        let updateResult = await collection_inventory.updatePublishMany(args);
        return updateResult;
      }
      return {
        success: false,
        message: "user config id not found",
        data: {}
      };
    }),
    deleteInventory: editorOnly( async (_, args={}, { req }) => {
      let loggedInUser = req.user;
      let dbName = loggedInUser.configId;
      if (dbName) {
        // const db_base = await global.connection.useDb(dbName);
        // const collection_inventory = await db_base.model("Inventory",InventoryModel.schema,'inventory');
        
        // let updateResult = await collection_inventory.bulkUpdate(args);
        // return updateResult;
      }
      return {
        success: false,
        message: "user config id not found",
        data: {}
      };
    })
    // createProduct: async (_, args={}, { req }) => {
    //   let loggedInUser = req.user;
    //   let dbName = loggedInUser.configId;
    //   if (dbName) {
    //     const db_base = await global.connection.useDb(dbName);
    //     const collection_product = await db_base.model("Product",ProductModel.schema,'product');
    //     const newProductObj = Object.assign({},args.product,{published: false, images: []});
        
    //     let createResult = await collection_product.findOneOrCreate(newProductObj);
    //     return createResult;
    //   }
    //   return {
    //     success: false,
    //     message: "user config id not found",
    //     data: {}
    //   };
    // },
    // updateProduct: async (_, args={}, { req }) => {
    //   let loggedInUser = req.user;
    //   let dbName = loggedInUser.configId;
    //   if (dbName) {
    //     const db_base = await global.connection.useDb(dbName);
    //     const collection_product = await db_base.model("Product",ProductModel.schema,'product');
    //     const productObj = args.product;

    //     let updateResult = await collection_product.updateOne(productObj);
    //     return updateResult;
    //   }
    //   return {
    //     success: false,
    //     message: "user config id not found",
    //     data: {}
    //   };
    // },
    // deleteProduct: async (_, args={}, { req }) => {
    //   let loggedInUser = req.user;
    //   let dbName = loggedInUser.configId;
    //   if (dbName || args._id) {
    //     const db_base = await global.connection.useDb(dbName);
    //     const collection_product = await db_base.model("Product",ProductModel.schema,'product');
    //     let deleteResult = await collection_product.deleteOneProduct(args._id);
    //     console.log('deleteResult',deleteResult)
    //     return deleteResult;
    //   }
    //   return {
    //     success: false,
    //     message: "user config id not found",
    //     data: {}
    //   };
    // }
      
  }
  
};

export default resolvers;
