'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import Autosuggest from 'react-autosuggest';
var debounce = require('debounce');

import t from '../util/message';

import { GeoAreaAutosuggest } from '../util/geoarea-autosuggest.jsx';

var CreateOrModifyOrganizationModal = React.createClass({
    getInitialState: function () {
        return {
            organization: {},
            step: 1
        };
    },
    componentDidMount: function() {
        // TODO : only effective at the first opening
        $(ReactDOM.findDOMNode(this)).on("shown.bs.modal", function() {
            $("input:first", this).focus();
        });
    },
    open: function(organization) {
        this.setState({ organization: organization, step: 1 });
        $(ReactDOM.findDOMNode(this)).modal('show');
    },
    onStepChange: function(stepId) {
        this.setState({ step: stepId });
    },
    close: function() {
        $(ReactDOM.findDOMNode(this)).modal('hide');
    },
    closeAfterSuccess: function() {
        $(ReactDOM.findDOMNode(this)).modal('hide');
        this.props.successHandler();
    },
    render: function () {

        var modalTitle = (this.state.organization.exist ? t('my.network.modify-org') : t('my.network.create-org'))
            + " " + this.state.organization.legal_name;
        var modalSubTitle = t('my.network.organization.step') + " " + this.state.step + " / 2";

        return (
            <div className="modal fade" tabIndex="-1" role="dialog" aria-labelledby="modalLabel">
                <div className='modal-dialog modal-lg' role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={this.close}>
                                <span aria-hidden="true"><img src={image_root + "new/cross.png"} /></span>
                            </button>
                            <h3 className="modal-title" id="modalLabel">{modalTitle}</h3>
                            <h4>{modalSubTitle}</h4>
                        </div>
                        <CreateOrModifyOrganizationForm ref="form"
                                                        successHandler={this.closeAfterSuccess}
                                                        cancelHandler={this.close}
                                                        organization={this.state.organization}
                                                        step={this.state.step}
                                                        onStepChange={this.onStepChange}
                                                        fromStore={false} />
                    </div>
                </div>
            </div>
        );
    }
});

var CreateOrModifyOrganizationForm = React.createClass({
    getInitialState: function () {
        return {
            createOrUpdateError: { code: '', message: ''}
        }
    },
    onNextTab: function() {
        if (this.refs.tab1.validateFields()) {
            this.props.onStepChange(2);
        }
    },
    onPrevTab: function() {
        if (this.refs.tab2.validateFields()) {
            this.props.onStepChange(1);
        }
    },
    onCreate: function() {
        if (this.refs.tab1.validateFields() && this.refs.tab2.validateFields()) {
            var finalOrganization = $.extend({}, this.props.organization, this.refs.tab1.getFields());
            if (finalOrganization.exist) {
                this.updateOrganization(finalOrganization);
            } else {
                this.createOrganization(finalOrganization);
            }
        }
    },
    createOrganization: function(organization) {
        $.ajax({
            url: network_service + '/create-dc-organization',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(organization),
            success: function (data) {
                if (data) {
                    this.props.successHandler(data);
                } else {
                    console.error('Organization was not created : ' + organization);
                    this.setState({ createOrUpdateError: { code: 'Invalid response', message: 'The received response was empty' } });
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
                this.setState({ createOrUpdateError: { code: err, message: xhr.responseText } });
            }.bind(this)
        });
    },
    updateOrganization: function(organization){
        $.ajax({
            url: network_service + '/update-dc-organization',
            type: 'post',
            contentType: 'application/json',
            data: JSON.stringify(organization),
            success: function (data) {
                if (data) {
                    this.props.successHandler(data);
                } else {
                    console.error('Organization was not modified : ' + organization);
                    this.setState({ createOrUpdateError: { code: 'Invalid response', message: 'The received response was empty' } });
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
                this.setState({ createOrUpdateError: { code: err, message: xhr.responseText } });
            }.bind(this)
        });
    },
    renderCreateOrUpdateError: function () {
        if (this.state.createOrUpdateError.code !== '') {
            return (
                <div className="alert alert-danger">{this.state.createOrUpdateError.message} ({this.state.createOrUpdateError.code})</div>
            )
        }
    },
    render: function () {
        var organization = this.props.organization;

        return (
            <div>
                <div className="modal-body">
                    <form id="add-organization" onSubmit={this.onCreate} className="form-horizontal">
                        <div className="form-horizontal">
                            <Tab1 id="1" ref="tab1" organization={organization} currentTab={this.props.step}
                                  fromStore={this.props.fromStore} />
                            <Tab2 id="2" ref="tab2" organization={organization} currentTab={this.props.step} />
                        </div>
                        {this.renderCreateOrUpdateError()}
                    </form>
                </div>
                <div className="modal-footer">
                    <Button activeTab={this.props.step}
                            onNext={this.onNextTab}
                            onPrev={this.onPrevTab}
                            onCancel={this.props.cancelHandler}
                            onCreate={this.onCreate}
                            inModification={organization.inModification} />
                </div>
            </div>
        );
    }
});

var Button = React.createClass({
    renderStepSwitcherButton: function () {
        if (this.props.activeTab === 1) {
            return (
                <button type="button" key="next" className="control btn btn-default-inverse" onClick={this.props.onNext}>
                    {t('ui.next')}
                </button>
            )
        } else {
            return (
                <button type="button" key="prev" className="control btn btn-default-inverse" onClick={this.props.onPrev}>
                    {t('ui.previous')}
                </button>
            )
        }
    },
    renderCreateButton: function () {
        if (this.props.activeTab === 2) {
            if (this.props.inModification) {
                return (
                    <button type="submit" key="success" className="btn oz-btn-save" onClick={this.props.onCreate}>
                        {t('ui.edit')}
                    </button>
                )
            } else {
                return (
                    <button type="submit" key="success" className="btn oz-btn-save" onClick={this.props.onCreate}>
                        {t('ui.create')}
                    </button>
                )
            }
        }
    },
    render: function() {
        return (
            <div>
                <button type="button" key="cancel" className="btn oz-btn-cancel" onClick={this.props.onCancel}>
                    {t('ui.cancel')}
                </button>
                {this.renderStepSwitcherButton()}
                {this.renderCreateButton()}
            </div>
        );
    }
});

var Field = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        labelClassName: React.PropTypes.string,
        divClassName: React.PropTypes.string,
        error: React.PropTypes.bool,
        isRequired: React.PropTypes.bool
    },
    renderLabel: function(htmlFor, class_name, label, isRequired) {
        return (
            <label htmlFor={htmlFor} className={class_name}>{label} {isRequired ? '*' : ''} </label>
        );
    },
    render: function() {
        var labelClassName = this.props.labelClassName ? this.props.labelClassName : "control-label col-sm-3";
        if (this.props.isRequired) {
            labelClassName = labelClassName + " required";
        }
        var divClassName = this.props.divClassName ? this.props.divClassName : "col-sm-7";
        var formDivClassName = this.props.error ? "form-group has-error" : "form-group";

        return (
            <div className={formDivClassName}>
                {this.renderLabel(this.props.name, labelClassName, t('my.network.organization.' + this.props.name), this.props.isRequired)}
                <div className={divClassName}>
                    {this.props.children}
                </div>
            </div>
        );
    }
});

var Tab1 = React.createClass({
    getInitialState: function() {
        return {
            organization: {},
            contact_lastname: '',
            contact_name: '',
            errors: []
        };
    },
    componentWillMount: function() {
        $.ajax({
            url: network_service + '/general-user-info',
            type: 'get',
            contentType: 'json',
            success: function (data) {
                this.setState({
                    contact_lastname: data.user_lastname,
                    contact_name: data.user_name
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({ organization: nextProps.organization });
    },
    handleInputChange: function(event) {
        var organization = this.state.organization;
        if (event.target.id === 'contact_lastname')
            this.setState({ contact_lastname : event.target.value });
        else if (event.target.id === 'contact_name')
            this.setState({ contact_name : event.target.value });
        else
            organization[event.target.id] = event.target.value;

        this.setState({ organization: organization });
    },
    handleCityChange: function(city) {
        var organization = this.state.organization;
        organization.city_uri = city.uri;
        organization.city = city.name;
        organization.zip = city.postalCode;
        this.setState({ organization: organization });
    },
    validateFields: function() {
        // FIXME : as input changes are store in state, better check errors in state rather than refs
        var errors = [];
        if (!this.props.organization.inModification && !this.props.fromStore) {
            if (ReactDOM.findDOMNode(this.refs.contact_lastname).value.trim() === '')
                errors.push("contact_lastname");
            if (ReactDOM.findDOMNode(this.refs.contact_name).value.trim() === '')
                errors.push("contact_name");
        }
        if (ReactDOM.findDOMNode(this.refs.street_and_number).value.trim() === '')
            errors.push("street_and_number");
        if (!this.state.organization.city || this.state.organization.city === '')
            errors.push("city");
        if (ReactDOM.findDOMNode(this.refs.zip).value.trim() === ''
            || ReactDOM.findDOMNode(this.refs.zip).value.trim().search(/^\d+$/) === -1)
            errors.push("zip");
        if (ReactDOM.findDOMNode(this.refs.cedex).value.trim() !== ''
            && ReactDOM.findDOMNode(this.refs.cedex).value.trim().search(/^\d+$/) === -1)
            errors.push("cedex");

        if (errors.length > 0)
            errors.push("validation");
        this.setState({ errors: errors });

        return (errors.length == 0);
    },
    getFields: function() {
        if (!this.props.organization.inModification && !this.props.fromStore) {
            return {
                contact_lastName: ReactDOM.findDOMNode(this.refs.contact_lastname).value.trim(),
                contact_name: ReactDOM.findDOMNode(this.refs.contact_name).value.trim()
            }
        } else {
            return {}
        }
    },
    renderGeneralErrorMessage: function() {
        if ($.inArray('validation', this.state.errors) != -1) {
            return (
                <div className="alert alert-danger">{t('my.network.organization.invalid_fields')}</div>
            )
        }
    },
    renderProfileInformation: function() {
        if (!this.props.organization.inModification && !this.props.fromStore)
            return (
                <fieldset>
                    <legend>{t('my.network.organization.profile_information')}</legend>
                    <Field name="contact_lastname" error={$.inArray("contact_lastname", this.state.errors) != -1} isRequired={true}>
                        <input className="form-control" ref="contact_lastname" id="contact_lastname" type="text"
                               value={this.state.contact_lastname} onChange={this.handleInputChange} />
                    </Field>
                    <Field name="contact_name" error={$.inArray("contact_name", this.state.errors) != -1} isRequired={true}>
                        <input className="form-control" ref="contact_name" id="contact_name" type="text"
                               value={this.state.contact_name} onChange={this.handleInputChange} />
                    </Field>
                </fieldset>
            )
    },
    render: function() {
        var className = this.props.currentTab === 1 ? "" : "hidden";
        var country_uri = this.props.organization ? this.props.organization.country_uri : '';
        // FIXME : quite ugly and non-Reacty, find a better way to do this
        //         when called from the store, componentWillReceiveProps does not get called b/c there is no change in props
        //         find the right lifecycle hook to handle this properly
        this.state.organization = this.props.organization;

        return (
            <div id="tab1" className={className}>
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-15">
                            {this.renderProfileInformation()}
                            <fieldset>
                                <legend>{t('my.network.organization.contact_information')}</legend>
                                <Field name="street_and_number" error={$.inArray("street_and_number", this.state.errors) != -1} isRequired={true}>
                                    <input className="form-control" ref="street_and_number" id="street_and_number" type="text"
                                           value={this.state.organization.street_and_number} onChange={this.handleInputChange} />
                                </Field>
                                <Field name="po_box" error={$.inArray("po_box", this.state.errors) != -1} isRequired={false}>
                                    <input className="form-control" ref="po_box" id="po_box" type="text"
                                           value={this.state.organization.po_box} onChange={this.handleInputChange} />
                                </Field>
                                <Field name="city" error={$.inArray("city", this.state.errors) != -1} isRequired={true}>
                                    <GeoAreaAutosuggest countryUri={country_uri}
                                        endpoint="/dc-cities"
                                        onChange={this.handleCityChange}
                                        initialValue={this.state.organization.city} />
                                </Field>
                                <Field name="zip" divClassName='col-sm-2' error={$.inArray("zip", this.state.errors) != -1} isRequired={true}>
                                    <input className="form-control" ref="zip" id="zip" type="text" maxLength={6}
                                           value={this.state.organization.zip} onChange={this.handleInputChange} />
                                </Field>
                                <Field name="cedex" divClassName='col-sm-2' error={$.inArray("cedex", this.state.errors) != -1} isRequired={false}>
                                    <input className="form-control" ref="cedex" id="cedex" type="text" maxLength={3}
                                           value={this.state.organization.cedex} onChange={this.handleInputChange} />
                                </Field>
                            </fieldset>
                        </div>
                    </div>
                </div>
                {this.renderGeneralErrorMessage()}
            </div>
        );
    }
});

var Tab2 = React.createClass({
    getInitialState: function() {
        return {
            organization: {},
            errors: []
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({ organization: nextProps.organization });
    },
    handleInputChange: function(event) {
        var organization = this.state.organization;

        if (event.target.id === 'in_activity')
            organization.in_activity = event.target.checked;
        else
            organization[event.target.id] = event.target.value;

        this.setState({ organization: organization });
    },
    handleTaxRegActivityChange: function(taxRegActivity) {
        var organization = this.state.organization;
        organization.tax_reg_activity_uri = taxRegActivity.uri;
        organization.tax_reg_activity = taxRegActivity.name;
        this.setState({ organization: organization });
    },
    handleJurisdictionChange: function(jurisdiction) {
        var organization = this.state.organization;
        organization.jurisdiction_uri = jurisdiction.uri;
        organization.jurisdiction = jurisdiction.name;
        this.setState({ organization: organization });
    },
    validateFields: function() {
        var errors = [];
        if (ReactDOM.findDOMNode(this.refs.legal_name).value.trim() === '')
            errors.push("legal_name");
        if (this.state.organization.sector_type === 'PUBLIC_BODY' &&
            (!this.state.organization.jurisdiction || this.state.organization.jurisdiction === ''))
            errors.push("jurisdiction");

        if (errors.length > 0)
            errors.push("validation");
        this.setState({ errors: errors });

        return (errors.length == 0);
    },
    getFields: function() {
        return {}
    },
    // Get tax reg related labels according to organization's country
    // returns { tax_reg_num_label : string, tax_reg_official_id_label : string (optional), tax_reg_activity_uri_label : string (optional)
    getTaxRegLabels: function() {
        var tax_reg_num_label,
            tax_reg_official_id_label = '',
            tax_reg_activity_label = '';
        var n = this.state.organization.country_uri ? this.state.organization.country_uri.lastIndexOf('/') : -1;
        var acronymCountry = n > 0 ? this.state.organization.country_uri.substring(n + 1) : '';
        switch (acronymCountry) {
            case 'BG' : tax_reg_num_label = 'tax_reg_num.bg'; tax_reg_official_id_label = 'tax_reg_activity.bg'; break;
            case 'IT' : tax_reg_num_label = 'tax_reg_num.it'; tax_reg_official_id_label = 'tax_reg_activity.it'; break;
            case 'FR' : tax_reg_num_label = 'tax_reg_num.fr'; tax_reg_official_id_label = 'tax_reg_official_id.fr';
                        tax_reg_activity_label = 'tax_reg_activity.fr'; break;
            case 'ES' : tax_reg_num_label = 'tax_reg_num.es'; tax_reg_official_id_label = 'tax_reg_activity.es'; break;
            case 'TR' : tax_reg_num_label = 'tax_reg_num.tr'; tax_reg_official_id_label = 'tax_reg_official_id.tr';
                        tax_reg_activity_label = 'tax_reg_activity.tr'; break;
            default   : tax_reg_num_label = 'tax_reg_num.en'; break;
        }

        return {
            tax_reg_num_label: tax_reg_num_label,
            tax_reg_official_id_label: tax_reg_official_id_label,
            tax_reg_activity_label: tax_reg_activity_label
        };
    },
    renderTaxRegOfficialId: function(tax_reg_official_id_label) {
        if (tax_reg_official_id_label !== '' && this.state.organization.sector_type === 'PUBLIC_BODY') {
            return (
                <Field name={tax_reg_official_id_label} error={$.inArray("tax_reg_official_id", this.props.errors) != -1} isRequired={false}>
                    <input className="form-control" ref="tax_reg_official_id" id="tax_reg_official_id" type="text"
                           value={this.state.organization.tax_reg_official_id} onChange={this.handleInputChange} />
                </Field>
            )
        }
    },
    renderJurisdiction: function() {
        if (this.state.organization.sector_type === 'PUBLIC_BODY') {
            return (
                <Field name="jurisdiction" error={$.inArray("jurisdiction", this.props.errors) != -1} isRequired={true}>
                    <GeoAreaAutosuggest countryUri={this.props.organization.country_uri}
                                     endpoint="/geographicalAreas"
                                     onChange={this.handleJurisdictionChange}
                                     initialValue={this.state.organization.jurisdiction} />
                </Field>

            )
        }
    },
    renderGeneralErrorMessage: function() {
        if ($.inArray('validation', this.state.errors) != -1) {
            return (
                <div className="alert alert-danger">{t('my.network.organization.invalid_fields')}</div>
            )
        }
    },
    render: function() {
        var className = this.props.currentTab === 2 ? "" : "hidden";
        var taxRegNumLabels = this.getTaxRegLabels();
        var tax_reg_activity_uri_placeholder = !this.state.organization.tax_reg_activity_uri ? ' '
            : this.state.organization.tax_reg_activity_uri.substring(this.state.organization.tax_reg_activity_uri.lastIndexOf("/") + 1);

        return (
            <div id="tab2" className={className}>
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-15">
                            <fieldset>
                                <legend>{t('my.network.organization.additional_information')}</legend>
                                <Field name="legal_name" error={$.inArray("legal_name", this.state.errors) != -1} isRequired={true}>
                                    <input className="form-control" ref="legal_name" id="legal_name" type="text"
                                           value={this.state.organization.legal_name} onChange={this.handleInputChange} />
                                </Field>
                                <Field name={taxRegNumLabels.tax_reg_num_label} error={$.inArray("tax_reg_num", this.state.errors) != -1} isRequired={true}>
                                    <input className="form-control" ref="tax_reg_num" id="tax_reg_num" type="text"
                                           value={this.state.organization.tax_reg_num} disabled={true} />
                                </Field>
                                <Field name="sector_type" isRequired={true}>
                                    <input className="form-control" ref="sector_type" id="sector_type" type="text"
                                           value={t('my.network.organization.sector_type.' + this.state.organization.sector_type)} disabled={true} />
                                </Field>
                                <Field name="in_activity" error={$.inArray("in_activity", this.state.errors) != -1} isRequired={false}>
                                    <input id="in_activity" type="checkbox" checked={this.state.organization.in_activity}
                                           onChange={this.handleInputChange} />
                                </Field>
                                <Field name="alt_name" error={$.inArray("alt_name", this.state.errors) != -1} isRequired={false}>
                                    <input className="form-control" ref="alt_name" id="alt_name" type="text"
                                           value={this.state.organization.alt_name} onChange={this.handleInputChange} />
                                </Field>
                                <Field name="org_type" error={$.inArray("org_type", this.state.errors) != -1} isRequired={false}>
                                    <input className="form-control" ref="org_type" id="org_type" type="text"
                                           value={this.state.organization.org_type} onChange={this.handleInputChange}
                                           placeholder={t('my.network.organization.org_type.placeholder')} />
                                </Field>
                                <Field name={taxRegNumLabels.tax_reg_activity_label} class_name_div='col-sm-3' isRequired={false}>
                                    <TaxRegActivityAutosuggest countryUri={this.props.organization.country_uri}
                                        onChange={this.handleTaxRegActivityChange}
                                        initialValue={tax_reg_activity_uri_placeholder} />
                                </Field>
                                {this.renderTaxRegOfficialId(taxRegNumLabels.tax_reg_official_id_label)}
                                {this.renderJurisdiction()}
                                <Field name="phone_number" error={$.inArray("phone_number", this.state.errors) != -1} isRequired={false}>
                                    <input className="form-control" ref="phone_number" id="phone_number" type="text"
                                           value={this.state.organization.phone_number} onChange={this.handleInputChange} />
                                </Field>
                                <Field name="web_site" error={$.inArray("web_site", this.state.errors) != -1} isRequired={false}>
                                    <input className="form-control" ref="web_site" id="web_site" type="text"
                                           value={this.state.organization.web_site} onChange={this.handleInputChange} />
                                </Field>
                                <Field name="email" error={$.inArray("email", this.state.errors) != -1} isRequired={false}>
                                    <input className="form-control" ref="email" id="email" type="text"
                                           value={this.state.organization.email} onChange={this.handleInputChange} />
                                </Field>
                            </fieldset>
                        </div>
                    </div>
                </div>
                {this.renderGeneralErrorMessage()}
            </div>
        );
    }
});

var TaxRegActivityAutosuggest = React.createClass({
    propTypes: {
        initialValue: React.PropTypes.string,
        placeholder: React.PropTypes.string,
        countryUri: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {
            value: '',
            suggestions: [],
            isLoading: false
        };
    },
    componentDidMount: function() {
        this.setState({ value: this.props.initialValue });
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({ value: nextProps.initialValue });
    },
    searchTaxRegActivities: function(query) {
        if (query.trim().length < 2) return;

        $.ajax({
            url: store_service + "/dc-taxRegActivity",
            dataType: "json",
            data: { country_uri: this.props.countryUri, q: query },
            type: 'get',
            success: function(data) {
                this.setState({ suggestions : data.areas });
            }.bind(this),
            error: function(xhr, status, err) {
                console.error("Error while searching for tax reg activities with query " + query, status, err.toString())
            }
        })
    },
    renderSuggestion: function(data) {
        return (
            <div>
                <p className="main-info">{data.name} - {data.label}</p>
            </div>
        )
    },
    onSuggestionsUpdateRequested: function({ value, reason }) {
        this.setState({ value: value });
        if (reason !== 'enter' && reason !== 'click')
            debounce(this.searchTaxRegActivities(value), 500);
    },
    onSuggestionSelected: function(event, { suggestion, suggestionValue, method }) {
        this.setState({ value: suggestion.name });
        this.props.onChange(suggestion);
    },
    render: function() {
        const inputProps = {
            value: this.state.value,
            onChange: (event, { newValue, method }) => this.setState({ value: newValue }),
            type: 'search',
            placeholder: '',
            className: 'form-control'
        };

        return (
            <div className="input-group">
                <Autosuggest suggestions={this.state.suggestions}
                             onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
                             onSuggestionSelected={this.onSuggestionSelected}
                             getSuggestionValue={suggestion => suggestion.name}
                             renderSuggestion={this.renderSuggestion}
                             inputProps={inputProps}
                             shouldRenderSuggestions={input => input != null && input.trim().length > 1}/>
                <span className="input-group-addon"><i className="fa fa-search"></i></span>
            </div>
        )
    }
});

module.exports = { CreateOrModifyOrganizationModal, CreateOrModifyOrganizationForm };
