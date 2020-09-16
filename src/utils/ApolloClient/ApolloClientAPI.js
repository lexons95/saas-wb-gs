import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink, createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';

import { configVar, userVar } from './cache';

// export const MIDDLETIER_URL = "http://localhost:8080/graphql";
export const MIDDLETIER_URL = "http://localhost:3000/graphql";
// export const MIDDLETIER_URL = "http://15.165.150.23/graphql";
// export const MIDDLETIER_URL = "http://8.210.145.128/graphql";
const cache = new InMemoryCache({ 
  addTypename: false,
  typePolicies: {
    Query: {
      fields: {
        user: {
          read () {
            return userVar();
          }
        },
        config: {
          read () {
            return configVar();
          }
        }
      }
    }
  }
});

export default function ApolloClientAPI(middletierURL = null) {


  const httpLink = createHttpLink({ 
    uri: middletierURL ? middletierURL : MIDDLETIER_URL,
    credentials: "include"
    // fetchOptions: {
    //   mode: 'cors',
    // }
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        //'Access-Control-Allow-Origin': '*'
      },
      //credentials: "include"
    }
  });

  const client = new ApolloClient({
    //link: authLink.concat(httpLink),
    link: httpLink,
    cache
  });

  return {
    client: client,
    query: async (query, params={})=>{
      return new Promise((resolve, reject) => {
        client.query({
          variables: params,
          query: query
        }).then(result=>{
          resolve(result);
        }).catch(err=>{
          reject(err);
        })
      })
    },
    mutation: async (query, params={})=>{
      return new Promise((resolve, reject) => {
        client.mutate({
          variables: params,
          mutation: query
        }).then(result=>{
          resolve(result);
        }).catch(err=>{
          reject(err);
        })
      })
    }
  }
}
