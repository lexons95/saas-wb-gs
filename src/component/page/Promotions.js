import React, { useState, useEffect } from 'react';
import { Button, Table, Switch, Modal, Tooltip, Badge, Descriptions, Divider, notification } from 'antd';
import { PlusOutlined, RedoOutlined, QuestionCircleOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, gql } from '@apollo/client';
import { format, isAfter } from 'date-fns';

import Page01 from './component/Page01';
import PromotionForm from './component/PromotionForm';
import { useConfigCache, useOrdersQuery } from '../../utils/customHook';
import { rewardTypeOptions } from '../../utils/Constants';
import Loading from '../../utils/component/Loading';


const { confirm } = Modal;

const GET_PROMOTIONS_QUERY = gql`
  query promotions($filter: JSONObject, $configId: String) {
    promotions(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      name
      description
      published
      startDate
      endDate
      type
      code
      quantity
      categories
      products
      minPurchases
      minQuantity
      rewardType
      discountValue
    }
  }
`;

const UPDATE_PUBLISH_PROMOTION = gql`
  mutation updatePublishPromotion($_id: String!, $published: Boolean!) {
    updatePublishPromotion(_id: $_id, published: $published) {
      success
      message
      data
    }
  }
`;

const DELETE_PROMOTION = gql`
  mutation deletePromotion($_id: String!) {
    deletePromotion(_id: $_id) {
      success
      message
      data
    }
  }
`;

const Promotions = (props) => {
  const configCache = useConfigCache();
  const [ promotionFormVisible, setPromotionFormVisible ] = useState(false);
  const [ promotionInfoVisible, setPromotionInfoVisible ] = useState(false);

  const [ selectedPromotion, setSelectedPromotion ] = useState(null);

  const handlePromotionFormOpen = () => {
    setPromotionFormVisible(true);
  }
  const handlePromotionFormClose = () => {
    setPromotionFormVisible(false);
  }

  const handlePromotionInfoOpen = (value) => {
    setSelectedPromotion(value)
    setPromotionInfoVisible(true);
  }
  const handlePromotionInfoClose = () => {
    setSelectedPromotion(null)
    setPromotionInfoVisible(false);
  }

  const configId =  configCache && configCache.configId ? configCache.configId : null;

  const { data: promotionsData, loading: loadingPromotions, refetch: refetchPromotions } = useQuery(GET_PROMOTIONS_QUERY,{
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
      // console.log('fetched promotions', result)
    }
  });

  const [ updatePublishPromotion, { data: updatePublishResult, loading: updatePublishLoading }] = useMutation(UPDATE_PUBLISH_PROMOTION,{
    onCompleted: (result) => {
      if (result && result.updatePublishPromotion && result.updatePublishPromotion.success) {
        notification.success({
          message: 'Update Success',
        });
        refetchPromotions()
      }
    },
    onError: (error) => {
      notification.error({
        message: 'Update Failed',
      });
      refetchPromotions()
    }
  })

  const [ deletePromotion, { data: deleteResult, loading: deleteLoading }] = useMutation(DELETE_PROMOTION,{
    onCompleted: (result) => {
      if (result && result.deletePromotion && result.deletePromotion.success) {
        notification.success({
          message: 'Delete Success',
        });
        refetchPromotions()
      }
    },
    onError: (error) => {
      notification.error({
        message: 'Delete Failed',
      });
      refetchPromotions()
    }
  })

  let promotions = promotionsData && promotionsData.promotions ? promotionsData.promotions : []

  const handleUpdatePublishPromotion = (id, status) => {
    updatePublishPromotion({
      variables: {
        _id: id, 
        published: status
      }
    })
  }

  const handleDeletePromotion = (id, name) => {
    confirm({
      title: `Do you Want to delete this item? (${name})`,
      icon: <ExclamationCircleOutlined />,
      okType: 'danger',
      onOk() {
        deletePromotion({
          variables: {
            _id: id
          }
        })
        // console.log('OK', id);
      },
      onCancel() {
      },
    });
  }

  const promotionColumns = () => {
    let result = [];
    result = [
      {
        title: "No.",
        dataIndex: 'index',
        key: 'index',
        fixed: 'left',
        width: 60,
        render: (text, record, index) => {
          return index+1 + "."
        }
      },
      {
        title: "Name",
        dataIndex: 'name',
        key: 'name',
        render: (text, record, index) => {
          return (<Button type="link" onClick={()=>{handlePromotionInfoOpen(record)}}>{text}</Button>)
        }
      },
      {
        title: "Promo Code",
        dataIndex: 'code',
        key: 'code',
        responsive: ['md'],
        render: (text, record, index) => {
          return text ? text : '-'
        }
      },
      {
        title: "Reward",
        dataIndex: 'rewardType',
        key: 'rewardType',
        responsive: ['md'],
        render: (text, record, index) => {
          let foundRewardOption = rewardTypeOptions.find(anOption=>{return anOption.value == text});
          if (foundRewardOption) {
            return foundRewardOption.label;
          }
          return "-"
        }
      },
      {
        title: (
          <span>
            Period&nbsp;
            <Tooltip 
              title={(
                <span style={{whiteSpace: 'pre-wrap'}}>
                  <div><Badge color="grey"/> Not Started</div>
                  <div><Badge color="green"/> On Going</div>
                  <div><Badge color="red"/> Expired</div>
                </span>
              )}>
              <QuestionCircleOutlined />
            </Tooltip>
          </span>
        ),
        dataIndex: 'period',
        key: 'period',
        responsive: ['md'],
        render: (text, record, index) => {
          return getPeriodOutput(record.startDate, record.endDate)
        }
      },
      {
        title: "Published",
        dataIndex: 'published',
        key: 'published',
        render: (text, record, index) => {
          return (<Switch checkedChildren="On" unCheckedChildren="Off" checked={text} onClick={(checked)=>{handleUpdatePublishPromotion(record._id, checked)}} />)
        }
      },
      {
        title: "Action",
        dataIndex: 'action',
        key: 'action',
        render: (text, record, index) => {
          return (<Button type="primary" danger={true} icon={(<DeleteOutlined/>)} onClick={()=>{handleDeletePromotion(record._id,record.name)}} />)
        }
      }
    ]
    return result;
  }

  const getPeriodOutput = (start, end) => {
    let startDate = format(new Date(start), "MM/dd/yyyy hh:mm:ss aa")
    let endDate = format(new Date(end), "MM/dd/yyyy hh:mm:ss aa")
    let started = isAfter(new Date(), new Date(start));
    let expired = isAfter(new Date(), new Date(end));

    // red: expired, green: ongoing, grey: not started
    let textColor = expired ? 'red' : (started ? "green" : 'grey')
    return (
      <div style={{color: textColor}}>
        <div>Start: {startDate}</div>
        <div>End: {endDate}</div>
      </div>
    );
  }

  let isLoading = loadingPromotions || updatePublishLoading || deleteLoading

  return (
    <Page01
      title={"Promotions"}
      extra={[
        <Button key="refresh" type="primary" icon={<RedoOutlined />} onClick={()=>{refetchPromotions()}}/>,
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={()=>{handlePromotionFormOpen()}} />
      ]}
    >
      <Table
        columns={promotionColumns()}
        dataSource={promotions}
        rowKey="_id"
        scroll={{ x: 200*4 }}
      />

      <Modal
        title={`Promotion: ${selectedPromotion ? selectedPromotion.name : ""}`}
        visible={promotionInfoVisible}
        onCancel={handlePromotionInfoClose}
        width={700}
        style={{ top: 20, bottom: 20 }}
        centered={true}
        footer={null}
      >
        {
          selectedPromotion ? (
            <>
              <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
                <Descriptions.Item label="Period">{getPeriodOutput(selectedPromotion.startDate, selectedPromotion.endDate)}</Descriptions.Item>
                <Descriptions.Item label="Promo Code">{selectedPromotion.code ? selectedPromotion.code : '-'}</Descriptions.Item>
                {/* <Descriptions.Item label="Quantity">{selectedPromotion.quantity ? selectedPromotion.quantity : '-'}</Descriptions.Item> */}
                <Descriptions.Item label="Description" span={2}>{selectedPromotion.description}</Descriptions.Item>
              </Descriptions>
              <Divider orientation="left">Conditions</Divider>
              <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
                <Descriptions.Item label="Categories" span={2}>{selectedPromotion.categories.length > 0 ? selectedPromotion.categories : '-'}</Descriptions.Item>
                <Descriptions.Item label="Products" span={2}>{selectedPromotion.products.length > 0 ? selectedPromotion.products : '-'}</Descriptions.Item>
                <Descriptions.Item label="Minimum Purchases">{selectedPromotion.minPurchases ? selectedPromotion.minPurchases : '-'}</Descriptions.Item>
                <Descriptions.Item label="Minimum Quantity">{selectedPromotion.minQuantity ? selectedPromotion.minQuantity : '-'}</Descriptions.Item>
              </Descriptions>
              <Divider orientation="left">Reward</Divider>
              <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
                <Descriptions.Item label="Type">{selectedPromotion.rewardType ? rewardTypeOptions.find((anOption)=>anOption.value == selectedPromotion.rewardType).label : '-'}</Descriptions.Item>
                <Descriptions.Item label="Discount Value">{selectedPromotion.discountValue ? selectedPromotion.discountValue : '-'}</Descriptions.Item>
              </Descriptions>
            </>
          ) : null
        }
      </Modal>
      <PromotionForm
        visible={promotionFormVisible}
        onCancel={handlePromotionFormClose}
      />
      {
        isLoading ? <Loading/> : null
      }
    </Page01>
  )
}

export default Promotions;