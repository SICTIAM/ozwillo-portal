/** @jsx React.DOM */

/** Custom translation */
function t(key) {
    if (typeof _i18n != 'undefined') {
        var v = _i18n[key];
        if (v != null) {
            return v;
        } else {
            v = _i18n["notif." + key];
            if (v != null) {
                return v;
            }
        }
    }
    return key;
}



var NotificationTable = React.createClass({

    getInitialState: function() {
        return {
            n: [],
            apps: [],
            currentSort: {
                prop: 'date', // date, changing to dataText to test issue #217
                dir: -1
            },
            filter: {
                app: null,
                status: "UNREAD"
            }
        };
    },

    loadNotifications: function() {
        $.ajax({
            url: this.props.url,
            data: {status: this.state.filter.status},
            datatype: 'json',
            success: function(data) {
                var s = this.state;
                var notifs = data.notifications;

                var currentSort = s.currentSort;
                s.n = notifs.sort(function (a, b) {
                    if (typeof a[currentSort.prop] == "number") {
                        return (a[currentSort.prop] - b[currentSort.prop]) * currentSort.dir;
                    } else {
                        return a[currentSort.prop].localeCompare(b[currentSort.prop]) * currentSort.dir;
                    }
                });
                s.apps = data.apps;
                this.setState(s);
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });


    },
    componentDidMount: function() {
        this.loadNotifications();
        setInterval(this.loadNotifications, this.props.pollInterval);
    },
    sortBy: function(criterion) {
        var component = this;
        return function() {
            var currentSort = component.state.currentSort;

            var sortDirection = -1;
            if (currentSort.prop == criterion) {
                // we are already sorting by the given criterion, so let's sort inversely
                sortDirection = currentSort.dir * -1;
            }
            currentSort.prop = criterion;
            currentSort.dir = sortDirection;

            var n = component.state.n.sort(function (a, b) {
                if (typeof a[currentSort.prop] == "number") {
                    return (a[currentSort.prop] - b[currentSort.prop]) * currentSort.dir;
                } else {
                    return a[currentSort.prop].localeCompare(b[currentSort.prop]) * currentSort.dir;
                }
            });
            var state = component.state;
            state.n = n;
            state.currentSort = currentSort;
            component.setState(state);
        };
    },
    filterByStatus: function (event) {
        event.preventDefault();
        var state = this.state;
        state.filter.status = event.target.value;
        this.setState(state);
        this.loadNotifications();
    },
    filterByApp: function (event) {
        event.preventDefault();
        var state = this.state;
        var appId = event.target.value;
        if (appId == "all") {
            appId = null;
        }
        state.filter.app = appId;
        this.setState(state);
    },
    removeNotif: function(id) {
        var notifs = this.state.n.filter(function(n) {return n.id != id;});

        this.setState({n:notifs});

        $.ajax({
            url: this.props.url + "/" + id,
            method: 'delete',
            datatype: 'json',
            success: function(data) {
                // nothing much to say is there?
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function () {
        var callback = this.removeNotif;
        var appId = this.state.filter.app;
        var status = this.state.filter.status;
        var notificationNodes = this.state.n
            .filter(function (notif) {
                if (appId == null) {
                    return true;
                } else {
                    return notif.serviceId == appId;
                }
            })
            .map(function (notif) {
                return (
                    <Notification key={notif.id} notif={notif} status={status} onRemoveNotif={callback}/>
                );
            });

        if (notificationNodes.length == 0) {
            notificationNodes = <div>{t('no-notification')}</div>;
        }



        return (
            <div>
                <NotificationHeader filter={this.state.filter} updateStatus={this.filterByStatus} updateAppFilter={this.filterByApp} apps={this.state.apps}/>
                <div className="standard-form">
                    <div className="row form-table-header">
                        <SortableHeader name="date" label="date" size="2" sortBy={this.sortBy} sort={this.state.currentSort}/>
                        <SortableHeader name="appName" size="2" label="app" sortBy={this.sortBy} sort={this.state.currentSort}/>
                        <SortableHeader name="formattedText" label="message" size="6" sortBy={this.sortBy} sort={this.state.currentSort}/>
                    </div>
                {notificationNodes}
                </div>
            </div>
        );
    }

});

var SortableHeader = React.createClass({
    render: function () {
        var className = "col-sm-" + this.props.size + " sortable";
        var sortIcon = <i className="fa fa-sort"></i>;
        if (this.props.sort.prop == this.props.name) {
            if (this.props.sort.dir == -1) {
                sortIcon = <i className="fa fa-sort-desc"></i>;
            } else {
                sortIcon = <i className="fa fa-sort-asc"></i>;
            }
        }

        return (
            <div className={className} onClick={this.props.sortBy(this.props.name)}>{t(this.props.label)} {sortIcon}</div>
        );
    }

});

var NotificationHeader = React.createClass({
    render: function () {
        return (
            <div className="row">
                <h2 className="col-sm-3">{t('ui.notifications')}</h2>
                <div className="col-sm-9 text-right">
                    <form className="form-inline header-form">
                        <AppFilter apps={this.props.apps} onChange={this.props.updateAppFilter} />
                        <span className="spacer"></span>
                        <select name="status" className="form-control" onChange={this.props.updateStatus}>
                            <option value="UNREAD">{t('unread')}</option>
                            <option value="READ">{t('read')}</option>
                            <option value="ANY">{t('any')}</option>
                        </select>
                    </form>
                </div>
            </div>
        );
    }
});

var AppFilter = React.createClass({
    render: function () {
        var options = this.props.apps.map(function (app) {
            return <option key={app.id} value={app.id}>{app.name}</option>;
        });
        return (
            <select name="app" className="form-control" onChange={this.props.onChange}>
                <option value="all">{t('all-apps')}</option>
            {options}
            </select>
        );
    }
});

var Notification = React.createClass({
    displayName: "Notification",
    removeNotif: function () {
        this.props.onRemoveNotif(this.props.notif.id);
    },
    render: function() {
        var action_by_url = null;
        var action_archive = null;

        if (this.props.notif.url) {
            action_by_url = <a href={this.props.notif.url} target="_new" className="btn btn-primary" >{this.props.notif.actionText}</a>;
        }
        if(this.props.notif.status !== "READ"){
            action_archive = <a href="#" className="btn btn-primary" onClick={this.removeNotif}>{t('archive')}</a>;
        }

        return (
            <div className="row form-table-row">
                <div className="col-sm-2">{this.props.notif.dateText}</div>
                <div className="col-sm-2">{this.props.notif.appName}</div>
                <div className="col-sm-6" dangerouslySetInnerHTML={{__html: this.props.notif.formattedText}}></div>
                <div className="col-sm-2">
                    {action_by_url} {action_archive}
                </div>
            </div>
            );
    }
});


React.render(
    <NotificationTable url={notificationService} pollInterval={2000}/> ,
    document.getElementById("notifications")
);
