import React from 'react';
import { withEntityData } from './EntityData';
import * as Modules from "../index";
import DatePicker from "react-datepicker";

let errorStyle = {
    color: "red",
    borderColor: "red"
}

const FormField = (props) => {
    let hasError = props.hasError;
    let errorStyleText = {
        color: "red"
    }
    return (
        <div className={`base-field ${props.className || ""}`}>
            {props.label && <label htmlFor={props.name} className="base-field-label" style={hasError ? errorStyleText : null}><h4>{`${props.label} `}{props.required ? <sup>*</sup> : null}</h4></label>}
            {props.children}
            {props.helpText && <small className="base-field-helpText" data-base-color-font="sub" style={hasError ? errorStyleText : null}>{ hasError ? props.errorMsg : props.helpText }</small>}
        </div>
    )
}

let getFormFieldProps = (props) => {
    return {
        className: props.className,
        name: props.name,
        label: props.label,
        required: props.required,
        disabled: props.disabled,
        helpText: props.helpText,
        hasError: props.hasError,
        errorMsg: ""
    }
}

const TextInput = (props) => {
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <input
                type={props.type || "text"}
                className={`base-input base-input-text`}
                id={props.name}
                name={props.name}
                value={props.value || ''}
                placeholder={props.placeholder}
                required={props.required || false}
                disabled={props.disabled || false}
                onChange={props.onChange}
                style={formFieldProps.hasError ? errorStyle : null}
            />
        </FormField>
    )
}

const EmailInput = (props) => {
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <input
            type={props.type || "email"}
                className={`base-input base-input-email`}
                id={props.name}
                name={props.name}
                value={props.value || ''}
                placeholder={props.placeholder}
                required={props.required || false}
                disabled={props.disabled || false}
                onChange={props.onChange}
                style={formFieldProps.hasError ? errorStyle : null}
            />
        </FormField>
    )
}

const NumberInput = (props) => {
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <input
                type={props.type || "number"}
                className={`base-input base-input-number`}
                id={props.name}
                name={props.name}
                value={props.value || ''}
                step={props.step || '1'}
                placeholder={props.placeholder}
                required={props.required || false}
                disabled={props.disabled || false}
                onChange={props.onChange}
                style={formFieldProps.hasError ? errorStyle : null}
            />
        </FormField>
    )
}

const PasswordInput = (props) => {
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <input
                type={props.type || "password"}
                className={`base-input base-input-password`}
                id={props.name}
                name={props.name}
                value={props.value || ''}
                placeholder={props.placeholder}
                required={props.required || false}
                disabled={props.disabled || false}
                onChange={props.onChange}
                style={formFieldProps.hasError ? errorStyle : null}
            />
        </FormField>
    )
}

const TextareaInput = (props) => {
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <textarea
                className={`base-input base-input-textarea`}
                id={props.name}
                name={props.name}
                value={props.value || ''}
                placeholder={props.placeholder}
                rows={props.rows ? props.rows : "4"}
                required={props.required || false}
                disabled={props.disabled || false}
                onChange={props.onChange}
                style={formFieldProps.hasError ? errorStyle : null}
            />
        </FormField>
    )
}

const SelectInput = (props) => {
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <select
                key={props.name}
                className={`base-input base-input-select`}
                name={props.name}
                value={props.value}
                required={props.required || false}
                disabled={props.disabled || false}
                onChange={props.onChange}
                style={formFieldProps.hasError ? errorStyle : null}
                >
                {
                    props.placeholder ? <option value="" disabled>{props.placeholder}</option> : null
                }
                {
                    props.options.map(option => {
                        return (
                            <option
                                key={option.value}
                                value={option.value}
                                label={option.label}>{option.label}
                            </option>
                        );
                    })
                }
            </select>
        </FormField>
    )
}

const RadioButtonInput = (props) => {
    let value = props.value || props.options[0].value;
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <div id={props.name} className={`base-input-radioButton`}>
                {
                    props.options.map((option,index) => {
                        return (
                            <label key={index} className="base-input-radioButton-item">
                                <input
                                    type="radio"
                                    name={props.name}
                                    value={option.value}
                                    checked={value.indexOf(option.value) > -1}
                                    disabled={option.disabled || false}
                                    onChange={props.onChange}
                                />
                                {option.label}
                            </label>
                        );
                    })
                }
            </div>
        </FormField>
    )
}
const BaseCustomOption = (props) => {
    // active,inactive,disabled
    let baseStyle = {
        height: "100px",
        width: "100px",
        borderRadius: "50%"
    }
    if (props.active) {
        baseStyle['backgroundColor'] = "pink";
        baseStyle['border'] = "1px solid black";
    }

    return (
        <div className="base-button base-custom-radio-option base-p-2 base-m-r3" data-base-button-style={props.active ? "1": "3"} data-base-button-disabled={props.disabled ? "true" : "false"}>{props.label}</div>
    )
}

const CustomRadioButtonInput = (props) => {
    let formFieldProps = getFormFieldProps(props);
    let value = props.value || props.options[0].value;
    const CustomOption = props.customItem ? props.customItem : BaseCustomOption;

    return (
        <FormField {...formFieldProps}>
            <div id={props.name} className={`base-input-custom-radioButton`}>
            {
                props.options.map((option,index) => {
                    return (
                        <label key={index} className="base-input-custom-radioButton-item">
                            <input
                                type="radio"
                                name={props.name}
                                value={option.value}
                                checked={value.indexOf(option.value) > -1}
                                disabled={option.disabled || false}
                                onChange={props.onChange}
                            />
                            <CustomOption 
                                label={option.label} 
                                value={option.value} 
                                active={value.indexOf(option.value) > -1} 
                                disabled={option.disabled || false}
                            />
                        </label>
                    )
                })
            }
            </div>
        </FormField>
    )
}

const CheckboxInput = (props) => {
    let value = props.value || [];
    let formFieldProps = getFormFieldProps(props);
    return (
        <FormField {...formFieldProps}>
            <div id={props.name} className={`base-input-checkbox`}>
                {props.options.map(option => {
                    return (
                        <label key={option.value} className="base-input-checkbox-item">
                            <input
                                type="checkbox"
                                name={props.name}
                                value={option.value}
                                checked={value.indexOf(option.value) > -1}
                                disabled={option.disabled || false}
                                onChange={props.onChange}
                            />
                            {option.label}
                        </label>
                    );
                })}
            </div>
        </FormField>
    )
}


const ButtonGroupInput = (props) => {
  let formFieldProps = getFormFieldProps(props);
  let multiSelect = props.multi;
  return (
      <FormField {...formFieldProps}>
        <p>{props.placeholder}</p>
        <div className="btn-group" style={ {"width": "100%"} }>
          {
              props.options.map((option,index) => {
                  let selected = false;
                  if(props.value == option.value){
                    selected = true;
                  }
                  return (<button key={option.value} className={selected ? 'active' : ''} style={ {"width": "50%"} } disabled={props.disabled || false} onClick={()=> {props.onClick({[props.name]: option.value})} }>{option.label}</button>)
              })
          }
        </div>
      </FormField>
  )
}

const DatePickerInput = (props) => {
  let formFieldProps = getFormFieldProps(props);

  return (
    <FormField {...formFieldProps}>
        <DatePicker
            className="base-input"
            selected={props.value}
            onChange={(date)=> {props.onClick({[props.name]: date})} }
            showTimeSelect={props.showTimeSelect ? props.showTimeSelect : false}
            minDate={props.minDate}
            maxDate={props.maxDate}
            placeholderText={props.placeholder ? props.placeholder : "please select a date"}
            timeFormat="hh:mm aa"
            timeIntervals={30}
            timeCaption="time"
            dateFormat="MMMM d, yyyy h:mm aa"
        />
    </FormField>
  )
}

/*
clickable item UI states
default (can be clicked, neither not activated nor activated)
not activated (can be clicked, contrast with activated)
activated (clicked once)
disabled (cannot be clicked)
*/

let TextInput2 = withEntityData(TextInput);
let EmailInput2 = withEntityData(EmailInput);
let NumberInput2 = withEntityData(NumberInput);
let PasswordInput2 = withEntityData(PasswordInput);
let TextareaInput2 = withEntityData(TextareaInput);
let SelectInput2 = withEntityData(SelectInput);
let CheckboxInput2 = withEntityData(CheckboxInput);
let RadioButtonInput2 = withEntityData(RadioButtonInput);
let ButtonGroupInput2 = withEntityData(ButtonGroupInput);
let DatePickerInput2 = withEntityData(DatePickerInput);

let CustomRadioButtonInput2 = withEntityData(CustomRadioButtonInput);

export {
    TextInput2 as TextInput,
    EmailInput2 as EmailInput,
    NumberInput2 as NumberInput,
    PasswordInput2 as PasswordInput,
    TextareaInput2 as TextareaInput,
    SelectInput2 as SelectInput,
    CheckboxInput2 as CheckboxInput,
    RadioButtonInput2 as RadioButtonInput,
    ButtonGroupInput2 as ButtonGroupInput,
    DatePickerInput2 as DatePickerInput,
    CustomRadioButtonInput2 as CustomRadioButtonInput
};

/*
sample usage:
<Modules.EntityData formValues={ this.state.formValues } onChange={ this.updateFormValues }>
    <Modules.EmailInput label="Email" name="emailInput" placeholder="Email" required/>
    <Modules.PasswordInput label="Password" name="passwordInput" placeholder="Password" helpText="min 6 characters" required/>

    <Modules.TextInput label="Name" name="name" placeholder="name" required/>
    <Modules.TextareaInput label="Textarea" name="textarea" placeholder="text Areaaaa" required/>
    <Modules.NumberInput label="Number" name="number" placeholder="Number"/>
    <Modules.SelectInput label="Select" name="select" placeholder="Default" options={options}/>
    <Modules.CheckboxInput label="Checkbox" name="Checkboxess" options={options} placeholder="checkboxes"/>
    <Modules.RadioButtonInput label="Radio Button" name="radios" options={options} placeholder="radios"/>
</Modules.EntityData>
*/
