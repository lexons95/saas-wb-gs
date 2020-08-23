import GraphQLJSONObject from 'graphql-type-json';

import userResolver from './user';
import productResolver from './product';
import inventoryResolver from './inventory';
import orderResolver from './order';
import constantsResolver from './constants';


const defaultResolver = {
    JSONObject: GraphQLJSONObject
}
export default [
    defaultResolver,
    constantsResolver,
    userResolver,
    productResolver,
    inventoryResolver,
    orderResolver
];