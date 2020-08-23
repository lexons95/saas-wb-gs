import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderSchema = new Schema({
  createdAt: Date,
  updatedAt: Date,
  type: String,
  items: {
    type: Array,
    default: []
  },
  deliveryFee: Number,
  total: Number,
  customer: Object,
  remark:  {
    type: String,
    default: ""
  },
  sellerRemark:  {
    type: String,
    default: ""
  },
  charges: Object,
  paid: {
    type: Boolean,
    default: false
  },
  trackingNum: {
    type: String,
    default: ""
  },
  sentOut: {
    type: Boolean,
    default: false
  },
  status: String
},{timestamps: true});

orderSchema.static('getOrders', function(filterObj = null) {
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

      // const orderBy = {
      //     "desc": -1,
      //     "acs": 1
      // }
      // let sorterKeys = Object.keys(sorter);
      // sorterKeys.map(aKey=>{
      //     sorterResult[aKey] = orderBy[aKey];
      // })
  }
  return this.find(filterResult).sort(sorterResult).skip(skipResult).limit(limitResult);
});

orderSchema.static('searchOrders', function(filterObj = null) {
  let filterResult = {};
  let sorterResult = {};
  let skipResult = 0;
  let limitResult = 0;

  if (filterObj) {
      // let obj = filterObj.filter ? filterObj.filter : {};
      // filterResult = obj.filter ? obj.filter : {};
      let obj = {};
      let sorter = obj.sorter ? obj.sorter : {};
      sorterResult = Object.assign({},sorter);

      skipResult = obj.skip ? obj.skip : 0;
      limitResult = obj.limit ? obj.limit : 0;

      return this.find({'customer.contact': filterObj}).sort(sorterResult).skip(skipResult).limit(limitResult);
  }
  return [];
});

orderSchema.static('createOrder', async function(obj = null) {
  let response = {
    success: false,
    message: "",
    data: {}
  }

  let createPromise = this.create(obj)
  await createPromise.then((result, err)=>{
    if (!err) {
      response = {
        success: true,
        message: "",
        data: result
      } 
    }
  });

  return response;
})

orderSchema.static('updateOrderPayment', async function(obj = null) {
  let response = {
    success: false,
    message: "",
    data: {}
  }

  let setter = {
    paid: obj.paid,
    status: obj.paid ? '1' : '0'
  }
  
  let updatePromise = this.findOneAndUpdate({_id: obj._id},{ $set: setter })
  await updatePromise.then((result, err)=>{
    if (!err) {
      response = {
        success: true,
        message: "",
        data: result
      } 
    }
  });

  return response;
})

orderSchema.static('updateOrderDelivery', async function(obj = null) {
  let response = {
    success: false,
    message: "",
    data: {}
  }
  let setter = {
    trackingNum: "",
  }
  if (obj.trackingNum) {
    setter['trackingNum'] = obj.trackingNum;
    setter['sentOut'] = true;
    setter['status'] = '2';
  }
  else {
    setter['sentOut'] = false;
    setter['status'] = '1';
  }
  let updatePromise = this.findOneAndUpdate({_id: obj._id},{ $set: setter })
  await updatePromise.then((result, err)=>{
    if (!err) {
      response = {
        success: true,
        message: "",
        data: result
      } 
    }
  });

  return response;
})

orderSchema.static('updateOrderStatus', async function(obj = null) {
  let response = {
    success: false,
    message: "",
    data: {}
  }
  let setter = {
    status: obj.status
  }

  let updatePromise = this.findOneAndUpdate({_id: obj._id},{ $set: setter })
  await updatePromise.then((result, err)=>{
    if (!err) {
      response = {
        success: true,
        message: "",
        data: result
      } 
    }
  });

  return response;
})

orderSchema.static('updateOrderSellerRemark', async function(obj = null) {
  let response = {
    success: false,
    message: "",
    data: {}
  }

  let { _id, ...restOrder } = obj;

  let updatePromise = this.findOneAndUpdate({_id: _id },{ $set: restOrder })
  await updatePromise.then((result, err)=>{
    if (!err) {
      response = {
        success: true,
        message: "Order Updated",
        data: result
      } 
    }
  });

  return response;
})

orderSchema.static('cancelOrder', async function(obj = null) {
  let response = {
    success: false,
    message: "",
    data: {}
  }

  let deletePromise = this.findOneAndDelete({_id: obj._id})
  await deletePromise.then((result, err)=>{

    if (!err) {
      response = {
        success: true,
        message: "",
        data: result
      } 
    }
  });

  return response;
})

const Order = mongoose.model('Order', orderSchema); 

export default {
  model: Order,
  schema: orderSchema,
  Order: Order
};