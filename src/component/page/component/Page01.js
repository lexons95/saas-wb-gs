import React from 'react';
import { PageHeader } from 'antd';

const Page01 = (props) => {
  const {children, ...rest} = props;
  return (
    <React.Fragment>
      <div id="page01">
        <PageHeader
          {...rest}
        >
          {props.children}
        </PageHeader>
      </div>
    </React.Fragment>
  )
  // return (
  //   <React.Fragment>
  //     <div id="page01">
  //       <PageHeader
  //         {...rest}
  //       >
  //       </PageHeader>
  //       {props.children}
  //     </div>
  //   </React.Fragment>
  // )
}

export default Page01;