import React, { useState, useEffect } from 'react';
import { Upload, Form, Button } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useLazyQuery, useMutation } from '@apollo/client';
import gql from 'graphql-tag';

import ImgCrop from 'antd-img-crop';

import awsS3API from '../../../utils/awsS3API';
import { useConfigCache, setConfigCache } from '../../../utils/customHook';


const UPDATE_CONFIG_QUERY = gql`
  mutation updateConfig($config: JSONObject, $configId: String!) {
    updateConfig(config: $config, configId: $configId) {
      success
      message
      data
    }
  }
`;

const handleImageInput = (fileList = [], defaultImage, fieldName) => {
  let changed = false;
  let current = defaultImage;
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
  const { defaultImage = "", label, name, limit: fileLimit = 1, handleFileList } = props;

  const configCache = useConfigCache();

  const [ fileList, setFileList ] = useState([]);

  const [ updateConfig, { loading: updateLoading } ] = useMutation(UPDATE_CONFIG_QUERY)

  const AWSS3API = awsS3API('mananml');

  useEffect(()=>{
    if (defaultImage) {
      setFileList([
        {
          uid: configCache.imageSrc + defaultImage,
          url: configCache.imageSrc + defaultImage
        }
      ])
    }
    else {
      setFileList([])
    }
  },[defaultImage]);

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div className="ant-upload-text">Upload</div>
    </div>
  );

  const handleFileListChange = ({ fileList }) => {
    setFileList(fileList)
  };

  let handleImageResult = handleImageInput(fileList, defaultImage, name);

  const handleUpdateImage = async () => {

    
    if (handleImageResult.changed) {
      updateConfig({
        variables: {
          config: {
            "profile.logo": handleImageResult.result
          },
          configId: configCache.configId
        },
        onCompleted: (result) => {
          console.log('UPDATE_CONFIG_QUERY',result.updateConfig.data.value);
          // setConfigCache(result.updateConfig.data.value)
        },
        onError: (error) => {
          console.log('UPDATE_CONFIG_QUERY err',error)
    
        }
      })

      // remove existing image
      if (handleImageResult.current != "") {
        console.log('removeee', handleImageResult.current)
        await AWSS3API.deleteOne(handleImageResult.current).then((result)=>{
          console.log('delete one result',result)

        }).catch((err)=>{
          console.log('delete one err',err)

        })
      }

      // upload new image
      if (handleImageResult.result != "") {
        let fileObj = fileList[0];
        await AWSS3API.getSignedUrl(handleImageResult.result, fileObj.type).then(async (result)=>{
          let signedUrl = result.data.getS3SignedUrl.data;
          await AWSS3API.uploadOneWithURL(signedUrl, fileObj).then(uploadResult=>{
            console.log('uploadOneWithURL',uploadResult)
          }).catch(uploadErr=>{
            console.log('uploadErr',uploadErr)
          })
        });
      }


    }
  }


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
      {
        handleImageResult.changed ? <Button shape={"circle"} onClick={handleUpdateImage} icon={<CheckOutlined />}/> : null
      }
    </Form.Item>
  )
}

export default ImageUpload2;