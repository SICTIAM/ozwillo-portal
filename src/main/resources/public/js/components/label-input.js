import React from "react";
import PropTypes from "prop-types";

export default class LabelInput extends React.PureComponent{
    render(){
        const {label, children} = this.props;
        return (
        <div className="form-group">
            <label htmlFor="geoSearch"
                   className="control-label">
                {label}
            </label>
            <div className={"input-content"}>
                {children}
            </div>
        </div>
        )
    }

}
LabelInput.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node
};