import React, {useState, useEffect} from 'react';
import { Button, Form, Input, Upload, Modal, Switch, Collapse, Select, Divider, Tabs, Space, message } from 'antd';
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import { PlusOutlined, StarOutlined, StarFilled, ExclamationCircleOutlined } from '@ant-design/icons';
import gql from "graphql-tag";

import confirmation from '../../../utils/component/confirmation';
import { showMessage } from '../../../utils/component/notification';
import InventoryFormTable2 from './InventoryFormTable2';
import InventoryFormTable3 from './InventoryFormTable3';

import { useConfigCache } from '../../../utils/customHook';
import Loading from '../../../utils/component/Loading';
import awsS3API from '../../../utils/awsS3API';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

const GET_PRODUCT_BY_ID_QUERY = gql`
  query product($_id: String!, $configId: String) {
    product(_id: $_id, configId: $configId) {
      _id
      createdAt
      updatedAt
      name
      subName
      description
      category
      variants
      tags
      type
      published
      images
    }
  }
`;

const CREATE_NEW_PRODUCT_QUERY = gql`
  mutation createProduct($product: JSONObject!) {
    createProduct(product: $product) {
      success
      message
      data
    }
  }
`;

const DELETE_PRODUCT_QUERY = gql`
  mutation deleteProduct($_id: String!) {
    deleteProduct(_id: $_id) {
      success
      message
      data
    }
  }
`;

const UPDATE_PRODUCT_QUERY = gql`
  mutation updateProduct($product: JSONObject!) {
    updateProduct(product: $product) {
      success
      message
      data
    }
  }
`;

// convert db image obj to match Upload Component format
const getDefaultImageArray = (array, config) => {
  let imageSrc = config.imageSrc;
  return array.map((anImage)=>{
    let newImageObj = Object.assign({},anImage)
    newImageObj['uid'] = anImage.name;
    newImageObj['url'] = imageSrc + anImage.name;
    newImageObj['thumbUrl'] = imageSrc + anImage.name;
    if (newImageObj.fav) {
      //anImage['status'] = 'done';
    }
    return newImageObj;
  })
}

// mainly for image upload/delete in aws
const getImageFilesToModify = (defaultArray = [], newArray = []) => {
  let newImageToUpload = [];
  let currentUploadedImages = [];
  let imagesToDelete = []
  let allImages = []

  newArray.map((anImage,index)=>{
    // new image to be uploaded
    let newImageName = anImage.name;
    if (anImage.originFileObj) {
      let imageNameSplited = newImageName.split('.');
      newImageName = `saas_${index}_${new Date().getTime()}_${imageNameSplited[imageNameSplited.length - 2]}.${imageNameSplited[imageNameSplited.length - 1]}`;
      anImage['name'] = newImageName;
      newImageToUpload.push(anImage)
    }
    // uploaded images
    else {
      currentUploadedImages.push(anImage)
    }
    // convert Upload Component image obj to match db format
    allImages.push({
      name: newImageName,
      fav: anImage.fav ? anImage.fav : false
    })
  });

  defaultArray.map((anImage)=>{
    let foundIndex = currentUploadedImages.map((anUploadedImage)=>anUploadedImage.name).indexOf(anImage.name);
    if (foundIndex < 0) {
      imagesToDelete.push(anImage);
    }
  })

  return {
    upload: newImageToUpload,
    delete: imagesToDelete,
    allImages: allImages,
    uploaded: defaultArray
  };
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

const modalBodyStyle = {
  position: 'relative', 
  overflow: 'hidden', 
  padding: 0
}

const modalContentWrapperStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

const ProductForm2 = (props) => {
  const { productId = null, categories = [], tags = [], type: productType = "", refetchList, visible ,onCancel } = props;

  const configCache = useConfigCache();
  const AWSS3API = awsS3API(configCache ? configCache.configId : null);
  
  const [ tabActiveKey, setTabActiveKey ] = useState("1");
  const [ formValueChanged, setFormValueChanged ] = useState(false);
  const [ form ] = Form.useForm();

  // product
  let productTypeOptions = configCache && configCache.productTypes ? configCache.productTypes : [];
  const [ productCategory, setProductCategory ] = useState([]);
  const [ productTags, setProductTags ] = useState([]);
  const [ newCategoryName, setNewCategoryName ] = useState('');
  const [ newTagName, setNewTagName ] = useState('');
  const [ productVariants, setProductVariants ] = useState({'sku': 'SKU'});

  // product images
  const fileLimit = configCache && configCache.productImageLimit ? configCache.productImageLimit : 4;
  const [ fileList, setFileList ] = useState([]);
  const [ previewVisible, setPreviewVisible ] = useState(false);
  const [ previewImage, setPreviewImage ] = useState(null);

  const { data: productData, loading: loadingProduct, error, refetch: refetchProduct } = useQuery(GET_PRODUCT_BY_ID_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      _id: productId ? productId : "",
      configId: configCache ? configCache.configId : null
    },
    skip: !productId || !configCache,
    onError: (error) => {
      console.log("product error", error)

    },
    onCompleted: (result) => {
      // console.log('fetched product', result)
    }
  });

  let product = productData && productData.product ? productData.product : null;


  useEffect(() => {
    if (visible) {
      setProductCategory(categories)
      setProductTags(tags)

      if (product) {
        let productObj = Object.assign({},product);
        if (product.category && product.category.length > 0) {
          let newCategoryFormat = product.category.map((aCategory)=>{
            return {
              key: aCategory._id,
              label: aCategory.name
            }
          })
          productObj['category'] = newCategoryFormat[0];
        }

        if (!product.type) {
          productObj['type'] = undefined;
        }

        form.setFieldsValue(productObj);

        if (product.variants) {
          setProductVariants(product.variants)
        }
        if (product.images && product.images.length > 0) {
          setFileList(getDefaultImageArray(product.images, configCache));
        }
  
      }
      else {
        setFileList([]);
      }
    }
    else {
      setFormValueChanged(false);
      form.resetFields();
    }
    
  }, [visible, product]);


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


  const handleReaderOnloadPromise = (reader) => {
    return new Promise((resolve, reject)=>{
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        return resolve(img)
      }
    })
  }
  const handleImgOnloadPromise = (img) => {
    return new Promise((resolve, reject)=>{
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
        return resolve(ctx)
      }
    })
  }
  const handleToBlobPromise = (canvas, file) => {
    return new Promise((resolve, reject)=>{
      canvas.toBlob(function(blob){
        let imageFile = new File([blob],file.name,{ 
          lastModified: new Date().getTime(), 
          type: file.type 
        });
        let newImageObj = Object.assign({},file,{
          originFileObj: imageFile, 
          size: imageFile.size,
          uid: file.name
        })
        resolve(newImageObj);
      }, file.type, 0.9);
    })
  }

  const resizeFile = async (file) => {
    let result = file;
    if (file) {
      let filePassed = handleCheckFile(file);
      if (filePassed) {
        const fileSizeLimit = 1000000 // 1MB
        if (file.size >= fileSizeLimit) {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          let img = await handleReaderOnloadPromise(reader);
          let ctx = await handleImgOnloadPromise(img);
          let newFile = await handleToBlobPromise(ctx.canvas, file);
          result = newFile;
        }
      }
    }
    return result;
  }

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div className="ant-upload-text">Upload</div>
    </div>
  );

  const handleFileListChange = async ({ fileList, ...rest }) => {

    let fileList2 = fileList;
    if (fileList.length > fileLimit) {
      fileList2 = fileList.slice(0, fileLimit-1);
    }

    const handleFiles = async () => {
      
      let result = [];
      for (const aFile of fileList2) {
        if (aFile.originFileObj) {
          result.push(await resizeFile(aFile))
        }
        else {
          result.push(aFile);
        }
      }
      return result
    }
    let result = await handleFiles();

    if (result.length > 0) {
      let foundFavImage = result.find((anImage)=>anImage.fav);
      if (!foundFavImage) {
        result[0]['fav'] = true;
      }
    }

    setFormValueChanged(true)
    setFileList(result)
  };
  const handleFavImageChange = () => {
    let newFileList = [].concat(fileList)
    newFileList.map((aFile)=>{
      if (aFile.name == previewImage.name) {
        aFile['fav'] = true;
      }
      else {
        aFile['fav'] = false;
      }
      return aFile;
    });
    setFileList(newFileList);
  }

  const handlePreviewOpen = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewVisible(true);
    setPreviewImage(file);
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
  }

  const [createProduct, createProductResult ] = useMutation(CREATE_NEW_PRODUCT_QUERY,{
    onCompleted: (result) => {
      // console.log("createProduct result",result)
      onCancel();
      refetchList();
      // refetchProduct();
      showMessage({type: 'success', message: 'Success: Product Created'});

    }
  })
  const [deleteProduct, deleteProductResult] = useMutation(DELETE_PRODUCT_QUERY,{
    onCompleted: (result) => {
      // console.log("deleteProduct result",result)
      onCancel();
      refetchList();
      // refetchProduct();
      showMessage({type: 'success', message: 'Success: Product deleted'});
    }
  })
  const [updateProduct, updateProductResult ] = useMutation(UPDATE_PRODUCT_QUERY,{
    onCompleted: (result) => {
      // console.log("updateProduct result",result)
      // onCancel();
      refetchProduct();
      refetchList();
      setFormValueChanged(false);
      showMessage({type: 'success', message: 'Success: Product Updated'});
    }
  })

  let isLoading = loadingProduct ||
                  createProductResult.loading ||
                  deleteProductResult.loading ||
                  updateProductResult.loading;

  const handleUpdateProductInfo = async (values) => {

    const { images, category, ...restValues } = values;
    let finalProductValue = {
      ...restValues,
      type: "",
      category: [],
      //images: [], 
      variants: productVariants
    }

    if (!values._id) {
      delete finalProductValue._id;
    }

    if (values.type) {
      finalProductValue['type'] = values.type;
    }

    // handle category
    if (values.category) {
      let foundSelectedCategory = productCategory.find(aCategory=>aCategory._id == values.category.key);
      if (foundSelectedCategory && foundSelectedCategory._id) {
        finalProductValue['category'] = [foundSelectedCategory];
      }
    }

    // handle images
    let imagesToBeModified = getImageFilesToModify(product && product.images ? product.images : [], fileList);

    // if (imagesToBeModified.upload.length > 0 || imagesToBeModified.delete.length > 0) {
    finalProductValue['images'] = imagesToBeModified.allImages;
    // }


    if (imagesToBeModified.upload.length > 0) {
      let signedUrlsResult =  await AWSS3API.getManySignedUrl(imagesToBeModified.upload)
      let urls = signedUrlsResult.data.getManyS3SignedUrl.data;
      let filesToBeUploaded = [];
      urls.forEach((anItem)=>{
        let foundFile = imagesToBeModified.upload.find(aFile=>aFile.name==anItem.name);
        if (foundFile) {
          filesToBeUploaded.push({
            url: anItem.url,
            file: foundFile
          })
        }
      });
      if (filesToBeUploaded.length > 0) {
        let uploadResults = await AWSS3API.uploadManyWithURL(filesToBeUploaded)
        // console.log('uploadResults', uploadResults)
      }
    }
    if (imagesToBeModified.delete.length > 0) {
      let deleteManyResult = await AWSS3API.deleteMany(imagesToBeModified.delete)
    }

    console.log('finalProductValue',finalProductValue)

    if (!product) {
      createProduct({
        variables: {
          product: finalProductValue
        }
      })
    }
    else {
      updateProduct({
        variables: {
          product: {...finalProductValue, _id: product._id}
        }
      })
    }
  }

  const onDeleteProduct = () => {
    confirmation('confirm',"Confirm delete?",async ()=>{
      let imagesToBeModified = getImageFilesToModify(product && product.images ? product.images : [], fileList);

      if (imagesToBeModified.delete.length > 0) {
        let deleteManyResult = await AWSS3API.deleteMany(imagesToBeModified.delete)
      }
      deleteProduct({variables:{_id: product._id}})
    })
  }

  // const checkFormTouched = () => {
  //   console.log('isFieldsTouched',form.isFieldTouched('name'));
  // }

  const onCategoryNameChange = (e) => {
    setNewCategoryName(e.target.value);
  }

  const addNewCategory = () => {
    if (newCategoryName && newCategoryName != "") {
      setProductCategory([...productCategory, {
        _id: `category_${newCategoryName}_${new Date().getTime()}`,
        name: newCategoryName
      }]);
      setNewCategoryName('')
    }
  }

  const onTagNameChange = (e) => {
    setNewTagName(e.target.value);
  }

  const addNewTag = () => {
    if (newTagName && newTagName != "") {
      let foundTagIndex = productTags.indexOf(newTagName);
      if (foundTagIndex < 0) {
        setProductTags([...productTags, newTagName]);
        setNewTagName('')
      }
    }
  }

  const getModalFooter = () => {
    let result = null;
    if (tabActiveKey == "1") {
      let modalFooter = []
    
      if (product) {
        modalFooter.unshift(
          <Button key={'delete'} type="danger" onClick={onDeleteProduct}>
            Delete
          </Button>
        )
      }
      result = modalFooter;
    }
    // else if (tabActiveKey == "2") {
    //   result = [
    //     <Button key={'cancel'} onClick={onCancel}>
    //       Cancel
    //     </Button>,
    //     <Button key={'submit'} type="primary" onClick={()=>{}}>
    //       {product ? "Save" : "Save"}
    //     </Button>
    //   ]
    // }

    return result;
  }

  const getPreviewModalFooter = () => {
    let isFav = previewImage && previewImage.fav;
    return (
      <Button 
        type={isFav ? 'primary': 'default'} 
        icon={isFav ? (<StarFilled style={{color: 'gold'}}/>) : (<StarOutlined/>) } 
        onClick={handleFavImageChange}
      >
        Favourite
      </Button>
    )
  } 

  const handleTabClick = (key) => {
    if (formValueChanged) {
      Modal.confirm({
        title: 'You have made changes, do you want to save?',
        icon: <ExclamationCircleOutlined />,
        //content: 'Some descriptions',
        okText: 'Yes',
        cancelText: 'No',
        onOk() {
          form.submit();
          setTabActiveKey(key);
        },
        onCancel() {
          setTabActiveKey(key)
        },
      });
      setFormValueChanged(false);
    }
    else {
      setTabActiveKey(key)
    }

    if (key == '1') {
      refetchProduct()
    }
  }

  return (
    <Modal
      title={product ? `${product.name}` : "New Product"}
      width={'95%'}
      visible={visible}
      onCancel={onCancel}
      destroyOnClose
      wrapClassName={'products-modalWrapper'}
      //bodyStyle={{paddingLeft:'0'}} //for left tab
      style={{overflow:"hidden"}}
      bodyStyle={modalBodyStyle}
      footer={null}
    >
      <div style={modalContentWrapperStyle}>
        <div id="productForm2">
          <Tabs 
            defaultActiveKey="1"
            activeKey={tabActiveKey} 
            tabPosition="top"
            onTabClick={handleTabClick}
          >
            <TabPane tab="Product Information" key="1">
              <div className="productForm-tab-container">
                <div className="productForm-tab-content">
                  <div className="productForm-productInfo-container">
                    <Form 
                      name="complex-form" 
                      form={form} 
                      onFinish={handleUpdateProductInfo} 
                      labelCol={{ span: 5 }} 
                      wrapperCol={{ span: 16 }} 
                      onValuesChange={(changedValues, allValues)=>{
                        setFormValueChanged(true)
                      }}
                    >
                      {
                        !product ? (
                          <Form.Item name={'_id'} label="ID">
                            <Input />
                          </Form.Item> 
                        ) : null
                      }
                      <Form.Item name={'name'} label="Name" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                      <Form.Item name={'description'} label="Description">
                        <Input.TextArea rows={4} />
                      </Form.Item>
                      <Form.Item name={'type'} label="Type">
                        <Select
                          style={{ width: 240 }}
                          allowClear={true}
                        >
                          {
                            productTypeOptions.map((anOption, index)=>{
                              return (<Option key={index} value={anOption.value}>{anOption.name}</Option>)
                            })
                          }
                        </Select>
                      </Form.Item>
                      <Form.Item name={'category'} label="Category">
                        <Select
                          style={{ width: 240 }}
                          placeholder="Select a category"
                          labelInValue={true}
                          allowClear={true}
                          dropdownRender={menu => (
                            <div>
                              {menu}
                              <Divider style={{ margin: '4px 0' }} />
                              <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                                <Input style={{ flex: 'auto' }} value={newCategoryName} onChange={onCategoryNameChange} required={true}/>
                                <Button
                                  type="link"
                                  icon={<PlusOutlined />}
                                  onClick={addNewCategory}
                                  disabled={newCategoryName.trim() != "" ? false : true}
                                >
                                  New
                                </Button>
                              </div>
                            </div>
                          )}
                        >
                          {productCategory.map((item, index) => (
                            <Option key={index} value={item._id}>{item.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item name={'tags'} label="Tags">
                        <Select
                          mode={"tags"}
                          //maxTagCount={2}
                          placeholder="Select Tags"
                          dropdownRender={menu => (
                            <div>
                              {menu}
                              <Divider style={{ margin: '4px 0' }} />
                              <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                                <Input style={{ flex: 'auto' }} value={newTagName} onChange={onTagNameChange} required={true}/>
                                <Button
                                  type="link"
                                  icon={<PlusOutlined />}
                                  onClick={addNewTag}
                                  disabled={newTagName.trim() != "" ? false : true}
                                >
                                  New
                                </Button>
                              </div>
                            </div>
                          )}
                        >
                          {productTags.map((aTag, index) => (
                            <Option key={index} value={aTag}>{aTag}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      

                      <Form.Item name={'images'} label={`Images (max: ${fileLimit})`}>
                        <React.Fragment>
                          <Upload
                            accept="image/*"
                            beforeUpload={ (file) => {
                              return false;
                            }}
                            listType="picture-card"
                            multiple={true}
                            fileList={fileList}
                            onPreview={handlePreviewOpen}
                            onChange={handleFileListChange}
                            //showUploadList={{
                            //  showDownloadIcon: true,
                            //  downloadIcon: <StarFilled style={{color: 'yellow'}}/>
                            //}}
                            className={'productForm-upload'}
                          >
                            {fileList.length < fileLimit ? uploadButton : null}
                          </Upload>
                          <Modal 
                            visible={previewVisible} 
                            footer={getPreviewModalFooter()} 
                            onCancel={handlePreviewClose}>
                          {/* <Modal visible={previewVisible} footer={null} onCancel={handlePreviewClose}> */}
                            <img alt={`preview: ${previewImage ? previewImage.name : ""}`} style={{ width: '100%' }} src={previewImage ? previewImage.url || previewImage.thumbUrl : ''} />
                            {/* <img alt="example" style={{ width: '100%' }} src={()=>{editImageOutput(previewImage)}} /> */}
                          </Modal>
                        </React.Fragment>
                      </Form.Item>
                      <Form.Item name={'published'} label="Published" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive"/>
                      </Form.Item>
                    </Form> 
                  </div>
                </div>
                <Divider style={{margin: '0 0 15px 0'}}/>
                <div className="productForm-tab-footer">
                  <Space>
                    {getModalFooter()}
                    <Button key={'cancel'} onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button key={'submit'} type="primary" onClick={()=>{form.submit()}} disabled={isLoading || !formValueChanged}>
                      {product ? "Save" : "Save"}
                    </Button>
                  </Space>
                </div>
              </div>
            </TabPane>
            {/* {
              product ? (
                <TabPane tab="Pricing & Variants" key="2">
                  <InventoryFormTable2
                    productId={product ? product._id : null}
                    productVariants={productVariants}
                    setProductVariants={setProductVariants}
                  />
                </TabPane>

              ) : null
            } */}
            {
              product ? (
                <TabPane tab="Pricing & Variants" key="2">
                  <InventoryFormTable3
                    productId={product ? product._id : null}
                    productVariants={productVariants}
                    setProductVariants={setProductVariants}
                    onCancel={onCancel}
                    refetchList={refetchList}
                  />
                </TabPane>

              ) : null
            }
          </Tabs>
          {
            isLoading ? <Loading/> : null
          }
        </div>
      </div>
    </Modal>
  )
}

export default ProductForm2;