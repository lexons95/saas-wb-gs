import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import qiniuAPI from '../utils/qiniuAPI';

const { Schema } = mongoose;

const productSchema = new Schema({
    name: String,
    subName: String,
    description: String,
    category: {
        type: Array,
        default: []
    },
    variants: Object,
    tags: {
      type: Array,
      default: []
    },
    type: {
      type: String,
      default: ""
    },
    published: {
        type: Boolean,
        default: false
    },
    images: {
        type: Array,
        default: []
    }
},{timestamps: true});

productSchema.static('getProducts', function(filterObj = {}) {
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

productSchema.static('findOneOrCreate', async function(obj = null) {
  let newProduct = obj;
    let response = {
        success: false,
        message: "",
        data: {}
    }

    if (newProduct && newProduct.name) {
      let createPromise = this.create(newProduct);
      await createPromise.then((result, error) => {
          if (error) {
              response = {
                  success: false,
                  message: "error in create",
                  data: error
              }
          }
          else {
              response = {
                  success: true,
                  message: "data created",
                  data: result
              }
          }
      });
        // let findPromise = this.findOne({name: newProduct.name});
        // await findPromise.then( async (result, error) => {
        //     if (error) {
        //         response = {
        //             success: false,
        //             message: "error in find",
        //             data: error
        //         }
        //     }
        //     else {
        //         if (result) {
        //             response = {
        //                 success: false,
        //                 message: "duplicate data found, cannot create",
        //                 data: null
        //             }
        //         }
        //         else {
        //             let createPromise = this.create(newProduct);
        //             await createPromise.then((result, error) => {
        //                 if (error) {
        //                     response = {
        //                         success: false,
        //                         message: "error in create",
        //                         data: error
        //                     }
        //                 }
        //                 else {
        //                     response = {
        //                         success: true,
        //                         message: "data created",
        //                         data: result
        //                     }
        //                 }
        //             });
        //         }
        //     }
        // })     
    }
    else {
        response = {
            success: false,
            message: "data required not complete",
            data: {}
        }
    }
    
    return response;
});

productSchema.static('updateOne', async function(obj = null) {
    let newProduct = obj;
      let response = {
          success: false,
          message: "",
          data: {}
      }
  
      if (newProduct && newProduct.name) {
          let findPromise = this.findOne({_id: newProduct._id});
          await findPromise.then( async (result, error) => {
              if (error) {
                  response = {
                      success: false,
                      message: "error in find",
                      data: error
                  }
              }
              else {
                  if (result) {
                    const { _id, ...restProduct } = newProduct;
                    let createPromise = this.findOneAndUpdate({_id: newProduct._id}, restProduct);
                    await createPromise.then((result, error) => {
                        if (error) {
                            response = {
                                success: false,
                                message: "error in update",
                                data: error
                            }
                        }
                        else {
                            response = {
                                success: true,
                                message: "data updated",
                                data: result
                            }
                        }
                    });
                  }
                  else {
                    response = {
                        success: false,
                        message: "data not found, cannot update",
                        data: null
                    }
                     
                  }
              }
          })     
      }
      else {
          response = {
              success: false,
              message: "data required not complete",
              data: {}
          }
      }
      
      return response;
  });

productSchema.static('deleteOneProduct', async function(productId = null) {
  let response = {
    success: false,
    message: "",
    data: {}
  }
  if (productId) {
    let deleteOnePromise = this.deleteOne({_id: productId});
    await deleteOnePromise.then( async (result, error) => {
      if (error) {
        response = {
            success: false,
            message: "error in delete",
            data: error
        }
      }
      else {
        response = {
            success: true,
            message: "data deleted",
            data: {}
        }  
      }
    });
  }
  else {
    response = {
        success: false,
        message: "data required not complete",
        data: {}
    }
  }
  return response;
});

productSchema.static('updatePublishMany', async function(obj = {}) {
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

productSchema.static('checkProductPublish', async function(items = []) {
  let response = {
    success: false,
    message: "",
    data: {}
  }

  if (items.length > 0) {
    let productIds = items.map((anItem)=>anItem.product._id);
    let foundProducts = await this.find({
      _id: {
        $in: productIds
      }
    });

    let notPublished = [];

    foundProducts.map((aProduct)=>{
      let foundItem = items.find((anItem)=>anItem.product._id == aProduct._id);
      if (foundItem) {
        if (!aProduct.published) {
          notPublished.push(foundItem);
        } 
      }
    });

    if (notPublished.length > 0) {
      response = {
        success: false,
        message: "已下架",
        data: {
          items: notPublished
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
const Product = mongoose.model('Product', productSchema); 

export default {
  model: Product,
  schema: productSchema,
  Product: Product
};

/*
email: String,
    name: String,
    address: String,
    ic: String
*/