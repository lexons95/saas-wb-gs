import React, {useState} from 'react';
import Page01 from './component/Page01';
import { useQuery } from '@apollo/client';
import gql from "graphql-tag";
import { Button, Modal, Empty } from 'antd';
import {
  PlusOutlined
} from '@ant-design/icons';
import ProductForm from './component/ProductForm';
import ProductCard from './component/ProductCard';
import Loading from '../../utils/component/Loading';
import { useConfigCache } from '../../utils/customHook';

const GET_PRODUCTS_QUERY = gql`
  query products($filter: JSONObject, $configId: String) {
    products(filter: $filter, configId: $configId) {
      _id
      createdAt
      updatedAt
      name
      description
      category
      variants
      published
      images
    }
  }
`;

const Products = (props) => {
  const [ productFormModal, setProductFormModal ] = useState(false);
  const [ selectedProduct, setSelectedProduct ] = useState(null);

  const configCache = useConfigCache();
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS_QUERY, {
    fetchPolicy: "cache-and-network",
    variables: {
      configId: configCache.configId
    },
    onError: (error) => {
      console.log("products error", error)

    },
    onCompleted: (result) => {
      
    }
  });

  const handleProductFormModalOpen = () => {
    setProductFormModal(true);
  }
  const handleProductFormModalClose = () => {
    setProductFormModal(false);
  }

  const handleOnClickProduct = (product) => {
    handleProductFormModalOpen();
    setSelectedProduct(product)
  }

  const getProducts = (dataInput) => {
    let result = [];
    dataInput.products.map((aProduct, index)=>{
      result.push(
        <li key={index} className="products-card-item" onClick={()=>{handleOnClickProduct(aProduct)}}>
          <ProductCard product={aProduct}/>
        </li>
      )
    })
    return result;
  }

  return (
    <Page01
      title={"Products"}
      extra={[
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={()=>{handleOnClickProduct(null)}} />
      ]}
    >
      <ul className="products-container">
        {
          loading ? <Loading/> 
          : (error ? "Error" 
            : (data.products.length > 0 ? getProducts(data) : <li style={{width:'100%'}}><Empty/></li> ))
        }
      </ul>
      <ProductForm
          // product props
          product={selectedProduct} 
          refetch={refetch}

          // modal props
          modalVisible={productFormModal}
          closeModal={handleProductFormModalClose}
        />
    </Page01>
  )
}

export default Products;
