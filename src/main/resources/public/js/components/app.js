import React from "react";
import PropTypes from 'prop-types';
import AppModal from "./store-install-app";

export default class App extends React.PureComponent{

    openApp = () =>{
        this.modal.open();
    };

    render = () => {
        const {app} = this.props;

        const indicatorStatus = app.installed ? "installed" : (app.paid ? "paid" : "free");
        const pubServiceIndicator = app.public_service ?
            <div className="public-service-indicator">
                <div className="triangle"/>
                <div className="label">
                    <i className="triangle fas fa-university" />
                </div>
            </div> : null;

        return (
            <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 container-app">
                <AppModal app={this.props.app} wrappedComponentRef={
                    c => { this.modal = c && c.getWrappedInstance() }}/>
                <div className="app">
                    <div className="logo">
                        <img src={app.icon}/>
                    </div>
                    <div className="description" onClick={() => this.openApp()}>
                        {pubServiceIndicator}
                        <div className="app-header">
                            <span className="app-name">{app.name}</span>
                            <p className="app-provider">{app.provider}</p>
                        </div>
                        <p className="app-description">{app.description}</p>
                        <Indicator status={indicatorStatus}/>
                    </div>
                </div>
            </div>
        );
    }
}

App.propTypes = {
    app: PropTypes.object
};



export class Indicator extends React.PureComponent {
    render() {
        let btns;
        const status = this.props.status;
        if (status === "installed") {
            btns = [
                <button type="button" key="indicator_button"
                        className="btn btn-lg btn-installed">{this.context.t('installed')}</button>,
                <button type="button" key="indicator_icon" className="btn btn-lg btn-installed-indicator">
                    <i className="fa fa-check" />
                </button>
            ];
        } else if (status === "free") {
            btns = [
                <button type="button" key="indicator_button"
                        className="btn btn-lg btn-free">{this.context.t('free')}</button>,
                <button type="button" key="indicator_icon" className="btn btn-lg btn-free-indicator">
                    <i className="fa fa-gift" />
                </button>
            ];
        } else {
            btns = [
                <button type="button" key="indicator_button"
                        className="btn btn-lg btn-buy">{this.context.t('paid')}</button>,
                <button type="button" key="indicator_icon" className="btn btn-lg btn-buy-indicator">
                    <i className="fa fas fa-euro-sign" />
                </button>
            ];
        }

        return (
            <div className="app-status text-center">
                {btns}
            </div>
        );
    }
}

Indicator.propTypes = {
  status: PropTypes.string
};


Indicator.contextTypes = {
    t: PropTypes.func.isRequired
};