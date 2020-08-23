import React from 'react';

const Layout_01 = (props) => {

  return (
    <div id="layout_01">
      <div className="wrapper layout_01-wrapper">
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

export default Layout_01;