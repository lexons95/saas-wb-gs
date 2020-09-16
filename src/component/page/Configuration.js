import React, {useState, useEffect} from 'react';
import { Form, Upload, Input, Button, InputNumber, Select, Modal, message, Row, Col, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import gql from 'graphql-tag';
import { useLazyQuery, useMutation } from '@apollo/client';

import Page01 from './component/Page01';
import { useConfigCache, setConfigCache } from '../../utils/customHook';
import { showMessage } from '../../utils/component/notification';
import Loading from '../../utils/component/Loading';

import awsS3API from '../../utils/awsS3API';
import ImageCropper from './component/ImageCropper';
import 'antd/es/modal/style';
import 'antd/es/slider/style';

const UPDATE_CONFIG_QUERY = gql`
  mutation updateConfig($config: JSONObject, $configId: String!) {
    updateConfig(config: $config, configId: $configId) {
      success
      message
      data
    }
  }
`;

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

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

const Configuration = (props) => {
  const configCache = useConfigCache();
  const AWSS3API = awsS3API(configCache ? configCache.configId : null);

  const [ form ] = Form.useForm();
  const [ fileList, setFileList ] = useState([]);
  const [ logoFileList, setLogoFileList ] = useState([]);
  const [ avatarFileList, setAvatarFileList ] = useState([]);

  const [ updateConfig, { loading: updateLoading } ] = useMutation(UPDATE_CONFIG_QUERY,{
    onCompleted: async (result) => {
      setConfigCache(result.updateConfig.data.value)
      // console.log('result.updateConfig.data.value',result.updateConfig.data.value)
      showMessage({type: 'success', message: 'Success: Configuration Updated'})
    },
    onError: (error) => {
      showMessage({type: 'success', message: 'Error: Error while updating Configuration'})
    }
  })


  useEffect(()=>{
    if (configCache != null) {
      if (configCache.paymentQRImage && configCache.paymentQRImage != '') {
        setFileList([{
          uid: configCache.paymentQRImage,
          url: configCache.imageSrc + configCache.paymentQRImage,
          thumbUrl: configCache.imageSrc + configCache.paymentQRImage
        }])
      }
      // console.log('logoFileList',configCache.profile)

      if (configCache.profile && configCache.profile.logo && configCache.profile.logo != '') {
        setLogoFileList([{
          uid: configCache.profile.logo,
          url: configCache.imageSrc + configCache.profile.logo,
          thumbUrl: configCache.imageSrc + configCache.profile.logo
        }])
      }

      if (configCache.profile && configCache.profile.avatar && configCache.profile.avatar != '') {
        setAvatarFileList([{
          uid: configCache.profile.avatar,
          url: configCache.imageSrc + configCache.profile.avatar,
          thumbUrl: configCache.imageSrc + configCache.profile.avatar
        }])
      }

      form.setFieldsValue({
        notice: configCache.profile.notice,
        delivery: configCache.delivery
      })
    }
  },[configCache]);

  const handleFileUpload = async (imageStatus, fileList) => {
    if (imageStatus.changed) {

      // remove existing image
      if (imageStatus.current && imageStatus.current != "") {
        console.log('removeee', imageStatus.current)
        await AWSS3API.deleteOne(imageStatus.current).then((result)=>{
          console.log('delete one result',result)

        }).catch((err)=>{
          console.log('delete one err',err)

        })
      }

      // upload new image
      if (imageStatus.result && imageStatus.result != "") {
        let fileObj = fileList[0];
        await AWSS3API.getSignedUrl(imageStatus.result, fileObj.type).then(async (result)=>{
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

  const handlePreviewOpen = async (file) => {
    console.log('fileeee preview', file)
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    Modal.info({
      title: file.name,
      content: (
        <img alt={`preview: ${file ? file.name : ""}`} style={{ width: '100%' }} src={file ? file.preview : ''} />
      )
    })
  };

  const handleCheckFile = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 3;
    if (!isLt2M) {
      message.error('Image must smaller than 3MB!');
    }
    return isJpgOrPng && isLt2M;
  }

  const handleOnImageChange = (fileList=[], setFile) => {
    console.log('fileList',fileList)
    
    let file = fileList.length > 0 ? fileList[0] : null;
    if (file) {
      let filePassed = handleCheckFile(file);
      if (filePassed) {
        const fileSizeLimit = 1000000 // 1MB
        if (file.size >= fileSizeLimit) {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
  
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const currentWidth = img.width;
              const currentHeight = img.height;
              const newRatio = 0.7;
              let newWidth = currentWidth * newRatio;
              let newHeight = currentHeight * newRatio
              canvas.width = newWidth;
              canvas.height = newHeight;
  
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
              ctx.canvas.toBlob(function(blob){
                let imageFile = new File([blob],file.name,{ 
                  lastModified: new Date().getTime(), 
                  type: file.type 
                });
                let newImageObj = Object.assign({},file,{
                  originFileObj: imageFile, 
                  size: imageFile.size
                })

                // var newImg = document.createElement('img'),
                // url = URL.createObjectURL(blob);
    
                // newImg.onload = function() {
                //   // no longer need to read the blob so it's revoked
                //   URL.revokeObjectURL(url);
                // };
    
                
                setFile([newImageObj])
              }, file.type, 0.95);
            };
          };
          
        }
        else {
          setFile(fileList)
        }
      }
      else {
        setFile([])
      }
    }
    else {
      setFile([])
    }
  }

  const resizeFile = (file) => {
    let result = file;
    if (file) {
      let filePassed = handleCheckFile(file);
      if (filePassed) {
        const fileSizeLimit = 1000000 // 1MB
        if (file.size >= fileSizeLimit) {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
  
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const currentWidth = img.width;
              const currentHeight = img.height;
              const newRatio = 0.7;
              let newWidth = currentWidth * newRatio;
              let newHeight = currentHeight * newRatio
              canvas.width = newWidth;
              canvas.height = newHeight;
  
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
              ctx.canvas.toBlob(function(blob){
                let imageFile = new File([blob],file.name,{ 
                  lastModified: new Date().getTime(), 
                  type: file.type 
                });
                let newImageObj = Object.assign({},file,{
                  originFileObj: imageFile, 
                  size: imageFile.size
                })
                result = newImageObj;
              }, file.type, 0.95);
            }
          } 
        }
      }
    }
    return result;
  }

  const handleSubmit = async (values) => {

    let setter = {
      'profile.notice': values.notice,
      'delivery': values.delivery
    }

    if (configCache && configCache.configId) {
      let paymentImageStatus = handleImageInput(fileList, configCache.paymentQRImage, 'payment')
      let logoImageStatus = handleImageInput(logoFileList, configCache.profile.logo, 'logo')
      let avatarImageStatus = handleImageInput(avatarFileList, configCache.profile.avatar, 'avatar')

      if (paymentImageStatus.changed) {
        setter['paymentQRImage'] = paymentImageStatus.result;
      }
      if (logoImageStatus.changed) {
        setter['profile.logo'] = logoImageStatus.result;
      }
      if (avatarImageStatus.changed) {
        setter['profile.avatar'] = avatarImageStatus.result;
      }

      // proper way should be update config first then upload file
      // but because the update local cache is inside updateConfig (onCompleted)
      // the page will be refreshed before the file is uploaded while reading the updated file name in config
      // which will cause the file not found

      await handleFileUpload(paymentImageStatus, fileList);
      await handleFileUpload(logoImageStatus, logoFileList);
      await handleFileUpload(avatarImageStatus, avatarFileList);

      updateConfig({
        variables: {
          config: setter,
          configId: configCache.configId
        }
      })

      // this way not working, the onCompleted wont execute
      // updateConfig({
      //   variables: {
      //     config: setter,
      //     configId: configCache.configId
      //   },
      //   onCompleted: async (result) => {
      //     console.log('UPDATE_CONFIG_QUERY',result.updateConfig.data.value);
      //     await handleFileUpload(paymentImageStatus, fileList);
      //     await handleFileUpload(logoImageStatus, logoFileList);
      //     setConfigCache(result.updateConfig.data.value)
      //     showMessage({type: 'success', message: 'Success: Configuration Updated'})
      //   },
      //   onError: (error) => {
      //     console.log('UPDATE_CONFIG_QUERY err',error)
      //     showMessage({type: 'success', message: 'Error: Error while updating Configuration'})
    
      //   }
      // })


    }


  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div className="ant-upload-text">Upload</div>
    </div>
  );

  // additional charges to set in config
  // cart limitation to place order: total weight/price/quantity
  return (
    <Page01
      title={"Configuration"}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Divider orientation="left">Profile</Divider>

        <Row gutter={24}>
          <Col>
            <Form.Item label="Logo" name="logo">
              <Upload
                action={(file) => {}}
                accept="image/*"
                beforeUpload={ (file) => {
                  console.log("beforeUpload",file)
                  return false;
                }}
                listType="picture-card"
                fileList={logoFileList}
                onChange={({ fileList }) => {
                  handleOnImageChange(fileList,setLogoFileList)
                }}
              >
                {logoFileList.length < 1 ? uploadButton : null}
              </Upload>
            </Form.Item>
          </Col>
          <Col>
            <Form.Item label="Avatar" name="avatar">
              <Upload
                action={(file) => {}}
                accept="image/*"
                beforeUpload={ (file) => {
                  console.log("beforeUpload",file)
                  return false;
                }}
                listType="picture-card"
                fileList={avatarFileList}
                onChange={({ fileList }) => {
                  handleOnImageChange(fileList,setAvatarFileList)
                }}
              >
                {avatarFileList.length < 1 ? uploadButton : null}
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Payment</Divider>
        <Row gutter={24}>
          <Col>
            <Form.Item label="Payment QR" name="paymentQRImage">
              {/* <ImgCrop rotate> */}
                <Upload
                  accept="image/*"
                  beforeUpload={ (file) => {
                    console.log("beforeUpload",file)
                    return false;
                  }}
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreviewOpen}
                  onChange={({ fileList }) => {
                    handleOnImageChange(fileList,setFileList)
                  }}
                >
                  {fileList.length < 1 ? uploadButton : null}
                </Upload>
              {/* </ImgCrop> */}
            </Form.Item>
          </Col>
          <Col>
            <Form.Item label="Shipping Fee (Fixed)" name="delivery">
              <InputNumber/>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Others</Divider>

        <Form.Item label="Notice" name="notice">
          <Input.TextArea/>
        </Form.Item>

        
        
        
        <Form.Item>
          <Button type="primary" onClick={()=>{form.submit()}}>Save</Button>
        </Form.Item>
      </Form>
      {/* <ImageCropper imageFile={fileList.length > 0 ? fileList[0] : null} /> */}
      {/* <Form>
        
        Shipping Section

        <Form.Item label="Type">
            <Select options={[
              {
                label: "Fixed",
                value: 'op1'
              },
              {
                label: "Ranged",
                value: 'op2'
              }
            ]}/>
        </Form.Item>
        <Form.Item label="fixed amount">
          <Input/>
        </Form.Item>
        <Form.Item label="ranged amount">
          <Input/>
        </Form.Item>
      </Form> */}
      {
        updateLoading ? <Loading/> : null
      }
    </Page01>
  )
}

export default Configuration;