import React from "react";
import App from "../components/app";
import customFetch from "../util/custom-fetch";
import FilterApp from "../model/filter-app";

export default class AppStore extends React.Component {

    constructor() {
        super()
    }

    state = {
        filters: new FilterApp(),
        loading: true,
        maybeMoreApps: false
    };

    componentDidMount() {
        this._getApps();
    }

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

    _getApps = () => {
        const filters = this._transformSearchFilters();
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
        const {loading} = this.state;
        return (
                loading ?
                    null
                    :
                    <div style={styles.container}  id="store-apps">
                        {this._displayApps()}
                    </div>
        )
    }
}

const styles = {
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        flex: '1',
        padding: '1em 0 1em 0',
        justifyContent: 'center'
    }
};