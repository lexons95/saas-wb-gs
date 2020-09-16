import React from 'react';

const Layout02 = (props) => {

  return (
    <React.Fragment>
      <div className="layout02-header">
        {props.header ? props.header : null}
      </div>
      <div className="layout02-content">
        {props.children ? props.children : null}
        <div className="layout02-footer">
          {props.footer ? props.footer : null}
        </div>
      </div>
    </React.Fragment>
  );
}

export default Layout02;