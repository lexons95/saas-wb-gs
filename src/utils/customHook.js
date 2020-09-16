import React, { useEffect } from 'react';
import { useQuery, useLazyQuery, makeVar, gql } from '@apollo/client';

import ApolloClientAPI from './ApolloClient/ApolloClientAPI';
import { configVar, userVar } from './ApolloClient/cache';

import { defaultImage_system } from './Constants'; 
// export { DefaultClientAPI } from '../index';

export const DefaultClientAPI = ApolloClientAPI();

// DefaultClientAPI.client.writeQuery({
//   query: gql`
//     query user {
//       user
//     }
//   `,
//   data: {
//     user: null
//   },
// })
// DefaultClientAPI.client.writeQuery({
//   query: gql`
//     query config {
//       config
//     }
//   `,
//   data: {
//     config: null
//   },
// })

const handleConfigOuput = (config = null) => {
  let result = null;
  if (config) {
    result = {...config}
    let newDefaultImage = defaultImage_system;
    if (result.defaultImage && result.defaultImage != "") {
      newDefaultImage = result.imageSrc + result.defaultImage;
    }
    result['defaultImage'] = newDefaultImage;
  }
  return result;
}

// User Cache ---------------------------- start
const GET_USER_CACHE_QUERY = gql`
  query user {
    user @client {
      success
      message
      data
    }
  }
`

export const useUserCache = (options={}) => {
  const defaultOptions = {
    fetchPolicy: 'cache-and-network'
  }
  const  { data, error, loading } = useQuery(GET_USER_CACHE_QUERY,{
    ...defaultOptions,
    ...options
  });

  let result = null;
  if (loading) {
    return result;
    // console.log('loading');
  }
  if (error) {
    console.log('useUserCache',error);
  }
  if (data && data.user) {
    result = data.user;
  }
  return result;
}

export const setUserCache = (data) => {
  // let theClient = DefaultClientAPI.client;
  // theClient.writeQuery({
  //   query: GET_USER_CACHE_QUERY,
  //   data: {
  //     user: data
  //   }
  // });
  userVar(data)
}

const GET_LOGGED_IN_USER = gql`
  query loggedInUser{
    loggedInUser{
        success
        message
        data
    }
  }
`
export const useUserQuery = (options={}) => {
  const defaultOptions = {
    fetchPolicy: 'cache-and-network',
    onCompleted: (result) => {
      if (result && result.loggedInUser && result.loggedInUser.success) {
        // console.log('useUserQuery',result)
        setUserCache(result.loggedInUser.data)
      }
    }
  }

  const queryResult = useQuery(GET_LOGGED_IN_USER,{
    ...defaultOptions,
    ...options
  });

  return queryResult;
}

export const useUserLazyQuery = (options={}) => {
  const defaultOptions = {
    fetchPolicy: 'cache-and-network',
    onCompleted: (result) => {
      if (result && result.loggedInUser && result.loggedInUser.success) {
        let { config, ...rest } = result.loggedInUser.data;
        setUserCache(result.loggedInUser)
        setConfigCache(config)
      }
    }
  }

  const queryResult = useLazyQuery(GET_LOGGED_IN_USER,{
    ...defaultOptions,
    ...options
  });

  return queryResult;
}

// User Cache ---------------------------- end
// Config Cache ---------------------------- start
const GET_USER_CONFIG_QUERY = gql`
  query userConfig($configId: String!) {
    userConfig(configId: $configId) {
        success
        message
        data
    }
  }
`
const GET_CONFIG_CACHE_QUERY = gql`
  query config {
    config @client {
      _id
      configId
      defaultImage
      defaultImage_system
      imageSrc
      paymentQRImage
      server
      currencyUnit
      profile
      delivery
      productImageLimit
      inventoryPerProductLimit
      productTypes
    }
  }
`

export const useConfigCache = () => {
  const { data, error, loading } = useQuery(GET_CONFIG_CACHE_QUERY,{
    //fetchPolicy: 'cache-only'
    fetchPolicy: 'cache-and-network'
  });

  let result = null;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useConfigCache',error);
  }
  if (data && data.config) {
    result = data.config;
  }
  return result;
}

export const setConfigCache = (data) => {
  // let theClient = DefaultClientAPI.client;
  // theClient.writeQuery({
  //   query: GET_CONFIG_CACHE_QUERY,
  //   data: {
  //     config: handleConfigOuput(data)
  //   }
  // });
  configVar(handleConfigOuput(data))
}

export const useConfigQuery = (options={}) => {
  const defaultOptions = {
    fetchPolicy: 'cache-and-network',
    onCompleted: (result) => {
      if (result && result.userConfig && result.userConfig.success) {
        // console.log('useConfigQuery2',result)
        setConfigCache(result.userConfig.data)
      }
    }
  }

  const queryResult = useQuery(GET_USER_CONFIG_QUERY,{
    ...defaultOptions,
    ...options
  });

  return queryResult;
}

export const useConfigLazyQuery = (options={}) => {
  const defaultOptions = {
    fetchPolicy: 'cache-and-network',
    onCompleted: (result) => {
      if (result && result.userConfig && result.userConfig.success) {
        // console.log('useConfigQuery2',result)
        setConfigCache(result.userConfig.data)
      }
    }
  }

  const queryResult = useLazyQuery(GET_USER_CONFIG_QUERY,{
    ...defaultOptions,
    ...options
  });

  return queryResult;
}

export const clearCache = () => {
  // DefaultClientAPI.client.writeQuery({
  //   query: gql`
  //     query user {
  //       user
  //     }
  //   `,
  //   data: {
  //     user: null
  //   },
  // })
  // DefaultClientAPI.client.writeQuery({
  //   query: gql`
  //     query config {
  //       config
  //     }
  //   `,
  //   data: {
  //     config: null
  //   },
  // })
  configVar(null);
  userVar(null)
}

// Config Cache ---------------------------- end


// Orders ---------------------------- start

const GET_ORDERS_QUERY = gql`
  query orders($filter: JSONObject, $configId: String) {
    orders(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      items
      total
      type
      charges
      customer
      remark
      sellerRemark
      paid
      sentOut
      trackingNum
      deliveryFee
      status
    }
  }
`;

export const useOrdersQuery = (options) => {

  let defaultOptions = {
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.log("orders error", error)
  
    },
    onCompleted: (result) => {
      // console.log('Orders', result.orders)
    }
  }
  const ordersResult = useQuery(GET_ORDERS_QUERY, {
    ...defaultOptions,
    ...options
  });

  const { loading, error } = ordersResult;

  let result = ordersResult;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useOrdersQuery',error);
  }

  return result;
}


// Orders ---------------------------- end

// Inventory ---------------------------- start
const READ_PRODUCT_INVENTORY_QUERY = gql`
  query inventory($filter: JSONObject, $configId: String) {
    inventory(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      price
      stock
      weight
      onSale
      salePrice
      variants
      published
      productId
    }
  }
`;

export const useInventoryQuery = (options) => {

  const inventoryResult = useQuery(READ_PRODUCT_INVENTORY_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: options,
    onError: (error) => {
      console.log("inventory error", error)
  
    },
    onCompleted: (result) => {

    }
  });

  const { loading, error } = inventoryResult;

  let result = inventoryResult;
  if (loading) {
    // console.log('loading');
  }
  if (error) {
    console.log('useOrdersQuery',error);
  }

  return result;
}

// Inventory ---------------------------- end

