import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Switch, InputNumber, DatePicker, Select, Divider, Row, Col, Tooltip, Modal, Space } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, gql } from '@apollo/client';

import { useConfigCache, useOrdersQuery } from '../../../utils/customHook';
import { getAllProductCategory, getAllProductTags, rewardTypeOptions } from '../../../utils/Constants';
import Loading from '../../../utils/component/Loading';


const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option, OptGroup } = Select;

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

const promoTypeOptions = [
  {
    label: 'Promo Code',
    value: 'active'
  },
  {
    label: 'Always Apply',
    value: 'passive'
  }
]

const GET_PRODUCTS_QUERY = gql`
  query products($filter: JSONObject, $configId: String) {
    products(filter: $filter, configId: $configId) {
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

const CREATE_PROMOTION_MUTATION = gql`
  mutation createPromotion($promotion: JSONObject!) {
    createPromotion(promotion: $promotion) {
      success
      message
      data
    }
  }
`

const PromotionForm = (props) => {
  const { type: productType = "", refetchList, visible ,onCancel } = props;

  const configCache = useConfigCache();
  const [ form ] = Form.useForm();
  const [ promotionTypeValue, setPromotionTypeValue ] = useState('active');
  const [ rewardTypeValue, setRewardTypeValue ] = useState();

  const handlePromotionTypeChange = (value) => {
    if (promotionTypeValue != value) {
      setPromotionTypeValue(value)
    }
  }

  const handleRewardTypeChange = (value) => {
    if (rewardTypeValue != value) {
      setRewardTypeValue(value)
    }
  }
  const configId =  configCache && configCache.configId ? configCache.configId : null;

  const { data: productsData, loading: loadingProducts, error, refetch: refetchProducts } = useQuery(GET_PRODUCTS_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      filter: {
        sorter: {
          createdAt: 1
        }
      },
      configId: configId
    },
    skip: configId ? false : true,
    onError: (error) => {
      console.log("products error", error)

    },
    onCompleted: (result) => {
      // console.log('refetched products', result)
    }
  });

  const [ createPromotion, { loading: loadingCreatePromotion, data: createPromotionResult }] = useMutation(CREATE_PROMOTION_MUTATION,{
    onCompleted: (result) => {
      console.log('createPromotion', result);
    }
  })

  let isLoading = loadingProducts;

  let products = productsData && productsData.products ? productsData.products : []
  let productCategories = getAllProductCategory(products);
  let productTags = getAllProductTags(products);

  let categoriesOptions = productCategories.map((aCategory)=>{
    return {
      label: aCategory.name, 
      value: aCategory._id
    }
  })

  let tagsOptions = productTags.map((aTag)=>{
    return {
      label: aTag, 
      value: aTag
    }
  })

  const getProductsOptions = () => {
   let result = [];
   if (configCache && configCache.productTypes) {
     
    configCache.productTypes.map((aType, index)=>{
      let foundProducts = products.filter((aProduct)=>aProduct.type == aType.value);
      if (foundProducts.length > 0) {
        result.push(
          <OptGroup label={aType.name} key={index}>
            {
              foundProducts.map((aProduct, index) => {
                return (<Option key={index} value={aProduct._id}>{index+1}. {aProduct.name}</Option>)
              })
            }
          </OptGroup>
        )
      }
    })
   }
   else {
    result = products.map((aProduct, index)=>{
      return (<Option key={index} value={aProduct._id}>{index+1}. {aProduct.name}</Option>)
    })
   }
   return result;
  }

  const handleSelectAllCategories = () => {
    form.setFieldsValue({...form.getFieldsValue(), 'categories': categoriesOptions.map((anOption)=>anOption.value)})
  }
  const handleClearAllCategories = () => {
    form.setFieldsValue({...form.getFieldsValue(), 'categories': []})
  }
  const handleSelectAllTags = () => {
    form.setFieldsValue({...form.getFieldsValue(), 'tags': productTags})
  }
  const handleSelectAllProducts = () => {
    form.setFieldsValue({...form.getFieldsValue(), 'products': products.map((aProduct)=>aProduct._id)})
  }
  const handleClearAllProducts = () => {
    form.setFieldsValue({...form.getFieldsValue(), 'products': []})
  }

  const handleFormSubmit = (values) => {
    console.log('submitted', values)
    const { period, ...restValues } = values;
    let startDate = period[0].toDate();
    let endDate = period[1].toDate();
    let newPromotion = {
      ...restValues,
      startDate,
      endDate
    }
    createPromotion({
      variables: {
        promotion: newPromotion
      }
    })
  }

  return (
    <Modal
      title={"New Promotion"}
      width={'95%'}
      visible={visible}
      onOk={()=>{form.submit()}}
      okText={"Save"}
      onCancel={onCancel}
      destroyOnClose
      wrapClassName={'products-modalWrapper'}
      style={{overflow:"hidden"}}
      bodyStyle={modalBodyStyle}
      //footer={( <Button type="primary" onClick={()=>{form.submit()}}>Submit</Button>)}
    >
    <div style={modalContentWrapperStyle}>
      <div className="promotionForm">
      <Form 
        form={form} 
        onFinish={handleFormSubmit} 
        initialValues={{
          type: promotionTypeValue
        }}
        layout={'vertical'}
        //layout={'inline'}
      >
        <Form.Item name="name" label="Name" rules={[{whitespace: true, required: true, message: "Required"}]}>
          <Input/>
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea/>
        </Form.Item>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item 
              name="type" 
              label="Type"
              rules={[{required: true, message: "Required"}]}
            >
              <Select 
                options={promoTypeOptions}
                onChange={handlePromotionTypeChange}
              />
            </Form.Item>
          </Col>
          {
            promotionTypeValue == 'active' ? (
              <Col xs={24} md={12}>
                <Form.Item 
                  name="code" 
                  label={(
                    <span>
                      Promo Code&nbsp;
                      <Tooltip title="Mix letters and numbers (4~10 characters), eg. ABC123">
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </span>
                  )}
                  rules={[
                    {
                      type: "string",
                      pattern: /^(?=.*[0-9])(?=.*[A-Z])([A-Z0-9]+)$/, // must contain only both uppercase letters and digits
                      message: "Wrong format! (must contain both Uppercase letters and Digits)"
                    },
                    {
                      whitespace: true, 
                      required: true,
                      message: "Required"
                    },
                    {
                      min: 4,
                      max: 10,
                      message: "Minimum 4 letters, Maximum 10 letters"
                    }
                  ]}
                  normalize={(value, prevValue, prevValues)=>{return value.toUpperCase()}}
                >
                  <Input/>
                </Form.Item>
              </Col>
            ) : null
          }
        </Row>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="period" label="Promotion Period" rules={[{required: true, message: "Required"}]}>
              <RangePicker showTime={true} style={{width: '100%'}}/>
            </Form.Item>
          </Col>
          {/* <Col xs={24} md={12}>
            <Form.Item name="quantity" label="Quantity">
              <InputNumber style={{width: '100%'}} />
            </Form.Item>
          </Col> */}
        </Row>
        

        <Divider orientation="left">Condition</Divider>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item 
              name="categories" 
              label="Categories"
              rules={[
                  ({ getFieldValue }) => ({
                  validator(rule, value) {
                    let tags = getFieldValue('tags');
                    if (value && value.length > 0 || tags && tags.length > 0) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please select at least one of the fields (Categories/Tags)');
                  },
                }),
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                maxTagCount={10}
                dropdownRender={menu => (
                    <div>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                        <Space>
                          <Button onClick={handleSelectAllCategories}>Select All</Button>
                          <Button onClick={handleClearAllCategories}>Clear All</Button>
                        </Space>
                      </div>
                    </div>
                  )
                }
              >
              {
                categoriesOptions.map((anOption, index)=>{
                  return <Option key={index} value={anOption.value}>{index+1}. {anOption.label}</Option>
                })
              } 
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="products" 
              label="Products"
              rules={[
                  ({ getFieldValue }) => ({
                  validator(rule, value) {
                    let categories = getFieldValue('categories');
                    if (value && value.length > 0 || categories && categories.length > 0) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please select at least one of the fields (Categories/Products)');
                  },
                }),
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                maxTagCount={10}
                dropdownRender={menu => (
                    <div>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                        <Space>
                          <Button onClick={handleSelectAllProducts}>Select All</Button>
                          <Button onClick={handleClearAllProducts}>Clear All</Button>
                        </Space>
                      </div>
                    </div>
                  )
                }
              >
              {getProductsOptions()}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        {/* <Form.Item 
          name="tags" 
          label="Tags"
          rules={[
              ({ getFieldValue }) => ({
              validator(rule, value) {
                let categories = getFieldValue('categories');
                if (value && value.length > 0 || categories && categories.length > 0) {
                  return Promise.resolve();
                }
                return Promise.reject('Please select at least one of the fields (Categories/Tags)');
              },
            }),
          ]}
        >
          <Select
            mode="multiple"
            allowClear
            maxTagCount={10}
            dropdownRender={menu => (
                <div>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                    <Button onClick={handleSelectAllTags}>Select All</Button>
                  </div>
                </div>
              )
            }
          >
           {
            tagsOptions.map((anOption, index)=>{
              return <Option key={index} value={anOption.value}>{anOption.label}</Option>
            })
           } 
          </Select>
        </Form.Item> */}

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item 
              name="minPurchases" 
              label={(
                <span>
                  Minimum Purchases&nbsp;
                  <Tooltip title="Minimum subtotal of selected category/tag products">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
              )}
              rules={[
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    let minQuantity = getFieldValue('minQuantity');
                    if (value || minQuantity) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please enter at least one of the fields (Minimum Purchases/Minimum Quantity)');
                  },
                }),
              ]}
            >
              <InputNumber style={{width: '100%'}} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item 
              name="minQuantity" 
              label={(
                <span>
                  Minimum Quantity&nbsp;
                  <Tooltip title="Minimum total quantity of selected category/tag products">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
              )}
              rules={[
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    let minPurchases = getFieldValue('minPurchases');
                    if (value || minPurchases) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please enter at least one of the fields (Minimum Purchases/Minimum Quantity)');
                  },
                }),
              ]}
            >
              <InputNumber style={{width: '100%'}} />
            </Form.Item>        
          </Col>
        </Row>

        <Divider orientation="left">Reward</Divider>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="rewardType" label="Reward Type" rules={[{required: true, message: "Required"}]}>
              <Select
                options={rewardTypeOptions}
                onChange={handleRewardTypeChange}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            {
              rewardTypeValue == "percentage" || rewardTypeValue == "fixedAmount" ? (
                <Form.Item name="discountValue" label="Discount Value" rules={[{required: true, message: "Required"}]}>
                  <InputNumber style={{width: '100%'}} />
                </Form.Item>
              ) : null
            }
          </Col>
        </Row>
      </Form>
      </div>
    </div>
    {
      isLoading ? <Loading/> : null
    }
    </Modal>
  )
}

export default PromotionForm;