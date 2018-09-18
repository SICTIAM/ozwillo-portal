import React from "react";
import PropTypes from 'prop-types';

export default class App extends React.PureComponent{

    render = () => {
        const indicatorStatus = this.props.app.installed ? "installed" : (this.props.app.paid ? "paid" : "free");
        const pubServiceIndicator = this.props.app.public_service ?
            <div className="public-service-indicator">
                <div className="triangle"/>
                <div className="label">
                    <i className="triangle fas fa-university" />
                </div>
            </div> : null;

        return (
            <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 container-app">
                <div className="app">
                    <div className="logo">
                        <img src={this.props.app.icon}/>
                    </div>
                    <div className="description" onClick={() => console.log("open")}>
                        {pubServiceIndicator}
                        <div className="app-header">
                            <span className="app-name">{this.props.app.name}</span>
                            <p className="app-provider">{this.props.app.provider}</p>
                        </div>
                        <p className="app-description">{this.props.app.description}</p>
                        {/*<Indicator status={indicatorStatus}/>*/}
                    </div>
                </div>
            </div>
        );
    }
}

App.propTypes = {
    app: PropTypes.object
};