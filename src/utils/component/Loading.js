import React, {useState} from 'react';
import {
  LoadingOutlined
} from '@ant-design/icons';

const Loading = (props) => {
  const [showLoading, setShowLoading] = useState(true);

  if (showLoading) {
    return (
      <div className="loading">
        <LoadingOutlined/>
      </div>
    )
  }
  return null;
}

export default Loading;