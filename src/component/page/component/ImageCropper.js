import React, { useState, useEffect } from 'react'
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const ImageCropper = (props) => {
  const { imageFile = null } = props;
  const [cropper, setCropper] = useState();
  const [image, setImage] = useState();

  useEffect(()=>{
    if (imageFile != null) {
      var reader = new FileReader();
      reader.readAsDataURL(imageFile.originFileObj)
      reader.onload = () => {
        setImage(reader.result);
      };
    }
  },[imageFile])
  console.log('imageFile',imageFile)
  if (!imageFile) {
    return null;
  }
  return (
    <div style={{width: '100%' , border: '1px solid blue'}}>
      <div style={{ width: "100%",border: '1px solid red' }}>
        <Cropper
          style={{ height: 400, width: "100%" }}
          initialAspectRatio={1}
          preview=".img-preview"
          src={image}
          viewMode={1}
          guides={true}
          minCropBoxHeight={10}
          minCropBoxWidth={10}
          background={false}
          responsive={true}
          autoCropArea={1}
          checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
          onInitialized={(instance) => {
            setCropper(instance);
          }}
        />
      </div>
      <div className="box" style={{ width: "50%", border: '1px solid green' }}>
        <h2>Preview</h2>
        <div
          className="img-preview"
          style={{ width: "100%", height: "300px" }}
        />
      </div>
    </div>
  )
}

export default ImageCropper
