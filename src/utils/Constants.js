export const defaultImage_system = require("./noImageFound.png");

export const rewardTypeOptions = [
  {
    label: "Percentage",
    value: "percentage"
  },
  {
    label: "Fixed Amount",
    value: "fixedAmount"
  },
  {
    label: "Free Shipping",
    value: "freeShipping"
  },
  {
    label: "Free Gift",
    value: "freeGift"
  }
]

export const getAllProductCategory = (products) => {
  let result = [];
  products.map((aProduct)=>{
    if (aProduct.category && aProduct.category.length > 0) {
      aProduct.category.map((aCategory)=>{
        // let catKeys = Object.keys(aCategory)
        // if (catKeys.indexOf('key') >= 0) {
        //   console.log('aProduct', aProduct.name)
        // }
        let foundPushedItem = result.find((anItem)=>anItem._id == aCategory._id);
        if (!foundPushedItem) {
          result.push(aCategory);
        }
      })
    }
  });
  return result;
}

export const getAllProductTags = (products) => {
  let result = [];
  products.map((aProduct)=>{
    if (aProduct.tags && aProduct.tags.length > 0) {
      aProduct.tags.map((aTag)=>{
        let foundPushedItem = result.indexOf(aTag);
        if (foundPushedItem < 0) {
          result.push(aTag);
        }
      })
    }
  });
  return result;
}
