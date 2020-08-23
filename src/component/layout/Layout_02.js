import React from 'react';

const Layout_02 = (props) => {

  return (
    <React.Fragment>
      <div className="layout_02-header">
        {props.header ? props.header : null}
      </div>
      <div className="layout_02-content">
        {props.children ? props.children : null}
        <div className="layout_02-footer">
          {props.footer ? props.footer : null}
        </div>
      </div>
    </React.Fragment>
  );
}

export default Layout_02;