import React from "react";
import App from "../components/app";
import customFetch from "../util/custom-fetch";
import FilterApp from "../model/filter-app";
import SideNav from "../components/side-nav";

export default class AppStore extends React.Component {

    constructor() {
        super()
    }

    state = {
        filters: new FilterApp(),
        loading: true,
        maybeMoreApps: false,
        activeFiltersNumber: 0
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
        for(let key in filters){
            let elem = filters[key];
            if ((elem && Array.isArray(elem) && elem.length > 0)
                || (elem && !Array.isArray(elem))) {
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

    render() {
        const {loading, activeFiltersNumber} = this.state;
        return (
            loading ?
                null
                :
                <div style={styles.container}>
                    <SideNav activeFiltersNumber={activeFiltersNumber} updateFilters={this.updateFilters}/>
                    <div style={styles.appContainer} id="store-apps">
                        {this._displayApps()}
                    </div>
                </div>
        )
    }
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'row',
        flex: '1',
    },
    appContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        flex: '1',
        padding: '1em 0 1em 0',
        justifyContent: 'center',
    },

};