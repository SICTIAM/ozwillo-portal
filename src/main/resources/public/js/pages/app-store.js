import React from "react";
import App from "../components/app";
import customFetch from "../util/custom-fetch";
import FilterApp from "../model/filter-app";
import SideNav from "../components/side-nav";
import SearchAppForm from "../components/search-apps-form";

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
        scrollValue: 0
    };

    componentDidMount() {
        this._getApps();
    }

    updateFilters = (category, key, value) => {
        const filters = this.state.filters;
        if (category) {
            const filterCategory = filters[category];
            filterCategory[key] = value;
        } else {
            filters[key] = value;
        }
        this.setState({filters: filters});
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
            geoArea_AncestorsUris: filters.geoAreaAncestorsUris,
            category_ids: [],
            q: filters.searchText
        };
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

    _getApps = () => {
        const filters = this._transformSearchFilters();
        this._countActiveFilters(filters);
        customFetch(`/api/store/applications`, {urlParams: filters})
            .then((res) => {
                this.setState({
                    apps: res.apps,
                    maybeMoreApps: res.maybeMoreApps,
                    loading: false
                });
            })
            .catch((err) => {
                this.setState({apps: [], loading: false});
                console.error(err.toString());
            });
    };

    _displayApps = () => {
        return this.state.apps.map((app) => {
            return (
                <App key={app.id} app={app}/>
            );
        });
    };

    _handleScroll = (e) => {
        const newScrollValue = e.target.scrollTop;
        const {scrollValue} = this.state;
        let diff = Math.abs(newScrollValue - scrollValue);
        if(diff > 5) {
            if (newScrollValue > scrollValue) {
                this.setState({isSearchBarVisible: "invisible", scrollValue: newScrollValue});
            } else {
                this.setState({isSearchBarVisible: "visible",  scrollValue: newScrollValue});
            }
        }
    };

    render() {
        const {loading, activeFiltersNumber} = this.state;
        const filterCounter = activeFiltersNumber > 0 &&
            <div className={"badge-filter"}>{activeFiltersNumber}</div>;

        return (
            loading ?
                null
                :
                <div className={"app-store-wrapper"}>
                    <SideNav isOpenChildren={filterCounter}>
                        <SearchAppForm updateFilter={this.updateFilters}/>
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
        )
    }
}
