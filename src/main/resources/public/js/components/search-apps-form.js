import React from "react";
import PropTypes from 'prop-types';
import customFetch from "../util/custom-fetch";
import GeoAreaAutosuggest from "./autosuggests/geoarea-autosuggest";
import LabelSection from "./label-section";
import PillButton from "./pill-button";
import {fetchUserInfoAction} from "../actions/user";
import {fetchUserInfos} from "../util/user-service";

export default class SearchAppsForm extends React.Component {

    state = {
        languages: [],
        selectedLanguage: '',
        selectedOrganizationId: '',
        geoArea: '',
        organizations: null,
        payment: {
            free: false,
            paid: false
        },
        audience: {
            publicbodies: false,
            citizens: false,
            companies: false

        }

    };

    componentDidMount() {
        this.initialize();
    }

    initialize = async () => {
        const {config} = this.props;
        let languages = Object.assign([], config.languages);
        languages.unshift('all');
        this.setState({languages: languages, selectedLanguage: config.language});
        this.props.updateFilter(null, "selectedLanguage", config.language);

        //organization input is just available when user is connected
        const userInfo = await fetchUserInfos();
        if(userInfo){
            customFetch("/my/api/organization").then((organizations) => {
                organizations.unshift({name:this.context.t(`store.language.all`), id: ''});
                this.setState({organizations: organizations});
            });
        }


    };

    _handleLanguageClicked = (event) => {
        const selectedLanguage = event.target.value;
        this.setState({selectedLanguage: selectedLanguage});
        this.props.updateFilter(null, "selectedLanguage", selectedLanguage);
    };

    _handleGeoSelected = (event, value) => {
        this.props.updateFilter(null, "geoAreaAncestorsUris", value.ancestors);
    };

    _handleGeoChange = (event, value) => {
        this.setState({geoArea: value});
        if(value===''){
            this.props.updateFilter(null, "geoAreaAncestorsUris", '');
        }
    };

    _handleOrganizationChange = (event) => {
        const selectedOrganizationId = event.target.value;
        this.setState({selectedOrganizationId: selectedOrganizationId});
        this.props.updateFilter(null, "selectedOrganizationId", selectedOrganizationId);
    };

    _handleOnPaymentChange = (event) => {
        const inputModified = event.target.name;
        let {payment} = this.state;
        payment[inputModified] = event.target.checked;
        this.setState({payment: payment});

        this.props.updateFilter("payment", inputModified, event.target.checked);
    };
    _handleAudienceChange = (event) => {
        const inputModified = event.target.name;
        let {audience} = this.state;
        audience[inputModified] = event.target.checked;
        this.setState({audience: audience});

        this.props.updateFilter("audience", inputModified, event.target.checked);
    };

    render() {
        const {languages, selectedLanguage, payment, audience, selectedOrganizationId, organizations} = this.state;
        const languageComponents = languages.map(language =>
            <option key={language} value={language}>{this.context.t(`store.language.${language}`)}</option>
        );
        const organizationComponents = organizations ? organizations.map(organization =>
            <option key={organization.id} value={organization.id}>{organization.name}</option>
        ) : null;

        return (
            <div id="search-apps-form">
                {/*LANGUAGE*/}
                <LabelSection label={this.context.t('languages-supported-by-applications')}>
                    <select id="language" className="form-control"
                            onChange={this._handleLanguageClicked}
                            value={selectedLanguage}>
                        {languageComponents}
                    </select>
                </LabelSection>
                {/*GEOAREA*/}
                <LabelSection label={this.context.t('geoarea')}>
                    <GeoAreaAutosuggest name="geoSearch"
                                        countryUri=""
                                        endpoint="areas"
                                        onChange={this._handleGeoChange}
                                        onGeoAreaSelected={this._handleGeoSelected}
                                        value={this.state.geoArea}
                    />
                </LabelSection>
                {/*ORGANIZATION*/}
                {organizations &&
                    <LabelSection label={this.context.t('organization.search.title')}>
                        <select id="organization" className="form-control"
                                onChange={this._handleOrganizationChange}
                                value={selectedOrganizationId}>
                            {organizationComponents}
                        </select>
                    </LabelSection>
                }
                {/*MODE*/}
                <LabelSection label={this.context.t('mode')}>
                    <PillButton label={this.context.t('free')} id={"free-checkbox"}
                                checked={payment.free} name={'free'} onChange={this._handleOnPaymentChange}/>

                    <PillButton label={this.context.t('paid')} id={"paid-checkbox"}
                                checked={payment.paid} name={'paid'} onChange={this._handleOnPaymentChange}/>

                </LabelSection>
                {/*AUDIENCE*/}
                <LabelSection label={this.context.t('audience')}>
                    <PillButton label={this.context.t('citizens')} id={"citizens-checkbox"}
                                checked={audience.citizens} name={'citizens'} onChange={this._handleAudienceChange}/>

                    <PillButton label={this.context.t('publicbodies')} id={"publicbodies-checkbox"}
                                checked={audience.publicbodies} name={'publicbodies'} onChange={this._handleAudienceChange}/>

                    <PillButton label={this.context.t('companies')} id={"companies-checkbox"}
                                checked={audience.companies} name={'companies'} onChange={this._handleAudienceChange}/>
                </LabelSection>


            </div>

        )
    }


}

SearchAppsForm.contextTypes = {
    t: PropTypes.func.isRequired
};

SearchAppsForm.propTypes = {};