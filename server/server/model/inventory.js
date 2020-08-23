import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const inventorySchema = new Schema({
  createdAt: Date,
  updatedAt: Date,
  sku: String,
  price: Number,
  stock: Number,
  weight: Number,
  onSale: {
    type: Boolean,
    default: false
  },
  salePrice: Number,
  variants: Object,
  description: String,
  published: Boolean,
  productId: String
},{timestamps: true});

inventorySchema.static('getInventory', function(filterObj = null) {
  let filterResult = {};
  let sorterResult = {};
  let skipResult = 0;
  let limitResult = 0;

  if (!Object.entries(filterObj).length === 0 || filterObj.constructor === Object && filterObj != null) {
      let obj = filterObj.filter ? filterObj.filter : {};
      filterResult = obj.filter ? obj.filter : {};
      let sorter = obj.sorter ? obj.sorter : {};
      sorterResult = Object.assign({},sorter);

      skipResult = obj.skip ? obj.skip : 0;
      limitResult = obj.limit ? obj.limit : 0;

      const orderBy = {
          "desc": -1,
          "acs": 1
      }
      let sorterKeys = Object.keys(sorter);
      sorterKeys.map(aKey=>{
          sorterResult[aKey] = orderBy[aKey];
      })
  }
  return this.find(filterResult).sort(sorterResult).skip(skipResult).limit(limitResult);
});

inventorySchema.static('bulkUpdate', async function(obj = {}) {
  let response = {
      success: false,
      message: "",
      data: {}
  }
  let bulkUpdateArray = [];
  if (!Object.entries(obj).length === 0 || obj.constructor === Object) {
    if (obj.inventory.length > 0) {
      obj.inventory.map((anInventory)=>{
        const { _id: inventoryId, deleted=false, ...restProperty } = anInventory;
        if (deleted) {
          bulkUpdateArray.push({
            deleteOne: {
              filter: { _id: inventoryId }
            }
          })
        }
        else {
          if (inventoryId) {
            bulkUpdateArray.push({
              updateOne: {
                filter: { _id: inventoryId },
                update: {...restProperty },
                upsert: true
              }
            })
          }
          else {
            bulkUpdateArray.push({
              insertOne: {
                document: restProperty
              }
            })
          }
        }
      })
    }
  }

  if (bulkUpdateArray.length > 0) {
    await this.bulkWrite(bulkUpdateArray).then(res => {
      response = {
        success: true,
        message: "",
        data: res
      }
    });
  }
  else {
    response = {
      success: true,
      message: "no operations",
      data: {}
    }
  }
  return response;
})

inventorySchema.static('updatePublishMany', async function(obj = {}) {
  let response = {
    success: false,
    message: "",
    data: {}
  } 

  if (!Object.entries(obj).length === 0 || obj.constructor === Object) {
    let ids = obj.ids ? obj.ids : [];
    let published = obj.published;
    await this.updateMany(
      {
        _id: { $in: ids }
      },
      { published: published }
    ).then(res => {
      response = {
        success: true,
        message: "",
        data: res
      }
    })

  }
  return response;
})

inventorySchema.static('bulkModifyInventory', async function(obj = {}, operation = null) {
  let response = {
      success: false,
      message: "",
      data: {}
  }
  let bulkModifyArray = [];
  // let operation = ['create','update','delete']
  if (obj && obj.items && obj.items.length > 0) {
    let operationType = 'update' 
    obj.items.map((anItem)=>{
      if (operationType == 'update') {
        let filter = { _id: anItem.inventoryId };
        if (operation && operation == 'decrease') {
          bulkModifyArray.push({
            updateOne: {
              filter: filter,
              update: {
                $inc: { stock: -anItem.qty }
              }
            }
          })
        }
        else {
          bulkModifyArray.push({
            updateOne: {
              filter: filter,
              update: {
                $inc: { stock: anItem.qty }
              }
            }
          })
        }
      }
      if (operationType == 'delete') {
        bulkModifyArray.push(

        )
      }
      
    })
  }

  if (bulkModifyArray.length > 0) {
    await this.bulkWrite(bulkModifyArray).then(res => {
      response = {
        success: true,
        message: "",
        data: res
      }
    });
  }
  else {
    response = {
      success: true,
      message: "no operations",
      data: {}
    }
  }
  return response;
})

inventorySchema.static('checkInventoryStock', async function(items = []) {
  let response = {
    success: false,
    message: "",
    data: {}
  }

  if (items.length > 0) {
    let inventoryIds = items.map((anItem)=>anItem.inventoryId);
    let foundInventories = await this.find({
      _id: {
        $in: inventoryIds
      }
    });

    let insufficientStock = [];

    foundInventories.map((anInventory)=>{
      let foundItem = items.find((anItem)=>anItem.inventoryId == anInventory._id);
      if (foundItem) {
        let newStockPreview = anInventory.stock - foundItem.qty;
        if (newStockPreview < 0 || !anInventory.published) {
          insufficientStock.push({...foundItem, stock: anInventory.stock });
        } 
      }
    });

    if (insufficientStock.length > 0) {
      response = {
        success: false,
        message: "库存不足",
        data: {
          items: insufficientStock
        }
      }
    }
    else {
      response = {
        success: true,
        message: "",
        data: {}
      }
    }

  }

  return response;
});

const Inventory = mongoose.model('Inventory', inventorySchema); 

export default {
  model: Inventory,
  schema: inventorySchema,
  Inventory: Inventory
};

/*
email: String,
    name: String,
    address: String,
    ic: String
*/