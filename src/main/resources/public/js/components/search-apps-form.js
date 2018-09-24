import React from "react";
import PropTypes from 'prop-types';
import customFetch from "../util/custom-fetch";
import GeoAreaAutosuggest from "./autosuggests/geoarea-autosuggest";
import LabelSection from "./label-section";
import PillButton from "./pill-button";

export default class SearchAppsForm extends React.Component {

    state = {
        languages: [],
        selectedLanguage: '',
        geoArea: '',
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
        this._fetchLanguages();

    }

    _fetchLanguages = () => {
        customFetch('/api/config').then(
            res => {
                let languages = Object.assign([], res.languages);
                languages.unshift('all');
                this.setState({languages: languages, selectedLanguage: res.language});
                this.props.updateFilter(null, "selectedLanguage", res.language);
            }
        )
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
        const {languages, selectedLanguage, payment, audience} = this.state;
        const languageComponents = languages.map(language =>
            <option key={language} value={language}>{this.context.t(`store.language.${language}`)}</option>
        );

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