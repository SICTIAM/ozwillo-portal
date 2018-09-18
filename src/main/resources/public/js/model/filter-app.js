export default class FilterApp {
    audience = {
        citizens: false,
        publicbodies: false,
        companies: false
    };
    payment = {
        paid: false,
        free: false
    };
    selectedLanguage = '';
    geoAreaAncestorsUris =  [];
    searchText = '';

}