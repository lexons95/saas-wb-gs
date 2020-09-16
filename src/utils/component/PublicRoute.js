import React from 'react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const PublicRoute = ({ component: Component, restricted, ...rest }) => {
  let routeLocation = useLocation();
  const { isAuthenticated } = useAuth();

  let defaultRoute = "/";
  if (routeLocation && routeLocation.state && routeLocation.state.from && routeLocation.state.from.pathname) {
    defaultRoute = routeLocation.state.from.pathname;
  }

  return (
    // restricted = false meaning public route
    // restricted = true meaning restricted route
    <Route {...rest} render={props => (
      isAuthenticated && restricted ?
        <Redirect to={{
            pathname: defaultRoute,
            state: { from: routeLocation }
        }} />
        : <Component {...props}/>
    )} />
  );
};

export default PublicRoute;