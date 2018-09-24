import React from "react";
import PropTypes from "prop-types";

export default class PillButton extends React.Component {

    render(){
        const {id, label, ...rest} = this.props;
        return(
            <React.Fragment>
                <input
                    {...rest}
                    id={id}
                    type="checkbox"
                    className={"pill-input"}/>
                <label htmlFor={id} className={"pill-label"}>
                    {label}
                </label>
            </React.Fragment>
        )
    }
}

PillButton.propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    checked: PropTypes.string
};
