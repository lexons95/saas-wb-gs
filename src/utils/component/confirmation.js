
import React from 'react';
import { Modal, Button } from 'antd';
import {
  ExclamationCircleOutlined
} from '@ant-design/icons';

const confirmation = (type, content, callback = null) => {
  // type: confirm/warning/info/error
  const config = {
    title: type && typeof(type) == 'string' ? type.toUpperCase() : "...",
    icon: <ExclamationCircleOutlined />,
    content: content,
    okType: 'danger',
    onCancel: ()=>{
      Modal.destroyAll();
    }
  };
  if (callback != null) {
    config['onOk'] = callback;
  }
  Modal[type](config);
}

export default confirmation;