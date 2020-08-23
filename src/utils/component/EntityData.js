import React from 'react';

const EntityDataContext = React.createContext();

export function withEntityData(Component) {
    return function EntityDataComponent(props) {
        return (
            <EntityDataContext.Consumer>
                { entityProps => {
                    const value = props.value || entityProps.formValues[props.name];
                    //const value = props.value !== undefined ? props.value : source[props.name];
                    const onChange = props.onChange || entityProps.onChange;
                    return (
                        <Component
                            { ...props }
                            value={ value }
                            onChange={ onChange } />
                    );
                }}
            </EntityDataContext.Consumer>
        );
    };
}

export class EntityData extends React.PureComponent {
    constructor(props) {
		super(props);
		this.state = {
            formValues: {}
        }
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    componentDidMount() {
        this.setState({formValues: this.props.formValues});
    }
    
	componentDidUpdate(prevProps) {
        if (prevProps.formValues != this.props.formValues) {
            this.setState({formValues: this.props.formValues});
        }
    }
    
    handleInputChange(e) {
		const target = e.target;
		const inputType = target.type;
        const name = target.name;
        let value = "";
        if (inputType == 'checkbox') {
            const newSelection = target.value;
            let newSelectionArray;
            let currentValue = this.state.formValues[name] || [];
        
            if (currentValue.indexOf(newSelection) > -1) {
                newSelectionArray = currentValue.filter(s => s !== newSelection)
            } 
            else {
                newSelectionArray = [...currentValue, newSelection];
            }
            value = newSelectionArray;
        }
        else {
            value = target.value;
        }

        let obj = Object.assign({},this.state.formValues,{[name]: value});
        this.props.onChange(obj);
    }

    render() {
        return (
            <EntityDataContext.Provider value={{
                formValues: this.props.formValues,
                onChange: this.handleInputChange
            }}>
                { this.props.children }
            </EntityDataContext.Provider>
        );
    }
}


const EntitySectionContext = React.createContext();
export function withEntityLayout(Component) {
    return function EntityLayoutComponent(props) {
        return (
            <EntitySectionContext.Consumer>
                { entityProps => {
                    const value = props.value || entityProps.formValues[props.name];
                    //const value = props.value !== undefined ? props.value : source[props.name];
                    const onChange = props.onChange || entityProps.onChange;
                    return (
                        <Component
                            { ...props }
                            value={ value }
                            onChange={ onChange } />
                    );
                }}
            </EntitySectionContext.Consumer>
        );
    };
}

export class EntitySection extends React.PureComponent {
    constructor(props) {
		super(props);
		this.state = {
            formValues: {}
        }
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    componentDidMount() {
        this.setState({formValues: this.props.formValues});
    }
    
	componentDidUpdate(prevProps) {
        if (prevProps.formValues != this.props.formValues) {
            this.setState({formValues: this.props.formValues});
        }
    }
    
    handleInputChange(e) {
		const target = e.target;
		const inputType = target.type;
        const name = target.name;
        let value = "";
        if (inputType == 'checkbox') {
            const newSelection = target.value;
            let newSelectionArray;
            let currentValue = this.state.formValues[name] || [];
        
            if (currentValue.indexOf(newSelection) > -1) {
                newSelectionArray = currentValue.filter(s => s !== newSelection)
            } 
            else {
                newSelectionArray = [...currentValue, newSelection];
            }
            value = newSelectionArray;
        }
        else {
            value = target.value;
        }

        let obj = Object.assign({},this.state.formValues,{[name]: value});
        this.props.onChange(obj);
    }

    render() {
        return (
            <EntitySectionContext.Provider value={{
                formValues: this.props.formValues,
                onChange: this.handleInputChange
            }}>
                { this.props.children }
            </EntitySectionContext.Provider>
        );
    }
}