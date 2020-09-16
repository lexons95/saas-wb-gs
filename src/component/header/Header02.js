import React, { useState } from 'react';
import { Drawer, Badge } from 'antd';
import {
  MenuOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

const Header02 = (props) => {
  const [ drawerStatus, setDrawerStatus ] = useState(false);
  const handleDrawerOpen = () => {
    setDrawerStatus(true)
  }
  const handleDrawerClose = () => {
    setDrawerStatus(false)
  }

  const getNavItem = () => {

  }

  return (
    <React.Fragment>
      <header id="header02">
        <div className="menu-item" onClick={handleDrawerOpen}>
          <MenuOutlined
            style={{fontSize:"16px"}}
          />
        </div>
        <div className="menu-title">
          Title
        </div>
        <div className="menu-item">
          <Badge count={1}>
            <ShoppingOutlined 
              style={{fontSize:"18px"}}
            />
          </Badge>
        </div>
      </header>
      <Drawer
          title="Menu"
          placement="left"
          closable={true}
          onClose={handleDrawerClose}
          visible={drawerStatus}
        >
          {getNavItem()}
        </Drawer>
    </React.Fragment>
  );
}

export default Header02;