import React from 'react';

const Layout01 = (props) => {

  return (
    <div id="layout01">
      <div className="wrapper layout01-wrapper">
        <div className="header">
          {props.header ? props.header : null}
        </div>
        <div className="content">
          {props.children ? props.children : null}
          <div className="footer">
            {props.footer ? props.footer : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout01;