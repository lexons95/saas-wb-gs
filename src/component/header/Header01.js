import React, { useState } from 'react';
import { useMutation, useApolloClient } from '@apollo/client';
import gql from "graphql-tag";
import { useHistory, NavLink } from "react-router-dom";
import { Button, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import confirmation from '../../utils/component/confirmation';
import Loading from '../../utils/component/Loading';
import { useConfigCache, clearCache, useUserCache } from '../../utils/customHook';
import { useAuth } from '../../utils/context/authContext';

const LOGOUT_MUTATION = gql`
    mutation logout {
      logout {
        success
        message
        data
      }
    }
`;

const Header01 = (props) => {
  const apolloClient = useApolloClient();
  const { configCache, userCache } = useAuth();
  const [ logout ] = useMutation(LOGOUT_MUTATION, {
    onCompleted: (result) => {
      if (result && result.logout && result.logout.success) {
        clearCache()
        apolloClient.clearStore()
      }
    }
  });

  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const handleMenuOpen = () => {
    setMenuCollapsed(true)
  }
  const handleMenuClose = () => {
    setMenuCollapsed(false)
  }

  const handleLogout = () => {
    confirmation('confirm', 'Confirm Logout?', ()=>{
      logout();
    })
  }

  let menuItem = [
    {
      name: 'Orders',
      icon: null,
      route: '/'
    }
  ]

  if (userCache && userCache.success && userCache.data) {
    if (userCache.data.role == "TENANT") {
      menuItem = [
        // {
        //   name: 'Products',
        //   icon: null,
        //   route: '/products'
        // },
        {
          name: 'Dashboard',
          icon: null,
          route: '/'
        },
        {
          name: 'Inventory',
          icon: null,
          route: '/inventory'
        },
        {
          name: 'Orders',
          icon: null,
          route: '/orders'
        },
        {
          name: 'Promotions',
          icon: null,
          route: '/promotions'
        },
        {
          name: 'Configuration',
          icon: null,
          route: '/configuration'
        }
      ]
    }
  }

  const getMenuItemDisplay = () => {

    let result = [];
    menuItem.map((aMenuItem,index)=>{
      let buttonProps = {
        shape: 'circle'
      }
      if (menuCollapsed) {
        buttonProps['shape'] = 'circle';
      }
      else {
        buttonProps['type'] = 'link'
      }

      result.push(
        <NavLink key={index} exact={true} to={aMenuItem.route} className="header01-item" activeClassName="header01-activeLink">
          {
            menuCollapsed ? 
            <Tooltip title={aMenuItem.name} placement="right">
              <Button {...buttonProps}>{aMenuItem.name[0].toUpperCase()}</Button>
            </Tooltip>
            : <span>{aMenuItem.name}</span>
          }
        </NavLink>
      )
 
    });
    return result;
  }

  return (
    <header id="header01" data-header-collapsed={menuCollapsed}>
      <div className="header01-header">
        <div className="header01-item collapse-btn">
           <Button 
              shape="circle" 
              type="link"
              shape="circle"
              icon={<ArrowLeftOutlined rotate={menuCollapsed ? 180 : 0} />} 
              onClick={menuCollapsed ? handleMenuClose : handleMenuOpen}
            />
          {/* <ArrowLeftOutlined rotate={menuCollapsed ? 180 : 0} onClick={menuCollapsed ? handleMenuClose : handleMenuOpen} /> */}
        </div>
      </div>

      <div className="header01-content">
        {getMenuItemDisplay()}
      </div>
      <div className="header01-footer">
        {
          configCache && userCache && userCache.success && !menuCollapsed ? (
            <>
              <div className="header01-item" style={{cursor: 'default'}}>
                { userCache.data.username }
              </div>
              <div className="header01-item" style={{cursor: 'default'}}>
                { configCache.profile.name }
              </div>
            </>
          ) : null
        }
        <div className="header01-item" onClick={handleLogout}>
          {
            menuCollapsed ?
                <Tooltip title="Logout" placement="right">
                  <Button 
                    shape="circle" 
                    icon={<LogoutOutlined />} 
                  />
                </Tooltip>
              : 
              <span>Logout</span>
          }
        </div>
      </div>
    </header>
  );
}

export default Header01;