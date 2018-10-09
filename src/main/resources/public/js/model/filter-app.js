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
    selectedOrganizationId = '';
    geoArea =  {
        name:'',
        ancestors: []
    };
    searchText = '';

}