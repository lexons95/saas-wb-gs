import React from 'react';
import { base_noImageFoundSrc, checkSize, mapSettingValueFromProps, getSrcset } from '../Constants.js';

const debounce = (fn, ms) => {
    let timer;
    return _ => {
        clearTimeout(timer)
        timer = setTimeout(_ => {
            timer = null
            fn.apply(this, arguments)
        }, ms)
    };
}

const ImageHook = (props) => {
    const [dimensions, setDimensions] = React.useState({ 
        height: window.innerHeight,
        width: window.innerWidth
    })
    React.useEffect(() => {
        const debouncedHandleResize = debounce(function handleResize() {
            setDimensions({
                height: window.innerHeight,
                width: window.innerWidth
            })
        }, 1000)

        window.addEventListener('resize', debouncedHandleResize)

        return _ => {
            window.removeEventListener('resize', debouncedHandleResize)
        }
    });
    return null;
}

class Image extends React.Component {
    constructor(props) {
		super(props);
		this.state = {
            height: "",
            width: "",
            clientHeight: "",
            clientWidth: "",
            src: "",
            imageSizeType: 0 // ["square","vRectangle","hRectangle"]
        }
        this.getImageMeta = this.getImageMeta.bind(this);
        this.handleImageError = this.handleImageError.bind(this);
	}

	componentDidMount() {
        this.setState({src: this.props.src});
    }
    
	componentDidUpdate(prevProps) {
        if (prevProps.src != this.props.src) {
            this.setState({src: this.props.src});
        }
    }

    getImageMeta({target:img}) {
        let imageSizeType = 0;
        if (img.naturalHeight > img.naturalWidth) {
            imageSizeType = 1;
        }
        else if (img.naturalHeight < img.naturalWidth) {
            imageSizeType = 2;
        }
        
        let self = this;
        const debouncedHandleResize = debounce(function handleResize() {
            self.setState({
                height: img.naturalHeight,
                width: img.naturalWidth,
                clientHeight: img.clientHeight,
                clientWidth: img.clientWidth,
                imageSizeType: imageSizeType
            })
            // if (self.state.src == "https://storage.googleapis.com/taffy-images/boost-juice/bdb723af-6dd9-42f7-ae65-3d5441016c43_250.jpg") {
            //     console.log({
            //         height: img.naturalHeight,
            //         width: img.naturalWidth,
            //         clientHeight: img.clientHeight,
            //         clientWidth: img.clientWidth,
            //         imageSizeType: imageSizeType
            //     })
            // }
        }, 1000)

        window.addEventListener('resize', debouncedHandleResize)

        return _ => {
            window.removeEventListener('resize', debouncedHandleResize)
        }
    }

    handleImageError(e) {
        e.target.src = base_noImageFoundSrc;
    }
    
    render() {
        let baseSettingValue = {
            className: "",
            aspectRatio: "", // none (fully follow parent size), 1:1 (follow parent width only, square) ... 
            fillContainer: true,
            isCircle: false,
            isBackground: false
        }
    
        let settingValue = mapSettingValueFromProps(baseSettingValue,this.props);
        
        /*
        conditions:
        - container always 100% width to match unknown parent size (height is based on aspect ratio)
        - image always at center of container 

        container ratio (original/1:1/4:3/3:2...)
        img fill container/not fill container
        */

        let imageComponentWithAutoCenter = () => {
            let imageStyle = {}

            if (settingValue.fillContainer) {
                if (this.state.imageSizeType == 0) {
                    imageStyle["width"] = "100%";
                }
                else if (this.state.imageSizeType == 1) {
                    imageStyle["width"] = "100%";
                }
                else if (this.state.imageSizeType == 2) {
                    imageStyle["height"] = "100%";
                }
            }
            else {
                if (this.state.imageSizeType == 0) {
                    imageStyle["height"] = "100%";
                }
                else if (this.state.imageSizeType == 1) {
                    imageStyle["height"] = "100%";
                }
                else if (this.state.imageSizeType == 2) {
                    imageStyle["width"] = "100%";
                }
            }

            let aspectRatio = settingValue.aspectRatio;
            if (settingValue.isCircle) {
                aspectRatio = "1:1";
            }

            return (
                <div className={`box base-imgComponentContainerBox ${settingValue.isCircle ? "base-imgComponentCircleBox" : ""} ${settingValue.className}`} data-aspect-ratio={aspectRatio}>
                    <div className="wrapper base-imgComponentContainerWrapper">
                        <img style={imageStyle} src={this.state.src} onLoad={this.getImageMeta} onError={this.handleImageError}/>
                    </div>
                </div>
            )
        }

        let imageComponent = () => {
            let imageStyle = {
                "width": "100%"
            }

            let imgProps = {}
            if (this.props.srcName) {
                imgProps["srcSet"] = getSrcset(this.props.srcName);
            }

            return (
                <div className={`base-image-container ${settingValue.isCircle ? "base-imgComponentCircleBox" : ""} ${settingValue.className}`}>
                    <img style={imageStyle} src={this.state.src} onLoad={this.getImageMeta} onError={this.handleImageError} {...imgProps} alt="" />
                </div>
            )
        }


        let result = null;

        if (settingValue.isBackground) {
            let style = {
                backgroundImage: `url(${this.state.src})`,
				backgroundRepeat: "no-repeat",
				backgroundPosition: "center",
				backgroundSize: "cover",
                backgroundBlendMode: "overlay",
                height: "100vh",
                width: "100%"
            }

            result = (
                <div className={`base-image-container ${settingValue.className}`} style={style}>
                    {this.props.children ? this.props.children : null}
                </div>
            )
        }

        else {
            result = imageComponent();
        }
   
        return result;

        /*

        inside swiper: y/n
        follow parent: y/n 

        img type:
        1. height == width (square)
        2. height > width (vertical rectangle)
        3. height < width (horizontal rectangle)

        show:
        1. full img
        2. partial img 

        container type:
        1. square
        3. not square
        5. 100% width 100vh height (based on screen)
        
        */
    }
}

export default Image;