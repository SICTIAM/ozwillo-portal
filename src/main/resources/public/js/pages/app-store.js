import React from "react";
import App from "../components/app";
import customFetch from "../util/custom-fetch";
import FilterApp from "../model/filter-app";
import SideNav from "../components/side-nav";
import SearchAppForm from "../components/search-apps-form";
import CustomTooltip from "../components/custom-tooltip";
import PropTypes from "prop-types";

import swal from "sweetalert2";

export default class AppStore extends React.Component {

    constructor() {
        super();
    }

    state = {
        filters: new FilterApp(),
        loading: true,
        maybeMoreApps: false,
        activeFiltersNumber: 0,
        isSearchBarVisible: "visible",
        scrollValue: 0,
        config: {}
    };

    componentDidMount() {
        this._askForFilters();
    }

    componentWillUnmount() {
        if (location.href.match("store")) {
            localStorage.setItem("askFilterPermission", 'false')
        } else {
            localStorage.setItem("askFilterPermission", 'true')
        }
    }

    _askForFilters = () => {
        const potentialOldFilters = this._getFiltersFromLocalStorage();
        const askFilterPermission = JSON.parse(localStorage.getItem("askFilterPermission"));

        this.initialize();

        if (potentialOldFilters && !askFilterPermission) {
            this.setState({filters: potentialOldFilters}, () => {
                this._setFiltersInLocalStorage(potentialOldFilters);
            });
        } else if (potentialOldFilters && askFilterPermission) {
            swal({
                title: this.context.t("apply-old-filters"),
                type: 'info',
                showCancelButton: true,
                cancelButtonText: this.context.t("ui.cancel"),
                confirmButtonText: this.context.t("ui.yes")
            }).then((result) => {
                if (result.value) {
                    this.setState({filters: potentialOldFilters}, () => {
                        this._setFiltersInLocalStorage(potentialOldFilters);
                    });
                }
            })
        }
    };

    initialize = async () => {
        await this._fetchConfig();
        await this._getApps();
    };

    _fetchConfig = async () => {
        await customFetch('/api/config').then(
            config => {
                this.setState({config: config})
            }
        )
    };

    updateFilters = (category, key, value) => {
        const filters = this.state.filters;
        if (category) {
            const filterCategory = filters[category];
            filterCategory[key] = value;
        } else {
            filters[key] = value;
        }
        this.setState({filters: filters});
        this._setFiltersInLocalStorage(filters);
        this._getApps();
    };

    _handleFullTextSearchChanged = (event) => {
        this.updateFilters(null, "searchText", event.target.value);
    };

    _transformSearchFilters = () => {
        const supported_locales = [];
        if (this.state.filters.selectedLanguage !== 'all') {
            supported_locales.push(this.state.filters.selectedLanguage);
        }
        const {filters} = this.state;
        return {
            target_citizens: filters.audience.citizens,
            target_publicbodies: filters.audience.publicbodies,
            target_companies: filters.audience.companies,
            free: filters.payment.free,
            paid: filters.payment.paid,
            supported_locales: supported_locales,
            organizationId: filters.selectedOrganizationId,
            geoArea_AncestorsUris: filters.geoArea.ancestors,
            category_ids: [],
            q: filters.searchText
        };
    };

    _setFiltersInLocalStorage = (filters) => {
        localStorage.setItem('filters', JSON.stringify(filters));
    };

    _getFiltersFromLocalStorage = () => {
        return JSON.parse(localStorage.getItem('filters'));
    };

    _countActiveFilters = (filters) => {
        let counter = 0;
        for (let key in filters) {
            let elem = filters[key];
            if ((elem && Array.isArray(elem) && elem.length > 0)
                || (elem && elem !== '' && !Array.isArray(elem))) {
                counter++;
            }
        }
        this.setState({activeFiltersNumber: counter});
    };

    _resetFilters = () => {
        const cleanFilters = new FilterApp();
        this.setState({filters: cleanFilters}, () => {
            this._setFiltersInLocalStorage(cleanFilters);
            this.refs['searchAppForm'].resetFilters();
            this.initialize();
        });
    };

    _getApps = async () => {
        const filters = this._transformSearchFilters();
        this._countActiveFilters(filters);
        try {
            const res = await customFetch(`/api/store/applications`, {urlParams: filters});
            this.setState({
                apps: res.apps,
                maybeMoreApps: res.maybeMoreApps,
                loading: false
            });
        } catch (err) {
            this.setState({apps: [], loading: false});
            console.error(err.toString());
        }
    };

    _displayApps = () => {
        return this.state.apps.map((app) => {
            return (
                <App key={app.id} app={app} config={this.state.config}/>
            );
        });
    };

    _handleScroll = (e) => {
        const newScrollValue = e.target.scrollTop;
        const {scrollValue} = this.state;
        let diff = Math.abs(newScrollValue - scrollValue);
        if (diff > 5) {
            if (newScrollValue > scrollValue) {
                this.setState({isSearchBarVisible: "folds", scrollValue: newScrollValue});
            } else {
                this.setState({isSearchBarVisible: "visible", scrollValue: newScrollValue});
            }
        }
    };

    render() {
        this.cancel = this.context.t("ui.cancel");
        const {loading, activeFiltersNumber, config, filters} = this.state;
        const filterCounter = activeFiltersNumber > 0 &&
            <div className={"badge-filter-close"}>
                <CustomTooltip title={this.context.t("active-filter")}>{activeFiltersNumber}</CustomTooltip>
            </div>;
        const filterCounterHeader = activeFiltersNumber > 0 &&
            <div className={"reset-filters"}>
                <i className={"fa fa-trash"} onClick={this._resetFilters}/>
                <div className={"badge-filter-open"}>
                    <CustomTooltip title={this.context.t("active-filter")}>
                        {activeFiltersNumber}
                    </CustomTooltip>
                </div>
            </div>;


        return (
            <React.Fragment>
                {loading ?
                    <div className={"app-store-wrapper"}>
                        <div className="app-store-container-loading text-center">
                            <i className="fa fa-spinner fa-spin loading"/>
                        </div>
                    </div>
                    :
                    <div className={"app-store-wrapper"}>
                        <SideNav isCloseChildren={filterCounter} isOpenHeader={filterCounterHeader}>
                            <SearchAppForm ref={"searchAppForm"} updateFilter={this.updateFilters} config={config}
                                           filters={filters}/>
                        </SideNav>
                        <div className={"app-store-container"} id="store-apps" onScroll={this._handleScroll}>

                            <input type="text" id="fulltext"
                                   className={"form-control search-bar " + this.state.isSearchBarVisible}
                                   onChange={this._handleFullTextSearchChanged}
                                   placeholder={"keywords"} name="fullTextSearch"/>
                            <div className={"app-list"}>
                                {this._displayApps()}
                            </div>
                        </div>
                    </div>
                }
            </React.Fragment>
        )
    }
}

AppStore.contextTypes = {
    t: PropTypes.func.isRequired
};
