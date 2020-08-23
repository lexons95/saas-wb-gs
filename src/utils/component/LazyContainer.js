import React, {useRef, useState, useEffect} from 'react';
import { Spin } from 'antd';


const LazyContainer = (props) => {
  const { loadMore, hasMore, loading = false, ...restProps } = props;
  let containerRef = useRef();

  useEffect(() => {
    if (containerRef && containerRef.current) {
      const scrollEventListener = (event) => {
        if (hasMore) {
          let maxScroll = event.target.scrollHeight - event.target.clientHeight;
          let currentScroll = event.target.scrollTop;
          if (currentScroll === maxScroll) {
            loadMore(true);
          }
        }else{
          containerRef.current.removeEventListener('scroll', scrollEventListener);
        }
      }

      containerRef.current.addEventListener('scroll',scrollEventListener);
      return () => {
        containerRef.current.removeEventListener('scroll', scrollEventListener);
      };
    }
  }, [containerRef]);

  return (
    <div ref={containerRef} {...restProps}>
      <Spin spinning={loading}>
        {restProps.children ? restProps.children : null}
      </Spin>
    </div>
  )
}

export default LazyContainer;