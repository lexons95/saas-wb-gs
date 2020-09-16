import React, {useState, useEffect} from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from 'react-router-dom';
import { Button } from "antd";
import { gql, useQuery, useLazyQuery, useApolloClient } from '@apollo/client';
import './css/index.css';

import * as Component from './component/index.js';
import Login from './component/page/Login';
import Products from './component/page/Products';
import Inventory from './component/page/Inventory';
import Orders from './component/page/Orders';
import Promotions from './component/page/Promotions';
import Dashboard from './component/page/Dashboard';
import Configuration from './component/page/Configuration';
import Page01 from './component/page/component/Page01';

import { AuthContext } from "./utils/context/authContext";
import PrivateRoute from './utils/component/PrivateRoute';
import PublicRoute from './utils/component/PublicRoute';
import PageNotFound from './utils/component/PageNotFound';
import Loading from './utils/component/Loading';
import { DefaultClientAPI, useUserQuery, useConfigQuery, useConfigCache, useUserCache, setUserCache, setConfigCache, clearCache, useUserLazyQuery} from './utils/customHook';
import { userVar, configVar } from './utils/ApolloClient/cache';
// import { generateMigration } from './utils/hooks/generateMigration';
let Component_Layout = Component['Layout01'];
let Component_Header = Component['Header01'];

const GET_LOGGED_IN_USER = gql`
  query loggedInUser{
    loggedInUser{
        success
        message
        data
    }
  }
`

const GET_USER_CONFIG = gql`
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
const GET_USER_CACHE_QUERY = gql`
  query user {
    user @client {
      success
      message
      data {
        _id
        username
        configId
        role
      } 
    }
  }
`

const App = (props) => {
  const userCache = useUserCache();
  const configCache = useConfigCache();
  const [ isAuthenticated, setIsAuthenticated ] = useState(false); 

  const [ getLoggedInUser, { data: loggedInUser, loading: loadingLoggedUser }] = useUserLazyQuery();

  useEffect(()=>{
    getLoggedInUser()
  },[])

  useEffect(() => {
    if (!loadingLoggedUser) {
      if (userCache && configCache) {
        setIsAuthenticated(true)
      }
      else {
        setIsAuthenticated(false)
      }
    }
  }, [userCache,configCache])

  const handleAuth = (value) => {
    getLoggedInUser()
    setIsAuthenticated(value)
  }

  let isLoading = loadingLoggedUser;
  let userRole = userCache && userCache.success ? userCache.data.role : null;

  if (isLoading) {
    return <Loading/>
  }

  return (
    <AuthContext.Provider value={{isAuthenticated: isAuthenticated, setIsAuthenticated: handleAuth, userCache, configCache, fetchUser: getLoggedInUser}}>
      <Router>
        <Component_Layout
          header={isAuthenticated ? (<Component_Header/>) : null}
          //header={<Component_Header/>}
          footer={isAuthenticated ? "2020" : null}
        >
          {
            userRole == 'SUBTENANT' ? (
              <Switch>
                <PrivateRoute exact={true} path={'/'} component={Orders} />
                <PublicRoute restricted={true} exact={true} path={'/login'} component={Login} />
                <Route component={PageNotFound} />
              </Switch>
            ) : null
          }
          {
            userRole != 'SUBTENANT' ? (
              <Switch>
                <PrivateRoute exact={true} path={'/'} component={Dashboard} />
                <PrivateRoute exact={true} path={'/inventory'} component={Inventory} />
                <PrivateRoute exact={true} path={'/orders'} component={Orders} />   
                <PrivateRoute exact={true} path={'/promotions'} component={Promotions} />
                <PrivateRoute exact={true} path={'/configuration'} component={Configuration} />
                <PublicRoute restricted={true} exact={true} path={'/login'} component={Login} />
                <Route component={PageNotFound} />
              </Switch>
            ) : null
          }
        </Component_Layout>
      </Router>
    </AuthContext.Provider>
  )

}

export default App;
