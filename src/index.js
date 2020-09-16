import React from 'react';
import { ApolloProvider } from '@apollo/client';
// import { render } from 'react-snapshot';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { DefaultClientAPI } from './utils/customHook';
// import ApolloClientAPI from './utils/ApolloClient/ApolloClientAPI';
// export const DefaultClientAPI = ApolloClientAPI();

const { client } = DefaultClientAPI;

const init = () => {
  ReactDOM.render((
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>
  ),document.getElementById('root'));
}

init();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
