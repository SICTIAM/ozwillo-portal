/** @jsx React.DOM */

var MyApps = React.createClass({displayName: 'MyApps',
    getInitialState: function () {
        return {
            loading: true,
            authorities: []
        };
    },
    componentDidMount: function () {
        $.ajax({
            url: apps_service + "/authorities",
            dataType: "json",
            success: function (data) {
                this.setState({
                    loading: false,
                    authorities: data
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function () {
        if (this.state.loading) {
            return React.DOM.p({className: "text-center"}, React.DOM.i({className: "fa fa-spinner fa-spin"}), " ", t('loading'));
        }
        var auths = this.state.authorities.map(function (auth) {
            return (
                Authority({name: auth.name, key: auth.id, openByDefault: auth.type == 'INDIVIDUAL'})
                );
        });
        return (
            React.DOM.div({className: "container panel-group"}, 
                auths
            )
            );
    }


});
var Authority = React.createClass({displayName: 'Authority',

    getInitialState: function () {
        return {open: this.props.openByDefault};
    },
    toggle: function () {
        this.setState({open: !this.state.open});
    },
    render: function () {
        var content;
        if (this.state.open) {
            content = InstanceList({id: this.props.key, name: this.props.name, authority: this.props.key});
        } else {
            content = null;
        }

        return (
            React.DOM.div({className: "panel panel-default"}, 
                React.DOM.div({className: "panel-heading"}, 
                    React.DOM.h4({className: "panel-title", onClick: this.toggle}, 
                        React.DOM.span(null, this.props.name), 
                        OpenAuthority({callback: this.toggle, open: this.state.open})
                    )
                ), 
                React.DOM.div({ref: "content"}, 
          content
                )
            )
            );
    }
});

var OpenAuthority = React.createClass({displayName: 'OpenAuthority',
    click: function () {
        this.props.callback();
    },
    render: function () {
        var className = this.props.open ? 'caret' : 'caret inverse';
        return (
            React.DOM.a({className: "authority-link pull-right", onClick: this.click}, 
                React.DOM.b({className: className})
            )
            );
    }
});

var InstanceList = React.createClass({displayName: 'InstanceList',
    getInitialState: function () {
        return {
            loading: true,
            instances: []
        };
    },
    componentDidMount: function () {
        $.ajax({
            url: apps_service + "/instances/" + this.props.id,
            dataType: "json",
            success: function (data) {
                this.setState({
                    loading: false,
                    instances: data
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    componentDidUpdate: function () {
        $(this.getDOMNode()).toggle("blind");
    },
    render: function () {
        if (this.state.loading) {
            return React.DOM.p({className: "text-center"}, React.DOM.i({className: "fa fa-spinner fa-spin"}), " ", t('loading'));
        }

        var instances = this.state.instances;
        var authority = this.props.authority;
        var result = instances.length != 0 ? instances.map(function (instance) {
            return Instance({key: instance.id, instance: instance, authority: authority});
        }) : React.DOM.div({className: "text-center"}, t('none'), " ", React.DOM.b(null, this.props.name)
        )

        return React.DOM.div({className: "panel collapse"}, 
      result
        );
    }
});

var Instance = React.createClass({displayName: 'Instance',
    manageUsers: function (event) {
        event.preventDefault();
        this.refs.users.init();
        this.refs.manageUsers.open();
    },
    saveUsers: function () {
        this.refs.manageUsers.close();
        $.ajax({
            url: apps_service + "/users/instance/" + this.props.key,
            dataType: 'json',
            contentType: 'application/json',
            type: 'post',
            data: JSON.stringify(this.refs.users.getSelectedUsers()),
            error: function (xhr, status, err) {
                console.error(apps_service + "/users/instance/" + this.props.key, status, err.toString());
            }.bind(this)
        });
    },
    loadUsers: function (callback, error) {
        $.ajax({
            url: apps_service + "/users/instance/" + this.props.key,
            dataType: 'json',
            method: 'get',
            success: callback,
            error: function (xhr, status, err) {
                console.error(apps_service + "/users/instance/" + this.props.key, status, err.toString());
                if (error != undefined) {
                    error();
                }
            }.bind(this)
        });
    },
    queryUsers: function (query, callback) {
        $.ajax({
            url: apps_service + "/users/network/" + this.props.authority + "?q=" + query,
            dataType: 'json',
            method: 'get',
            success: callback,
            error: function (xhr, status, err) {
                console.error(apps_service + "/users/network/" + this.props.authority + "?q=" + query, status, err.toString());
            }.bind(this)
        });
    },
    componentDidMount: function() {
        $("a.tip", this.getDOMNode()).tooltip();
    },
    render: function () {
        var instance = this.props.key;
        var services = this.props.instance.services.map(function (service) {
            return Service({key: service.service.id, service: service, instance: instance});
        });

        return (
            React.DOM.div({className: "panel panel-instance"}, 
                Modal({ref: "manageUsers", title: t('manage_users'), successHandler: this.saveUsers}, 
                    UserPicker({ref: "users", users: this.loadUsers, source: this.queryUsers})
                ), 

                React.DOM.div({className: "panel-heading"}, 
                    React.DOM.img({height: "32", width: "32", alt: this.props.instance.name, src: this.props.instance.icon}), 
                    React.DOM.span({className: "appname"}, this.props.instance.name), 
                    React.DOM.a({className: "tip btn btn-default pull-right", href: "#", onClick: this.manageUsers, 'data-toggle': "tooltip", 'data-placement': "bottom", title: t('manage_users')}, React.DOM.li({className: "fa fa-user"}))
                ), 
                React.DOM.div({className: "panel-body"}, 
                    React.DOM.div({className: "standard-form"}, 
                        React.DOM.div({className: "row form-table-header"}, 
                            React.DOM.div({class: "col-sm-10"}, t('services'))
                        ), 
                        services
                    )
                )
            )
            );
    }
});


React.renderComponent(
    MyApps(null), document.getElementById("myapps")
);