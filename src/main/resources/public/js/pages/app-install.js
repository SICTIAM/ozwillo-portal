import React from "react";
import Slider from "react-slick";
import ModalImage from "../modal-image";
import {buyApplication, fetchAppDetails, fetchAvailableOrganizations, fetchRateApp} from "../util/store-service";
import RatingWrapper from "../components/rating";
import Select from 'react-select';
import PropTypes from "prop-types";
import customFetch from "../util/custom-fetch";
import DropDownMenu from "../components/dropdown-menu";
import {Link} from "react-router-dom";


export default class AppInstall extends React.Component {

    state = {
        app: {},
        appDetails: {
            longdescription: "",
            policy: "",
            rateable: false,
            rating: 0,
            screenshots: [],
            serviceUrl: null,
            tos: ''
        },
        config: {},
        organizationsAvailable: []
    };

    componentDidMount() {
        const {app, config} = this.props.location.state;
        this.setState({app: app, config: config}, () => {
            this._loadAppDetails()
            this._loadOrgs()
        });
    }

    _loadOrgs = async () => {
        const {app} = this.state;
        const data = await fetchAvailableOrganizations(app.type, app.id);
        this.setState({organizationsAvailable: data});
    };


    _loadAppDetails = async () => {
        const {app} = this.state;
        const data = await fetchAppDetails(app.type, app.id);
        this.setState({appDetails: data});
    };

    _rateApp = async (rate) => {
        let {app, appDetails} = this.state;
        await fetchRateApp(app.type, app.id, rate);
        appDetails.rateable = false;
        appDetails.rating = rate;
        this.setState({appDetails});
    };

    _displayScreenShots = (arrayScreenshots) => {
        if (arrayScreenshots) {
            return arrayScreenshots.map((screenshot, index) => {
                return (
                    <div key={index} onClick={() => this._openModal(screenshot)}>
                        <img className={"screenshot"} src={screenshot} alt={"screenshot" + index}/>
                    </div>
                )
            })
        }
    };

    _openModal = (imageSrc) => {
        this.refs.modalImage._openModal(imageSrc);
    };


    render() {
        const {app, appDetails, organizationsAvailable, config} = this.state;
        const settings = {
            dots: true,
            speed: 500,
            slidesToScroll: 1,
            variableWidth: true,
            accessibility: true,
        };

        return (
            <div className={"app-install-wrapper"}>
                <div className={"flex-row header-app-install"}>
                    <div className={"information-app flex-row"}>
                        <img alt={"app icon"} src={app.icon}/>
                        <div className={"information-app-details"}>
                            <p><strong>{app.name}</strong></p>
                            <p>{app.provider}</p>
                            <p>{app.description}</p>
                            <div className={"rate-content"}>
                                <RatingWrapper rating={appDetails.rating} rateable={appDetails.rateable}
                                               rate={this._rateApp}/>
                            </div>
                        </div>
                    </div>
                    <div className={"install-app"}>
                        <div className={"dropdown"}>
                            <InstallForm app={app} organizationsAvailable={organizationsAvailable} config={config}/>
                        </div>

                    </div>
                </div>


                {
                    appDetails.screenshots && appDetails.screenshots.length > 0 &&
                    <div className={"app-install-carousel"}>
                        <div className={"carousel-container"}>
                            <Slider {...settings}>
                                {this._displayScreenShots(appDetails.screenshots)}
                            </Slider>
                        </div>
                    </div>
                }

                <div className={"flex-row app-install-description"}>
                    {app.description}
                </div>
                < ModalImage
                    ref={"modalImage"}
                />
            </div>

            // App Install Container
            //First (row)
            // App information
            //Install form
            //Second (row)
            //Carousel
            //Third (row)
            //Description
        )
    }
}


export class InstallForm extends React.Component {

    state = {
        installType: null,
        error: {status: false, http_status: 200},
        organizationSelected: null,
        buying: false,
        installed: false
    };

    _hasCitizens = () => {
        return this.props.app.target_citizens;
    };

    _hasOrganizations = () => {
        return (this.props.app.target_companies) || (this.props.app.target_publicbodies);
    };

    _createOptions = () => {
        let options = [];
        this._hasCitizens() ? options.push({
            value: this.context.t('install.org.type.PERSONAL'),
            label: 'PERSONAL',
            id: 1
        }) : null;

        this._hasOrganizations() ? options.push({
            value: this.context.t('install.org.type.ORG'),
            label: 'ORG',
            id: 2
        }) : null;

        return options;
    };

    _installButtonIsDisabled = () => {
        const {app} = this.props;
        const {installType, organizationSelected, buying} = this.state;
        if (!installType || buying) {
            return true;
        } else if (installType && !(installType === 'PERSONAL') && !(app.type === "service") && organizationSelected) {
            return false;
        } else if (installType && ((installType === 'PERSONAL') || (app.type === "service"))) {
            return false;
        } else {
            return true;
        }
    };

    _doInstallApp = async () => {
        const {app} = this.props;
        const {organizationSelected} = this.state;
        // set buying to true to display the spinner until any below ajax response is received.
        this.setState({installed: false, buying: true, error: {status: false, http_status: 200}});
        try {
            await buyApplication(app.id, app.type, organizationSelected);
            this.setState({buying: false, installed: true});
        } catch (error) {
            this.setState({buying: false, error: {status: true, http_status: error.status}})
        }
    };

    render() {
        const options = this._createOptions();
        const {installType, organizationSelected, buying, installed, error} = this.state;
        const {organizationsAvailable, app} = this.props;
        let disabledOrganization = !installType;

        return (
            <React.Fragment>
                {!installed &&
                <Select
                    className="select"
                    value={installType}
                    labelKey="value"
                    valueKey="id"
                    onChange={(value) => this.setState({installType: value})}
                    clearable={false}
                    options={options}/>
                }

                {!installed && !(installType === 'PERSONAL') && !(app.type === "service") ?
                    <Select
                        disabled={disabledOrganization}
                        className={"select"}
                        value={organizationSelected}
                        labelKey="name"
                        valueKey="id"
                        onChange={(value) => this.setState({organizationSelected: value})}
                        clearable={false}
                        options={organizationsAvailable}
                    />
                    : null
                }

                <div className={"flex-row install-area"}>
                    {buying &&
                    <div className="container-loading text-center">
                        <i className="fa fa-spinner fa-spin loading"/>
                    </div>
                    }

                    {installed ?
                        <div className="install installed">
                            <Link className="btn btn-default-inverse pull-right btn-install"
                                  to={`/${this.props.config.language}/store`}>
                                {this.context.t('market')}
                            </Link>
                            <Link className="btn btn-default-inverse pull-right btn-install dashboard"
                                  to={"/my/dashboard"}>
                                {this.context.t('dashboard')}
                            </Link>
                        </div>
                        :
                        <div className="install">
                            <button className="btn pull-right btn-install" disabled={this._installButtonIsDisabled()}
                                    onClick={this._doInstallApp}>{this.context.t('install')}</button>
                        </div>
                    }
                </div>
                {error.http_status !== 200 &&
                <div className={"alert alert-danger"}>
                    <p>{this.context.t('could-not-install-app')}</p>
                </div>
                }
            </React.Fragment>
        )
    }

}


InstallForm.contextTypes = {
    t: PropTypes.func.isRequired
};

InstallForm.propTypes = {
    app: PropTypes.object.isRequired,
    organizationsAvailable: PropTypes.array.isRequired
};


