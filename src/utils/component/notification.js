import { notification } from 'antd';

export const showMessage = ({ type='info', message, description })=>{
  let options = {};
  if(type ==="error"){
    options = {
      duration: 6
    }
  }
  // type: success,error,info,warning
  notification[type]({
    //message: (<Alert message={message} type={type} />),
    message: message,
    //description: description,
    //className: `notification-${type}`,
    //...options
  });
}