import React, { useState, useEffect } from 'react';
import { Select, Statistic, Form, Divider, DatePicker, Card, Button } from 'antd';
import { isAfter, isBefore } from 'date-fns';
// import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';


import Page01 from './component/Page01';
import { useConfigCache, useOrdersQuery } from '../../utils/customHook';
import ChartsWithGroups from './component/ChartsWithGroups';
import Loading from '../../utils/component/Loading';

const { RangePicker } = DatePicker;

const DashBoard = (props) => {
  const configCache = useConfigCache();
  const [ orderFilter, setOrderFilter ] = useState({
    type: "all",
    startDate: new moment('1/1/2019','DD/MM/YYYY'),
    endDate: new moment()
  });

  const { data, loading: loadingOrders, error, refetch: refetchOrders } = useOrdersQuery({
    variables: {
      filter: {
        //filter: orderFilter,
        // filter: {
        //   paid: true
        // },
        sorter: {
          createdAt: -1
        }
      },
      configId: configCache ? configCache.configId : configCache
    },
    skip: configCache == null
  });

  let orders = data && data.orders ? data.orders : []

  const onDateRangeChange = (dates, dateStrings) => {
    setOrderFilter({
      ...orderFilter,
      startDate: dates ? dates[0] : null,
      endDate: dates ? dates[1] : null
    })
    // setOrderFilter({
    //   ...orderFilter,
    //   startDate: new Date(dateStrings[0]),
    //   endDate: new Date(dateStrings[1])
    // })
  }

  const getOrdersWithinRange = (orders, orderFilter) => {
    let result = [];
    let validStartDate = orderFilter.startDate ? orderFilter.startDate.isValid() : false;
    let validEndDate = orderFilter.endDate ? orderFilter.endDate.isValid() : false;

    orders.forEach((anOrder)=>{
      // console.log('orderrrr', anOrder.updatedAt)
      let isAfterStart = validStartDate ? isAfter(new Date(anOrder.createdAt), orderFilter.startDate.toDate()) : true;
      let isBeforeEnd = validEndDate ? isBefore(new Date(anOrder.createdAt), orderFilter.endDate.toDate()) : true;

      let passedDate = isAfterStart && isBeforeEnd;
      let passedType = false;
      let passedPaid = anOrder.paid;

      // type
      if (orderFilter.type == '1' && orderFilter.type == anOrder.type) {
        passedType = true;
      }
      else if (orderFilter.type == '0' && !anOrder.type) {
        passedType = true;
      }
      else if (orderFilter.type == 'all') {
        passedType = true;
      }

      // final
      if (passedDate && passedType && passedPaid) {
        result.push(anOrder);
      }
    });

    return result;
  }

  const getTotalFromOrders = (orders, property) => {

    let total = 0;
    let dutyTaxInsurance = 0;
    let deliveryFee = 0;
    let distinctCategory = [];
    let subTotal = 0;

    orders.forEach((anOrder)=>{
      total += anOrder.total;
      deliveryFee += anOrder.deliveryFee;
      if (anOrder.charges && anOrder.charges.length > 0) {
        anOrder.charges.forEach((aCharge)=>{
          if (aCharge.code == "dutyTaxInsurance") {
            dutyTaxInsurance += aCharge.value;
          }
        })
      }


      anOrder.items.forEach((anItem)=>{
        let foundCategoryIndex = distinctCategory.map((aCategory)=>aCategory.name).indexOf(anItem.product.category)
        if (foundCategoryIndex >= 0) {
          distinctCategory[foundCategoryIndex] = {
            ...distinctCategory[foundCategoryIndex],
            total: distinctCategory[foundCategoryIndex].total + (parseFloat(anItem.price)*parseInt(anItem.qty)),
            qty: distinctCategory[foundCategoryIndex].qty + parseInt(anItem.qty)
          }
        }
        else {
          distinctCategory.push({
            name: anItem.product.category,
            total: (parseFloat(anItem.price)*parseInt(anItem.qty)),
            qty: parseInt(anItem.qty)
          })
        }
        subTotal += parseFloat(anItem.price)*parseInt(anItem.qty);
      })
    });

    let grandTotal = dutyTaxInsurance + deliveryFee + subTotal;

    return {
      total,
      dutyTaxInsurance,
      deliveryFee,
      distinctCategory,
      subTotal,
      grandTotal
    };
  }

  let filteredOrders = getOrdersWithinRange(orders, orderFilter)
  let totalResult = getTotalFromOrders(filteredOrders);

  return (
    <Page01
      title={"Dashboard"}
    >
    {
      configCache && configCache.configId == 'mananml' ? (
        <>
          <Form.Item label={"Type"} >
            <Select options={[
                {
                  label: "全部",
                  value: 'all'
                },
                {
                  label: "国内",
                  value: '0'
                },
                {
                  label: "国外",
                  value: '1'
                }
              ]}
              defaultValue={"all"}
              onChange={(values)=>{
                setOrderFilter({
                  ...orderFilter,
                  type: values
                })
                {/* if (values == '0') {
                  setOrderFilter({
                    ...orderFilter,
                    type: undefined
                  })
                }
                else {
                  setOrderFilter({
                    ...orderFilter,
                    type: values
                  })
                } */}
              }} 
            />
          </Form.Item>

        </>
      ) : null
    }

    <div className="dashboard-container">

      <div className="dashboard-summary">
        <RangePicker 
          onChange={onDateRangeChange} 
          value={[orderFilter.startDate, orderFilter.endDate]} 
          size="small"
          allowClear={false}
        />
        <div className="dashboard-summary-part1">
            <Statistic title="小计 (RMB)" value={totalResult.subTotal} />
            {
              configCache && configCache.configId == 'mananml' ? <Statistic title="总税险包 (RMB)" value={totalResult.dutyTaxInsurance} /> : null
            }
            <Statistic title="总邮费 (RMB)" value={totalResult.deliveryFee} />
            <Statistic title="总销售额 (RMB)" value={totalResult.total} />
          {/* <Card>
            <Statistic title="小计 (RMB)" value={totalResult.subTotal} />
          </Card>
          <Card>
            <Statistic title="总税险包 (RMB)" value={totalResult.dutyTaxInsurance} />
          </Card>
          <Card>
            <Statistic title="总邮费 (RMB)" value={totalResult.deliveryFee} />
          </Card>
          <Card>
            <Statistic title="总销售额 (RMB)" value={totalResult.total} />
          </Card> */}
        </div>
        
        <Divider/>

        <div className="dashboard-summary-part2">
          {
            totalResult.distinctCategory.map((anItem, index)=>{
              let label = anItem.name;
              if (!label) {
                label = "Others"
              }
              label = label + " (RMB)"
              return (
                  <Statistic style={{flex:'1 1 50%', marginBottom: '10px'}} key={index} title={label} value={anItem.total} 
                    //prefix={"RMB "} 
                    suffix={` / ${anItem.qty}个`} 
                  />
              )
            })
          }
        </div>

        <Divider/>

        <ChartsWithGroups data={filteredOrders} />

      </div>
    </div>
    
    { loadingOrders ? <Loading/> : null }

    </Page01>
  )
}

export default DashBoard;