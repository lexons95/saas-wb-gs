import React, { useState, useEffect } from 'react';
import { Upload, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import ImgCrop from 'antd-img-crop';


const handleImageInput = (fileList = [], defaultConfigValue, fieldName) => {
  let changed = false;
  let current = defaultConfigValue;
  let result = "";
  if (fileList.length > 0) {
    if (fileList[0].originFileObj && current != fileList[0].name) {
      let imageNameSplited = fileList[0].name.split('.');
      let newImageName = `saas_${fieldName}_${new Date().getTime()}_${imageNameSplited[imageNameSplited.length - 2]}.${imageNameSplited[imageNameSplited.length - 1]}`;
      result = newImageName;
      changed = true;
    }
  }
  else {
    if (current != "") {
      result = "";
      changed = true;
    }
  }

  return {
    changed: changed,
    current: current,
    result: result
  }
}

const ImageUpload2 = (props) => {
  const { defaultImage, label, name, limit: fileLimit = 1, handleFileList } = props;

  const [ fileList, setFileList ] = useState([]);

  useEffect(()=>{
    if (defaultImage) {
      setFileList([
        {
          uid: defaultImage,
          url: defaultImage
        }
      ])
    }
    else {
      setFileList([])
    }
  },[defaultImage])

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div className="ant-upload-text">Upload</div>
    </div>
  );

  const handleFileListChange = ({ fileList }) => {
    setFileList(fileList)
  };

  return (
    <Form.Item label={label} name={name}>
      <Upload
        accept="image/*"
        beforeUpload={ (file) => {
          console.log("beforeUpload",file)
          return false;
        }}
        //multiple={true}
        listType="picture-card"
        fileList={fileList}
        onChange={handleFileListChange}
      >
        {fileList.length < fileLimit ? uploadButton : null}
      </Upload>
    </Form.Item>
  )
}

export default ImageUpload2;