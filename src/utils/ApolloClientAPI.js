import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink, createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';

export const MIDDLETIER_URL = "http://localhost:8080/graphql";
// export const MIDDLETIER_URL = "http://localhost:3000/graphql";
// export const MIDDLETIER_URL = "http://15.165.150.23/graphql";

export default function ApolloClientAPI(middletierURL = null) {
  const cache = new InMemoryCache({ addTypename: false });
  const httpLink = createHttpLink({ 
    uri: middletierURL ? middletierURL : MIDDLETIER_URL,
    credentials: "include",
    // fetchOptions: {
    //   mode: 'cors',
    // }
  });

  // const httpLink2 = new HttpLink({
  //   uri: middletierURL ? middletierURL : MIDDLETIER_URL,
  //   credentials: "include"
  // })

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
    link: authLink.concat(httpLink),
    cache
  });

  return {
    client: client,
    cache: cache,
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
