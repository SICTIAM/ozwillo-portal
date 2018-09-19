import React from "react";
import PropTypes from 'prop-types';
import customFetch from "../util/custom-fetch";
import GeoAreaAutosuggest from "./autosuggests/geoarea-autosuggest";
import LabelInput from "./label-input";

export default class SearchAppsForm extends React.Component {

    state = {
        languages: [],
        selectedLanguage: '',
        geoArea: '',
        payment: {
            free: false,
            paid: false
        },
        audience:{
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


        //TODO create pills for the input checked
        return (
            <div id="search-apps-form">
                {/*LANGUAGE*/}
                <LabelInput label={this.context.t('languages-supported-by-applications')}>
                            <select id="language" className="form-control"
                                    onChange={this._handleLanguageClicked}
                                    value={selectedLanguage}>
                                {languageComponents}
                            </select>
                </LabelInput>
                {/*GEOAREA*/}
                <LabelInput label={this.context.t('geoarea')}>
                        <GeoAreaAutosuggest name="geoSearch"
                                            countryUri=""
                                            endpoint="areas"
                                            onChange={this._handleGeoChange}
                                            onGeoAreaSelected={this._handleGeoSelected}
                                            value={this.state.geoArea}
                        />
                </LabelInput>
                {/*MODE*/}
                <LabelInput label={this.context.t('mode')}>
                    <label className="checkbox-inline">
                        <input type="checkbox" name="free" checked={payment.free}
                               onChange={this._handleOnPaymentChange}/>{this.context.t('free')}
                    </label>
                    <label className="checkbox-inline">
                        <input type="checkbox" name="paid" checked={payment.paid}
                               onChange={this._handleOnPaymentChange}/>{this.context.t('paid')}
                    </label>
                </LabelInput>
                {/*AUDIENCE*/}
                <LabelInput label={this.context.t('audience')}>
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="citizens"
                                   checked={audience.citizens}
                                   onChange={this._handleAudienceChange}/>{this.context.t('citizens')}
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="publicbodies"
                                   checked={audience.publicbodies}
                                   onChange={this._handleAudienceChange}/>{this.context.t('publicbodies')}
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input type="checkbox" name="companies"
                                   checked={audience.companies}
                                   onChange={this._handleAudienceChange}/>{this.context.t('companies')}
                        </label>
                    </div>
                </LabelInput>


            </div>

        )
    }


}

SearchAppsForm.contextTypes = {
    t: PropTypes.func.isRequired
};

SearchAppsForm.propTypes = {};